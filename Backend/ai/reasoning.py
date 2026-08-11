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

from .catalog import Catalog
from .constraints import Constraint


# --------------------------------------------------------------------------- #
# Output schema
# --------------------------------------------------------------------------- #
class ElectiveRanking(BaseModel):
    course: str
    name: str
    credits: int
    score: float = Field(ge=0.0, le=1.0)
    reason: str


class EligibleCourse(BaseModel):
    course: str
    name: str
    score: float = Field(ge=0.0, le=1.0)
    eligible: bool
    prereqs_met: bool
    missing_prereqs: List[str] = Field(default_factory=list)


class CoreCourseInfo(BaseModel):
    course: str
    name: str
    credits: int


class RemainingRequirements(BaseModel):
    electives_needed: int
    capstone: Optional[str] = None
    capstone_name: Optional[str] = None
    capstone_credits: Optional[int] = None
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
    unscheduled_courses: List[str] = Field(default_factory=list)


class PlanRecommendation(BaseModel):
    completed: List[str] = Field(default_factory=list)
    constraints: List[dict] = Field(default_factory=list)
    elective_rankings: List[ElectiveRanking] = Field(default_factory=list)
    remaining_requirements: Optional[RemainingRequirements] = None
    eligible_next: List[EligibleCourse] = Field(default_factory=list)
    core_courses: List[CoreCourseInfo] = Field(default_factory=list)
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


_SHORT_TERMS_ALLOWED = {"ai", "ml", "os", "db", "ui", "ux", "nlp", "cv", "ar", "vr", "iot"}

def _content_tokens(phrases):
    out = set()
    for p in phrases or []:
        for w in re.split(r"[^a-z0-9]+", str(p).lower()):
            if (len(w) >= 3 or w in _SHORT_TERMS_ALLOWED) and w not in _STOPWORDS:
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
    capstone_name = catalog.course_name(capstone) if capstone else None
    capstone_credits = catalog.credits(capstone) if capstone else None
    if capstone in completed_set:
        capstone = None
        capstone_name = None
        capstone_credits = None

    try:
        total_req = int(req.get("TotalCreditsRequired", 0))
    except Exception:
        total_req = 0
    credits_left = max(0, total_req - _counted_credits(catalog, major_id, completed))

    return RemainingRequirements(
        electives_needed=needed, capstone=capstone, capstone_name=capstone_name,
        capstone_credits=capstone_credits, core_remaining=core_remaining,
        credits_left=credits_left,
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
    completed_set = set(completed)

    def sort_key(c):
        prereqs_met = not (catalog.prereqs_for(c) - completed_set)
        return (scores.get(c, 0.0), prereqs_met)

    pool.sort(key=sort_key, reverse=True)
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
    completed: List[str],
    constraints: List[Constraint],
    interests: Optional[List[str]] = None,
    career_goals: Optional[List[str]] = None,
    major_id: str = "1",
    per_term_courses: int = 2,
    start_term: Optional[str] = None,
    max_credits_per_term: Optional[int] = None,
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
                                        credits=catalog.credits(c) or 3,
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

    candidate_plans = _generate_plan_variants(
        catalog, remaining.core_remaining, ranked_eligible_ids, remaining.capstone, terms,
        scores, honored, max_credits_per_term)

    core_course_info = [
        CoreCourseInfo(course=c, name=catalog.course_name(c) or c, credits=catalog.credits(c) or 3)
        for c in remaining.core_remaining
    ]

    return PlanRecommendation(
        completed=completed,
        constraints=[{"type": c.ConstraintType.value, "value": c.ConstraintValue,
                      "priority": c.Priority} for c in constraints],
        elective_rankings=rankings,
        remaining_requirements=remaining,
        eligible_next=eligible_next,
        core_courses=core_course_info,
        candidate_plans=candidate_plans,
        notes=notes,

    )

def _order_by_prereqs(catalog, course_ids):
    """Order courses so a prereq that's also in the list comes before the
    course that needs it. Stable for courses with no interdependency."""
    remaining = list(course_ids)
    sel = set(remaining)
    ordered, guard = [], 0
    while remaining and guard < 100:
        guard += 1
        progressed = False
        for c in list(remaining):
            unmet = (catalog.prereqs_for(c) & sel) - set(ordered)
            if not unmet:
                ordered.append(c)
                remaining.remove(c)
                progressed = True
        if not progressed:
            ordered.extend(remaining)   # cycle/unsatisfiable -- emit as-is
            break
    return ordered


def _build_plan_by_credit_target(catalog, course_ids, capstone, terms, scores, honored,
                                 max_courses_per_term, cap):
    plan_terms: List[PlanTerm] = []
    remaining = list(course_ids)
    ti = 0
    while remaining and ti < len(terms):
        chunk, credits = [], 0
        while remaining and len(chunk) < max_courses_per_term:
            c = remaining[0]
            c_credits = catalog.credits(c) or 3
            if credits + c_credits > cap:
                break
            chunk.append(remaining.pop(0))
            credits += c_credits
        if not chunk:  # a single course alone exceeds the cap -- take it anyway
            c = remaining.pop(0)
            chunk, credits = [c], catalog.credits(c) or 3
        plan_terms.append(PlanTerm(term=terms[ti], courses=chunk, credits=credits))
        ti += 1

    unscheduled = list(remaining)  # ran out of terms before placing everything

    if capstone:
        cap_credits = catalog.credits(capstone) or 3
        if plan_terms and plan_terms[-1].credits + cap_credits <= cap:
            plan_terms[-1].courses.append(capstone)
            plan_terms[-1].credits += cap_credits
        elif ti < len(terms):
            plan_terms.append(PlanTerm(term=terms[ti], courses=[capstone], credits=cap_credits))
        elif plan_terms:
            plan_terms[-1].courses.append(capstone)
            plan_terms[-1].credits += cap_credits
        else:
            unscheduled.append(capstone)

    scored_picks = [c for c in course_ids if c in scores]
    overall = (round(sum(scores.get(c, 0.0) for c in scored_picks) / len(scored_picks), 2)
              if scored_picks else 1.0)

    n_terms = len(plan_terms)
    avg_credits = round(sum(t.credits for t in plan_terms) / max(n_terms, 1), 1)
    if n_terms <= 1:
        name = "Fastest path (single term)"
    elif avg_credits >= cap * 0.8:
        name = f"Accelerated ({n_terms} terms, ~{avg_credits} credits/term)"
    elif avg_credits <= cap * 0.4:
        name = f"Lighter load ({n_terms} terms, ~{avg_credits} credits/term)"
    else:
        name = f"Balanced pace ({n_terms} terms, ~{avg_credits} credits/term)"

    rationale = (
        f"Schedules your remaining core requirements and best-fit electives across "
        f"{n_terms} term{'s' if n_terms != 1 else ''} at roughly {avg_credits} credits/term, "
        f"capstone last."
    )
    if unscheduled:
        names = ", ".join(catalog.course_name(c) or c for c in unscheduled)
        rationale += (f" NOTE: at this pace, {names} would not fit within your target "
                     f"graduation term -- a heavier course load or a later deadline is needed.")

    return CandidatePlan(plan_name=name, terms=plan_terms, overall_score=overall,
                         honored_aspects=honored, rationale=rationale,
                         unscheduled_courses=unscheduled)


def _generate_plan_variants(catalog, core_ids, elective_ids, capstone, terms, scores, honored,
                            max_credits_per_term):
    if not core_ids and not elective_ids and not capstone:
        return []

    combined = _order_by_prereqs(catalog, list(core_ids) + list(elective_ids))
    cap = max_credits_per_term or 12
    max_courses = max(1, cap // 3)  # how many 3-credit courses actually fit under the cap
    course_tiers = sorted({1, max(1, max_courses // 2), max_courses}, reverse=True)  # heaviest first

    variants, seen_shapes = [], set()
    for tier in course_tiers:
        plan = _build_plan_by_credit_target(catalog, combined, capstone, terms, scores, honored, tier, cap)
        shape = tuple((t.term, tuple(t.courses)) for t in plan.terms)
        if shape in seen_shapes:
            continue
        seen_shapes.add(shape)
        variants.append(plan)

    # complete plans (nothing left unscheduled) always rank ahead of incomplete
    # ones, regardless of pace -- a plan that drops a required course shouldn't
    # win a tie against one that doesn't, just because it happened to score
    # the same on elective fit.
    variants.sort(key=lambda p: bool(p.unscheduled_courses))
    return variants

def _build_plan(name, catalog, elective_ids, capstone, terms, per_term, scores, honored,
                rationale, max_credits_per_term=None):
    plan_terms: List[PlanTerm] = []
    remaining = list(elective_ids)
    ti = 0
    while remaining and ti < len(terms):
        chunk, credits = [], 0
        while remaining and len(chunk) < per_term:
            c = remaining[0]
            c_credits = catalog.credits(c) or 3
            if max_credits_per_term is not None and chunk and credits + c_credits > max_credits_per_term:
                break  # would exceed the cap -- leave it for next term
            chunk.append(remaining.pop(0))
            credits += c_credits
        plan_terms.append(PlanTerm(term=terms[ti], courses=chunk, credits=credits))
        ti += 1
    if capstone:
        cap_credits = catalog.credits(capstone) or 3
        fits_last_term = (
            plan_terms
            and (max_credits_per_term is None
                 or plan_terms[-1].credits + cap_credits <= max_credits_per_term)
        )
        if fits_last_term:
            plan_terms[-1].courses.append(capstone)
            plan_terms[-1].credits += cap_credits
        elif ti < len(terms):
            plan_terms.append(PlanTerm(term=terms[ti], courses=[capstone], credits=cap_credits))
        elif plan_terms:
            plan_terms[-1].courses.append(capstone)
            plan_terms[-1].credits += cap_credits
    picked = elective_ids or []
    overall = round(sum(scores.get(c, 0.0) for c in picked) / max(len(picked), 1), 2)
    return CandidatePlan(plan_name=name, terms=plan_terms, overall_score=overall,
                         honored_aspects=honored, rationale=rationale)