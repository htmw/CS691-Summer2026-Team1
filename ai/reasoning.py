"""
reasoning.py — Layer 3 of the IAPO catalog-reasoning layer (combined output).

Younes asked for ALL THREE directions merged into one response, so this module
produces a single PlanRecommendation object that contains:

  * interpreted preferences (the constraint rows from constraints.py)
  * elective_rankings   (A) — every elective scored 0..1 for fit, with a reason
  * remaining_requirements + eligible_next
                        (B) — what's left in the degree, and which courses the
                              student can actually take next (prereqs checked)
  * candidate_plans     (C) — a couple of drafted term-by-term plans

Framing that keeps this MVP-safe (per Younes): the AI *proposes*, the solver
*decides*. candidate_plans are suggestions the solver validates against live
section times / seats and may override or bounce back. Nothing here is a final
schedule.

Scoring is deterministic and explainable (keyword + career-tag overlap), so it
runs offline, is testable, and every score can be traced to a reason. A Gemini
pass could later refine the reason text, but the numbers don't depend on it.

Everything reads from a Catalog, so it's database-agnostic: CSVs today,
DynamoDB later, same code.
"""

from __future__ import annotations

import re
from typing import List, Optional

from pydantic import BaseModel, Field

from catalog import Catalog
from constraints import Constraint


# --------------------------------------------------------------------------- #
# Output schema
# --------------------------------------------------------------------------- #
class ElectiveRanking(BaseModel):
    course: str
    name: str
    score: float = Field(ge=0.0, le=1.0)
    reason: str


class EligibleCourse(BaseModel):
    course: str
    name: str
    score: float = Field(ge=0.0, le=1.0)
    eligible: bool
    prereqs_met: bool
    missing_prereqs: List[str] = Field(default_factory=list)


class RemainingRequirements(BaseModel):
    electives_needed: int
    capstone: Optional[str] = None
    core_remaining: List[str] = Field(default_factory=list)
    credits_left: int


class PlanTerm(BaseModel):
    term: str
    courses: List[str]
    credits: int


class CandidatePlan(BaseModel):
    plan_name: str
    terms: List[PlanTerm]
    overall_score: float = Field(ge=0.0, le=1.0)
    honored_aspects: List[str] = Field(default_factory=list)
    rationale: str


class PlanRecommendation(BaseModel):
    student_id: Optional[str] = None
    completed: List[str] = Field(default_factory=list)
    constraints: List[dict] = Field(default_factory=list)
    elective_rankings: List[ElectiveRanking] = Field(default_factory=list)
    remaining_requirements: Optional[RemainingRequirements] = None
    eligible_next: List[EligibleCourse] = Field(default_factory=list)
    candidate_plans: List[CandidatePlan] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Scoring (deterministic, explainable)
# --------------------------------------------------------------------------- #
def _tokens(phrases: List[str]) -> set:
    out = set()
    for p in phrases or []:
        for w in re.split(r"[^a-z0-9]+", str(p).lower()):
            if len(w) >= 2:
                out.add(w)
    return out


_STOPWORDS = {"and", "the", "for", "with", "your", "want", "like", "prefer",
              "classes", "class", "sections", "section", "semester", "term",
              "credits", "credit", "online", "evening", "morning", "afternoon",
              "friday", "monday", "tuesday", "wednesday", "thursday", "saturday",
              "sunday", "days", "day", "off", "graduate", "load", "workload",
              "lighter", "heavier", "balanced", "engineering", "engineer"}

# Phrases that are scheduling constraints, not interests/goals. If a preference
# string looks like one of these it is dropped before scoring, otherwise it
# pollutes the vocabulary and drags every course score toward zero.
_CONSTRAINT_HINTS = ("day", "friday", "monday", "tuesday", "wednesday", "thursday",
                     "saturday", "sunday", "online", "in person", "in-person",
                     "hybrid", "evening", "morning", "afternoon", "night",
                     "credit", "workload", "graduate by", "no ", "avoid",
                     "section", "schedule")


def clean_preferences(values):
    """Drop scheduling-constraint phrases from interest/goal lists."""
    out = []
    for v in values or []:
        s = str(v).strip()
        if not s:
            continue
        low = s.lower()
        if any(h in low for h in _CONSTRAINT_HINTS):
            continue
        out.append(s)
    return out


def _content_tokens(phrases):
    """Meaningful words only — drops stopwords and scheduling noise."""
    out = set()
    for p in phrases or []:
        for w in re.split(r"[^a-z0-9]+", str(p).lower()):
            if len(w) >= 3 and w not in _STOPWORDS:
                out.add(w)
    return out


def _score_elective(catalog: Catalog, course_id: str,
                    interests: List[str], career_goals: List[str]):
    """Return (score 0..1, reason). Higher = better fit to what the student wants.

    Three signals, all explainable:
      career match  (0.45) — a stated career goal overlaps one of the course's
                             CareerTags on words, so "AI engineering" still
                             matches the tag "AI Engineer"
      topic match   (0.35) — how much of the student's topic vocabulary appears
                             in the course keywords/name
      breadth match (0.20) — any remaining overlap across all course vocabulary
    """
    interests = clean_preferences(interests)
    career_goals = clean_preferences(career_goals)

    tags = catalog.career_tags(course_id)
    keywords = catalog.course_keywords(course_id)
    name = catalog.course_name(course_id) or course_id

    tag_toks = _content_tokens(tags)
    kw_toks = _content_tokens(keywords + [name])
    course_toks = tag_toks | kw_toks

    interest_toks = _content_tokens(interests)
    goal_toks = _content_tokens(career_goals)
    want_toks = interest_toks | goal_toks

    if not want_toks:
        return 0.5, f"{name} — no stated interests, neutral fit"

    # 1) career match: word overlap between a goal and a CareerTag.
    career_score = 0.0
    matched_tag = None
    for g in career_goals:
        g_toks = _content_tokens([g])
        if not g_toks:
            continue
        for t in tags:
            t_toks = _content_tokens([t])
            if not t_toks:
                continue
            overlap = len(g_toks & t_toks) / len(g_toks)
            if overlap > career_score:
                career_score = overlap
                matched_tag = t
    career_score = min(1.0, career_score)

    # 2) topic match: student's interests vs course keywords
    topic_score = (len(interest_toks & kw_toks) / len(interest_toks)) if interest_toks else 0.0

    # 3) breadth: everything the student wants vs everything the course covers
    breadth = len(want_toks & course_toks) / len(want_toks)

    score = 0.45 * career_score + 0.35 * topic_score + 0.20 * breadth
    score = round(min(1.0, max(0.0, score)), 2)

    matched_kw = sorted(interest_toks & kw_toks)
    if career_score >= 0.5 and matched_kw:
        reason = f"{name} — fits your {matched_tag} goal and covers {matched_kw[0]}"
    elif career_score >= 0.5:
        reason = f"{name} — listed for {matched_tag}"
    elif matched_kw:
        reason = f"{name} — covers {', '.join(matched_kw[:2])}"
    else:
        reason = f"{name} — limited overlap with your interests"
    return score, reason


# --------------------------------------------------------------------------- #
# Degree progress + eligibility
# --------------------------------------------------------------------------- #
def _counted_credits(catalog: Catalog, major_id: str, completed: List[str]) -> int:
    """Credits from completed courses that count toward THIS major (core/elective/
    capstone) — excludes bridge courses like CS505."""
    counts_toward = set(catalog.core(major_id) + catalog.electives(major_id)
                        + catalog.capstone(major_id))
    total = 0
    for c in completed:
        if c in counts_toward:
            total += catalog.credits(c) or 0
    return total


def _remaining(catalog: Catalog, major_id: str, completed: List[str]) -> RemainingRequirements:
    req = catalog.degree_requirement(major_id) or {}
    completed_set = set(completed)

    all_electives = catalog.electives(major_id)
    electives_done = [c for c in all_electives if c in completed_set]
    try:
        needed = int(req.get("ElectiveCreditsRequired", 0)) // 3 - len(electives_done)
    except Exception:
        needed = max(0, (catalog.electives_needed(major_id) or 0) - len(electives_done))
    needed = max(0, needed)

    core_remaining = [c for c in catalog.core(major_id) if c not in completed_set]
    caps = catalog.capstone(major_id)
    capstone = caps[0] if caps else None
    if capstone in completed_set:
        capstone = None

    try:
        total_req = int(req.get("TotalCreditsRequired", 0))
    except Exception:
        total_req = 0
    credits_left = max(0, total_req - _counted_credits(catalog, major_id, completed))

    return RemainingRequirements(
        electives_needed=needed, capstone=capstone,
        core_remaining=core_remaining, credits_left=credits_left,
    )


def _eligibility(catalog: Catalog, courses: List[str], completed: List[str], scores: dict):
    completed_set = set(completed)
    out = []
    for c in courses:
        if c in completed_set:
            continue
        prereqs = catalog.prereqs_for(c)
        missing = sorted(prereqs - completed_set)
        prereqs_met = not missing
        out.append(EligibleCourse(
            course=c, name=catalog.course_name(c) or c,
            score=scores.get(c, 0.0), eligible=prereqs_met,
            prereqs_met=prereqs_met, missing_prereqs=missing,
        ))
    return out


# --------------------------------------------------------------------------- #
# Candidate plans (suggestions — solver validates)
# --------------------------------------------------------------------------- #
def _honored(constraints: List[Constraint]) -> List[str]:
    labels = []
    for c in constraints:
        t = c.ConstraintType.value
        v = c.ConstraintValue
        if t == "RequiredDaysOff":
            labels.append(f"no {v}")
        elif t == "PreferredInstructionMethod":
            labels.append(f"{v.lower()}-preferred")
        elif t == "PreferredTime":
            labels.append(f"{v.lower()} sections")
        elif t == "GraduationDeadline":
            labels.append(f"graduate by {v}")
    return labels


def _term_window(catalog: Catalog, start_term: Optional[str],
                 grad_term: Optional[str], limit: int = 8) -> List[str]:
    """SemesterIDs in chronological order, bounded to [start_term .. grad_term]
    when those are given. Falls back to offering SemesterIDs if the table is thin."""
    ordered = [r.get("SemesterID") for r in catalog.semesters_in_order() if r.get("SemesterID")]
    if not ordered:
        ordered = []
        for r in catalog.courses_offered():
            s = r.get("SemesterID")
            if s and s not in ordered:
                ordered.append(s)
    pos = {s: i for i, s in enumerate(ordered)}
    lo = pos.get(start_term, 0)
    hi = pos.get(grad_term, len(ordered) - 1)
    if hi < lo:
        hi = len(ordered) - 1
    return ordered[lo:hi + 1][:limit]


def _select_electives(catalog, electives, completed, scores, needed):
    """Pick the `needed` best-fit electives by score, then order them so a
    prerequisite that is itself selected comes before the course that needs it.
    (Taking CS627 first makes CS672 eligible next term.)"""
    pool = [c for c in electives if c not in set(completed)]
    pool.sort(key=lambda c: scores.get(c, 0.0), reverse=True)
    selected = pool[:max(0, needed)]
    sel = set(selected)
    ordered, remaining, guard = [], list(selected), 0
    while remaining and guard < 100:
        guard += 1
        progressed = False
        for c in list(remaining):
            unmet = (catalog.prereqs_for(c) & sel) - set(ordered)
            if not unmet:
                ordered.append(c)
                remaining.remove(c)
                progressed = True
        if not progressed:            # cycle / unsatisfiable — emit the rest as-is
            ordered.extend(remaining)
            break
    return ordered


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #
def build_recommendation(
    catalog: Catalog,
    student_id: Optional[str],
    completed: List[str],
    constraints: List[Constraint],
    interests: Optional[List[str]] = None,
    career_goals: Optional[List[str]] = None,
    major_id: str = "1",
    per_term_courses: int = 2,
    start_term: Optional[str] = None,
) -> PlanRecommendation:
    interests = interests or []
    career_goals = career_goals or []
    completed = completed or []
    notes = ["candidate_plans are suggestions; the solver validates them against "
             "live section times, seats, and conflicts and may override them."]

    # --- A: rank every elective for this major ---
    electives = catalog.electives(major_id)
    scores = {}
    rankings: List[ElectiveRanking] = []
    for c in electives:
        s, reason = _score_elective(catalog, c, interests, career_goals)
        scores[c] = s
        rankings.append(ElectiveRanking(course=c, name=catalog.course_name(c) or c,
                                        score=s, reason=reason))
    rankings.sort(key=lambda r: r.score, reverse=True)

    # --- B: remaining requirements + eligibility of not-yet-taken electives ---
    remaining = _remaining(catalog, major_id, completed)
    eligible_next = _eligibility(catalog, electives, completed, scores)
    eligible_next.sort(key=lambda e: (e.eligible, e.score), reverse=True)

    # --- C: two candidate plans over the upcoming terms ---
    grad_term = next((c.ConstraintValue for c in constraints
                      if c.ConstraintType.value == "GraduationDeadline"), None)
    terms = _term_window(catalog, start_term, grad_term)
    honored = _honored(constraints)
    ranked_eligible_ids = _select_electives(
        catalog, electives, completed, scores, remaining.electives_needed)

    plan_a = _build_plan("AI-focused, front-loaded", catalog, ranked_eligible_ids,
                         remaining.capstone, terms, per_term_courses, scores, honored,
                         "Takes your best-fit electives as early as prerequisites allow, "
                         "capstone last.")
    plan_b = _build_plan("Lighter load, one course per term", catalog, ranked_eligible_ids,
                         remaining.capstone, terms, 1, scores, honored,
                         "Spreads the same courses out at one per term for a lighter workload.")

    return PlanRecommendation(
        student_id=student_id,
        completed=completed,
        constraints=[{"type": c.ConstraintType.value, "value": c.ConstraintValue,
                      "priority": c.Priority} for c in constraints],
        elective_rankings=rankings,
        remaining_requirements=remaining,
        eligible_next=eligible_next,
        candidate_plans=[plan_a, plan_b],
        notes=notes,
    )


def _build_plan(name, catalog, elective_ids, capstone, terms, per_term, scores, honored, rationale):
    plan_terms: List[PlanTerm] = []
    remaining = list(elective_ids)
    ti = 0
    while remaining and ti < len(terms):
        chunk = remaining[:per_term]
        remaining = remaining[per_term:]
        credits = sum(catalog.credits(c) or 3 for c in chunk)
        plan_terms.append(PlanTerm(term=terms[ti], courses=chunk, credits=credits))
        ti += 1
    if capstone:
        if ti < len(terms):
            plan_terms.append(PlanTerm(term=terms[ti], courses=[capstone],
                                       credits=catalog.credits(capstone) or 3))
        elif plan_terms:
            plan_terms[-1].courses.append(capstone)
            plan_terms[-1].credits += catalog.credits(capstone) or 3
    picked = elective_ids or []
    overall = round(sum(scores.get(c, 0.0) for c in picked) / max(len(picked), 1), 2)
    return CandidatePlan(plan_name=name, terms=plan_terms, overall_score=overall,
                         honored_aspects=honored, rationale=rationale)