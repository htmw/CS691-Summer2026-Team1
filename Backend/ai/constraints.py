"""
constraints.py — Layer 2 of the IAPO catalog-reasoning layer.

Turns a student's free text (+ optional form fields) into rows matching the
constraints.csv contract the solver reads:  {ConstraintType, ConstraintValue, Priority}.

Two things are deliberately separated:
  1. EXTRACTION  — an LLM (Gemini) reads the messy human text and proposes
     constraints. Falls back to a deterministic keyword parser offline / when
     no API key is set (mirrors extract.py's mock-fallback pattern).
  2. NORMALIZATION — always runs in code, never trusted to the LLM: canonical
     ConstraintType spelling, canonical values (days/methods/times/semesters),
     and Priority convention. This is what guarantees the solver gets clean,
     joinable strings even when the model (or the human) is sloppy.

Vocabulary note: the seed constraints.csv contains the typo
"AvoidInstuctionMethod". The canonical term here is "AvoidInstructionMethod".
Younes/Anndeen must agree the solver reads the same spelling.

Priority convention (inferred from seed data, confirm with Younes):
    1 = highest / hardest preference, larger = softer.
"""

from __future__ import annotations

import os
import re
from enum import Enum
from typing import List, Optional

try:
    from pydantic import BaseModel, Field
except Exception:  # pydantic should be present (extract.py uses it) but stay importable
    BaseModel = object  # type: ignore
    def Field(*a, **k):  # type: ignore
        return None


# --------------------------------------------------------------------------- #
# Controlled vocabulary
# --------------------------------------------------------------------------- #
class ConstraintType(str, Enum):
    RequiredDaysOff = "RequiredDaysOff"
    AvoidDays = "AvoidDays"
    PreferredDays = "PreferredDays"
    AvoidTime = "AvoidTime"
    PreferredTime = "PreferredTime"
    PreferredInstructionMethod = "PreferredInstructionMethod"
    AvoidInstructionMethod = "AvoidInstructionMethod"   # canonical spelling (seed has a typo)
    MinCredits = "MinCredits"
    MaxCredits = "MaxCredits"
    GraduationDeadline = "GraduationDeadline"


DAY_TYPES = {ConstraintType.RequiredDaysOff, ConstraintType.AvoidDays, ConstraintType.PreferredDays}
TIME_TYPES = {ConstraintType.AvoidTime, ConstraintType.PreferredTime}
METHOD_TYPES = {ConstraintType.PreferredInstructionMethod, ConstraintType.AvoidInstructionMethod}
CREDIT_TYPES = {ConstraintType.MinCredits, ConstraintType.MaxCredits}

_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
_DAY_LOOKUP = {d.lower(): d for d in _WEEKDAYS}
for _d in list(_DAY_LOOKUP):
    _DAY_LOOKUP[_d[:3]] = _DAY_LOOKUP[_d]

_METHODS = {
    "online": "Online", "remote": "Online", "virtual": "Online",
    "in person": "In Person", "in-person": "In Person", "onsite": "In Person",
    "on campus": "In Person", "on-campus": "In Person", "person": "In Person",
    "hybrid": "Hybrid", "blended": "Hybrid",
    "async": "Online", "asynchronous": "Online",   # async sections are all Online in the catalog
}
_TIME_BUCKETS = {
    "morning": "Morning", "am": "Morning", "early": "Morning",
    "afternoon": "Afternoon", "midday": "Afternoon", "noon": "Afternoon",
    "evening": "Evening", "night": "Evening", "pm": "Evening", "late": "Evening",
}


class Constraint(BaseModel):
    ConstraintType: ConstraintType
    ConstraintValue: str
    Priority: int = Field(default=2, ge=1)


# --------------------------------------------------------------------------- #
# Normalization  (always runs in code)
# --------------------------------------------------------------------------- #
def _canon_day(value: str) -> Optional[str]:
    key = str(value).strip().strip('"').strip("'").lower()
    if key in _DAY_LOOKUP:
        return _DAY_LOOKUP[key]
    for name in _WEEKDAYS:
        if name.lower() in key:
            return name
    return None


def _norm_days(value: str) -> Optional[str]:
    days: List[str] = []
    for part in re.split(r"[,/&]| and | or ", str(value)):
        d = _canon_day(part)
        if d and d not in days:
            days.append(d)
    days.sort(key=_WEEKDAYS.index)
    return ", ".join(days) if days else None


def _norm_method(value: str) -> Optional[str]:
    v = str(value).strip().lower()
    for key, canon in _METHODS.items():
        if key in v:
            return canon
    return None


def _norm_time(value: str) -> Optional[str]:
    v = str(value).strip().lower()
    for key, canon in _TIME_BUCKETS.items():
        if re.search(rf"\b{key}\b", v):
            return canon
    if re.search(r"\d\s*(am|pm)|\d{1,2}:\d{2}", v):   # explicit range like "6pm-9pm"
        return str(value).strip()
    return None


def _norm_credits(value: str) -> Optional[str]:
    m = re.search(r"\d+", str(value))
    return m.group(0) if m else None


def _norm_semester(value: str, catalog=None) -> Optional[str]:
    """'Fall 2027' / 'fall2027' -> 'Fall2027'; validate against catalog if given."""
    v = str(value).strip()
    m = re.search(r"(fall|spring|summer|winter)\s*'?\s*(\d{4})", v, re.I)
    if not m:
        return None
    sem = f"{m.group(1).capitalize()}{m.group(2)}"
    if catalog is not None:
        valid = {r.get("SemesterID") for r in catalog.semesters()}
        if valid and sem not in valid:
            return None
    return sem


def normalize(c: Constraint, catalog=None) -> Optional[Constraint]:
    """Return a cleaned Constraint, or None to drop it (unparseable value)."""
    t = c.ConstraintType
    v = c.ConstraintValue
    nv: Optional[str] = None
    if t in DAY_TYPES:
        nv = _norm_days(v)
    elif t in METHOD_TYPES:
        nv = _norm_method(v)
    elif t in TIME_TYPES:
        nv = _norm_time(v)
    elif t in CREDIT_TYPES:
        nv = _norm_credits(v)
    elif t == ConstraintType.GraduationDeadline:
        nv = _norm_semester(v, catalog)
    if not nv:
        return None
    pr = c.Priority if isinstance(c.Priority, int) and c.Priority >= 1 else 2
    return Constraint(ConstraintType=t, ConstraintValue=nv, Priority=pr)


def _dedupe(rows: List[Constraint]) -> List[Constraint]:
    seen, out = set(), []
    for c in rows:
        key = (c.ConstraintType.value, c.ConstraintValue)
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


# --------------------------------------------------------------------------- #
# Deterministic fallback extractor (offline / no API key)
# --------------------------------------------------------------------------- #
def _priority_from_text(span: str) -> int:
    s = span.lower()
    if re.search(r"\b(must|need|require|required|cannot|can't|no |never|only)\b", s):
        return 1
    if re.search(r"\b(prefer|rather|ideally|would like|hope|want)\b", s):
        return 3
    return 2


_DAY_TOKEN = r"(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*"
_AVOID_CUE = r"(?:avoid|no|not|never|can'?t|cannot|don'?t|would rather not|without|skip)"


def _days_in_window(low: str, start: int, span: int = 34) -> str:
    """Pull all canonical weekdays out of a short window (stops at sentence end)."""
    window = low[start:start + span].split(".")[0]
    days = []
    for m in re.finditer(_DAY_TOKEN, window):
        d = _canon_day(m.group(0))
        if d and d not in days:
            days.append(d)
    return ", ".join(days)


def _fallback_extract(text: str) -> List[Constraint]:
    out: List[Constraint] = []
    low = text.lower()

    # RequiredDaysOff: "no classes on friday", "free wednesdays and fridays", "keep monday free"
    for m in re.finditer(r"(?:no (?:class(?:es)?|school)?\s*(?:on)?|off on|free on|free|keep)\s+"
                         + _DAY_TOKEN, low):
        head = re.match(r"\S+\s+", m.group(0))
        cue_start = m.start() + (len(head.group(0)) if head else 0)
        days = _days_in_window(low, cue_start)
        if days:
            out.append(Constraint(ConstraintType=ConstraintType.RequiredDaysOff,
                                  ConstraintValue=days, Priority=1))
    for m in re.finditer(_DAY_TOKEN + r"s?\s+off\b", low):     # "fridays off"
        days = _days_in_window(low, m.start())
        if days:
            out.append(Constraint(ConstraintType=ConstraintType.RequiredDaysOff,
                                  ConstraintValue=days, Priority=1))

    # RequiredDaysOff (day-before-noun): "no friday classes", "no wednesday"
    for m in re.finditer(r"no\s+(" + _DAY_TOKEN + r")\b", low):
        d = _canon_day(m.group(1))
        if d:
            out.append(Constraint(ConstraintType=ConstraintType.RequiredDaysOff,
                                  ConstraintValue=d, Priority=1))

    # AvoidDays: "avoid mondays", "not on tuesday" — but skip days already required off
    days_off = set()
    for c in out:
        if c.ConstraintType == ConstraintType.RequiredDaysOff:
            days_off.update(p.strip() for p in c.ConstraintValue.split(","))
    for m in re.finditer(r"(?:avoid|rather not|not on|steer clear of)\s+(?:\w+\s+){0,2}?("
                         + _DAY_TOKEN + ")", low):
        d = _canon_day(m.group(1))
        if d and d not in days_off:
            out.append(Constraint(ConstraintType=ConstraintType.AvoidDays,
                                  ConstraintValue=d, Priority=2))

    # Instruction method — each method with avoid/prefer context
    for kw, canon in [("online", "Online"), ("remote", "Online"), ("async", "Online"),
                      ("asynchronous", "Online"), ("hybrid", "Hybrid"), ("blended", "Hybrid"),
                      ("in person", "In Person"), ("in-person", "In Person"),
                      ("onsite", "In Person"), ("on campus", "In Person")]:
        for m in re.finditer(re.escape(kw), low):
            before = low[max(0, m.start() - 32):m.start()]
            clause = re.split(r"[,.;]", before)[-1]
            avoid = bool(re.search(_AVOID_CUE, clause))
            t = ConstraintType.AvoidInstructionMethod if avoid else ConstraintType.PreferredInstructionMethod
            out.append(Constraint(ConstraintType=t, ConstraintValue=canon,
                                  Priority=1 if avoid else _priority_from_text(before + kw)))
            break

    # Time preference — each bucket, avoid vs prefer from preceding context
    seen_time = set()
    for key in ["morning", "afternoon", "evening", "night", "noon"]:
        for m in re.finditer(rf"\b{key}s?\b", low):
            before = low[max(0, m.start() - 20):m.start()]
            clause = re.split(r"[,.;]", before)[-1]
            avoid = bool(re.search(_AVOID_CUE, clause))
            t = ConstraintType.AvoidTime if avoid else ConstraintType.PreferredTime
            if (t, key) in seen_time:
                break
            seen_time.add((t, key))
            out.append(Constraint(ConstraintType=t, ConstraintValue=key, Priority=2))
            break

    # Credits
    for m in re.finditer(r"(?:at most|no more than|max(?:imum)?|up to)\s+(\d+)\s*credit", low):
        out.append(Constraint(ConstraintType=ConstraintType.MaxCredits,
                              ConstraintValue=m.group(1), Priority=2))
    for m in re.finditer(r"(?:at least|min(?:imum)?|no fewer than)\s+(\d+)\s*credit", low):
        out.append(Constraint(ConstraintType=ConstraintType.MinCredits,
                              ConstraintValue=m.group(1), Priority=2))

    # Graduation deadline: "graduate by fall 2027"
    for m in re.finditer(r"(?:graduate|finish|done|by)\s+(?:by\s+)?"
                         r"((?:fall|spring|summer|winter)\s*'?\s*\d{4})", low):
        out.append(Constraint(ConstraintType=ConstraintType.GraduationDeadline,
                              ConstraintValue=m.group(1), Priority=1))
    return out


# --------------------------------------------------------------------------- #
# LLM extractor (Gemini structured output)
# --------------------------------------------------------------------------- #
_MODEL = "gemini-3.1-flash-lite"

_SYSTEM = (
    "You extract scheduling constraints from a graduate student's message and return "
    "ONLY constraints that match this exact vocabulary. Do not invent constraints the "
    "student did not express. Use these ConstraintType values verbatim:\n"
    "RequiredDaysOff, AvoidDays, PreferredDays, AvoidTime, PreferredTime, "
    "PreferredInstructionMethod, AvoidInstructionMethod, MinCredits, MaxCredits, "
    "GraduationDeadline.\n"
    "Value guidance: days = weekday names; methods = Online / In Person / Hybrid; "
    "times = Morning / Afternoon / Evening (or an explicit range); credits = a number; "
    "GraduationDeadline = a term like 'Fall2027'.\n"
    "Priority: 1 = hard/required, 2 = default, 3 = soft preference. "
    "Return a JSON list of objects with keys ConstraintType, ConstraintValue, Priority."
)


def _llm_extract(text: str) -> List[Constraint]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    resp = client.models.generate_content(
        model=_MODEL,
        contents=f"{_SYSTEM}\n\nStudent message:\n{text}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=list[Constraint],
            temperature=0,
        ),
    )
    parsed = getattr(resp, "parsed", None)
    if parsed:
        return list(parsed)
    # if the SDK didn't auto-parse, fall back to empty (normalization handles the rest)
    return []


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def _form_to_constraints(form: dict, catalog=None) -> List[Constraint]:
    """Conservative form-field → constraint mapping. Only maps unambiguous fields."""
    out: List[Constraint] = []
    if not form:
        return out
    ending = form.get("endingSemester")
    if ending:
        sem = _norm_semester(ending, catalog)
        if sem:
            out.append(Constraint(ConstraintType=ConstraintType.GraduationDeadline,
                                  ConstraintValue=sem, Priority=2))
    return out


def extract_constraints(chat: str = "", form_fields: Optional[dict] = None,
                        catalog=None, use_llm: Optional[bool] = None) -> List[Constraint]:
    """
    chat        : the student's free-text message.
    form_fields : the flat camelCase bundle from InitChat.jsx (optional).
    catalog     : a Catalog (optional) — used to validate GraduationDeadline terms.
    use_llm     : None = auto (LLM if GEMINI_API_KEY set, else fallback);
                  True/False to force.
    Returns a list of normalized, de-duplicated Constraint objects.
    """
    text = (chat or "").strip()
    have_key = bool(os.environ.get("GEMINI_API_KEY"))
    want_llm = have_key if use_llm is None else use_llm

    raw: List[Constraint] = []
    if want_llm and text:
        try:
            raw = _llm_extract(text)
        except Exception:
            raw = _fallback_extract(text)
    elif text:
        raw = _fallback_extract(text)

    raw += _form_to_constraints(form_fields or {}, catalog)

    normalized = [n for n in (normalize(c, catalog) for c in raw) if n]
    return _dedupe(normalized)


def to_rows(constraints: List[Constraint]) -> List[dict]:
    """Shape constraints into constraints.csv rows (ConstraintID left to the DB)."""
    rows = []
    for c in constraints:
        row = {
            "ConstraintType": c.ConstraintType.value,
            "ConstraintValue": c.ConstraintValue,
            "Priority": c.Priority,
        }
        rows.append(row)
    return rows