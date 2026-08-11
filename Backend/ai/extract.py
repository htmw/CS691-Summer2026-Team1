"""
IAPO — AI extraction layer.

Turns everything the frontend collects into a validated StudentPlanRequest
object for the CSP solver. Three inputs, in order of trust:

  * form         -- the clean fields the student picked in the UI
                    (degreeLevel, startingSemester, endingSemester, credits, name...).
                    These are CONFIRMED values, so we treat them as authoritative.
  * student_text -- the free-text box ("ask"): fuzzy wishes the AI interprets.
  * transcript   -- the uploaded PDF. The frontend sends it as a base64 "data URL"
                    (data:application/pdf;base64,....). We decode it to text here.

Two modes:
  * REAL:  if GEMINI_API_KEY is set, calls Gemini with schema-enforced JSON output.
  * MOCK:  if no key is set, returns a placeholder object so the service still
           runs and can be demoed offline. Mock output is clearly flagged in
           metadata.assumptions -- it is NOT real AI output.
"""

import base64
import re
from pathlib import Path
from config import GEMINI_API_KEY

from .schema import (StudentPlanRequest, AcademicStanding, HardConstraints,ExtractionMetadata, Term, Season, Level)

# PDF-to-text lives in intake.py so we don't duplicate it. If intake isn't
# importable for some reason, we fall back to a tiny local reader so the
# transcript path still works.
try:
    from intake import read_pdf_text
except Exception:  # pragma: no cover
    def read_pdf_text(source) -> str:
        import io
        from pypdf import PdfReader
        if isinstance(source, (bytes, bytearray)):
            source = io.BytesIO(source)
        reader = PdfReader(source)
        return "\n".join((p.extract_text() or "") for p in reader.pages).strip()

MODEL = "gemini-3.1-flash-lite"

SYSTEM_INSTRUCTION = """You extract academic-planning details from a student's message \
(plus confirmed form values and optional transcript text) into the provided schema, \
for a course-scheduling system.

Rules:
1. The "Confirmed form values" block was selected by the student directly in the UI. \
Treat it as authoritative: use those values as-is, do NOT override them from the free \
text, and do NOT list those fields in metadata.needs_confirmation.
2. Use only what the student states or clearly implies. Never invent course codes, \
prerequisites, or degree requirements -- leave anything you don't know empty.
3. completed_courses: include a course only if the student or transcript clearly \
indicates it's finished or in progress. Do NOT infer completion from work experience.
4. When you fill in a sensible default the student did not state, add a short note to \
metadata.assumptions and list that field name in metadata.needs_confirmation.
5. Put anything you can't confidently map to a field into metadata.unparsed_notes.
6. priority_preferences: at most 3, in the student's order of importance.
Return only the JSON object matching the schema."""


# Each field: the accepted key(s) from the frontend -> the label the AI sees.
# Frontend uses camelCase; snake_case is accepted as a fallback so nothing breaks.
_FORM_FIELDS = [
    (("name",), "Name"),
    (("degreeLevel", "degree_level"), "Degree level"),
    (("major",), "Major"),
    (("startingSemester", "starting_semester"), "Starting semester"),
    (("endingSemester", "ending_semester"), "Ending / target graduation semester"),
    (("credits",), "Max credits per term"),
]


def _first(form: dict, keys) -> str | None:
    """Return the first non-empty value among `keys` (handles camel/snake)."""
    for k in keys:
        v = form.get(k)
        if v not in (None, ""):
            return v
    return None


def _form_lines(form: dict | None) -> list[str]:
    """Turn the form dict into readable 'Label: value' lines for the prompt."""
    if not form:
        return []
    lines = []
    for keys, label in _FORM_FIELDS:
        val = _first(form, keys)
        if val is not None:
            lines.append(f"- {label}: {val}")
    return lines


def _transcript_to_text(transcript, transcript_text: str | None) -> str | None:
    """Normalize whatever we're handed for the transcript into plain text.

    Accepts, in order:
      * transcript_text -- already-extracted text (used as-is if given)
      * a base64 data URL string  (what the frontend sends: 'data:application/pdf;base64,...')
      * raw PDF bytes
      * a path to a .pdf file on disk
      * a plain-text string (treated as the transcript text itself)
    Returns None if there's nothing usable.
    """
    if transcript_text:
        return transcript_text
    if not transcript:
        return None

    # Raw bytes -> read as PDF.
    if isinstance(transcript, (bytes, bytearray)):
        return read_pdf_text(transcript)

    if isinstance(transcript, str):
        s = transcript.strip()
        if not s:
            return None
        # Frontend format: data:application/pdf;base64,<...>
        if s.startswith("data:"):
            b64 = s.split(",", 1)[1] if "," in s else ""
            return read_pdf_text(base64.b64decode(b64))
        # A path to a PDF on disk.
        if s.lower().endswith(".pdf") and Path(s).exists():
            return read_pdf_text(s)
        # Otherwise assume it's already the transcript text.
        return s

    # A file-like object (has .read()).
    return read_pdf_text(transcript)


def _build_contents(student_text: str, transcript_text: str | None, form: dict | None) -> str:
    parts = []

    form_lines = _form_lines(form)
    if form_lines:
        parts.append(
            "Confirmed form values (selected by the student in the UI -- authoritative, "
            "do not override from the free text):\n" + "\n".join(form_lines)
        )

    parts.append(f"\n\nStudent message:\n{student_text or '(none provided)'}")

    if transcript_text:
        parts.append(
            "\n\nTranscript text (may list completed courses -- treat as suggestions "
            f"to confirm, not authoritative):\n{transcript_text}"
        )
    return "".join(parts)


def extract_plan(
    student_text: str = "",
    form: dict | None = None,
    transcript=None,
    transcript_text: str | None = None,
    model: str = MODEL,
) -> StudentPlanRequest:
    """Extract a StudentPlanRequest from the frontend's inputs.

    Args:
        student_text:    the free-text "ask" box.
        form:            dict of confirmed form fields (degreeLevel, startingSemester,
                         endingSemester, credits, name, major...). camelCase or snake_case.
        transcript:      the uploaded transcript -- a base64 data URL (what the frontend
                         sends), PDF bytes, a .pdf path, or plain text.
        transcript_text: already-extracted transcript text (skips PDF decoding).
    """
    transcript_text = _transcript_to_text(transcript, transcript_text)

    if not GEMINI_API_KEY:
        return _mock_extract(student_text, transcript_text, form)

    api_key = GEMINI_API_KEY


    # Imported lazily so the mock path works even without the SDK installed.
    from google import genai
    from google.genai import types

    client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(
        timeout=60_000,
        retry_options=types.HttpRetryOptions(
            attempts=3,
            initial_delay=1.0,
            max_delay=8.0,
            exp_base=2.0,
            jitter=1.0,
        ),
    ),
)

    response = client.models.generate_content(
        model=model,
        contents=_build_contents(student_text, transcript_text, form),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=StudentPlanRequest,
        ),
    )
    # With response_schema set, the SDK returns an already-parsed object.
    # Fall back to manual validation (our safety net) if needed.
    if isinstance(response.parsed, StudentPlanRequest):
        return response.parsed
    return StudentPlanRequest.model_validate_json(response.text)


def is_real_mode() -> bool:
    """True if a Gemini key is configured, False if running mock."""
    return bool(GEMINI_API_KEY)



def _parse_term(text: str | None) -> Term | None:
    """Turn 'Fall 2027' into a Term. Returns None if it can't be read."""
    if not text:
        return None
    m = re.search(r"(fall|spring|summer|winter)\s*(\d{4})", str(text), re.I)
    if not m:
        return None
    # getattr guards against a season name the enum doesn't define.
    season = getattr(Season, m.group(1).upper(), Season.FALL)
    return Term(season=season, year=int(m.group(2)))


def _mock_extract(student_text: str, transcript_text: str | None, form: dict | None) -> StudentPlanRequest:
    """Lightweight offline stand-in. Prefers the confirmed form values, then falls
    back to reading signals out of the text. Clearly labeled as mock -- real
    extraction needs the API key."""
    form = form or {}
    text = f"{student_text}\n{transcript_text or ''}"
    assumptions = ["MOCK MODE: GEMINI_API_KEY not set -- placeholder output, not real AI."]

    codes = [c.replace(" ", "") for c in re.findall(r"\b[A-Z]{2,4}\s?\d{3}\b", text)]

    # --- Degree level: form first, then text heuristic ---
    form_level = (_first(form, ("degreeLevel", "degree_level")) or "").lower()
    if form_level:
        is_grad = form_level.startswith("grad")   # 'Graduate' -> grad
    else:
        low = text.lower()
        is_grad = ("undergrad" not in low) and bool(re.search(r"\bgrad|master|\bms\b|m\.s", low))
    level = Level.GRADUATE if is_grad else Level.UNDERGRADUATE

    # --- Program: use the major if the student gave one ---
    major = _first(form, ("major",))
    if major:
        program = f"MS in {major}" if is_grad else major
    else:
        program = "MS in Computer Science" if is_grad else "Computer Science"

    # --- Max credits: form first, then '9 credits' style text ---
    form_credits = _first(form, ("credits",))
    if form_credits and str(form_credits).strip().isdigit():
        max_credits = int(form_credits)
    else:
        credit_match = re.search(r"(\d{1,2})\s*credit", text, re.I)
        max_credits = int(credit_match.group(1)) if credit_match else 9
        assumptions.append("max_credits_per_term defaulted (no form value).")

    # --- Start term: parse the form's starting semester, else default Fall 2026 ---
    start_term = _parse_term(_first(form, ("startingSemester", "starting_semester")))
    if start_term is None:
        start_term = Term(season=Season.FALL, year=2026)
        assumptions.append("start_term defaulted to Fall 2026.")

    needs_confirmation = []
    if not _first(form, ("startingSemester", "starting_semester")):
        needs_confirmation.append("start_term")
    if not _first(form, ("endingSemester", "ending_semester")):
        needs_confirmation.append("target_graduation_term")
    if not form_credits:
        needs_confirmation.append("max_credits_per_term")

    return StudentPlanRequest(
        standing=AcademicStanding(
            program=program,
            level=level,
            completed_courses=codes,
        ),
        hard_constraints=HardConstraints(
            start_term=start_term,
            max_credits_per_term=max_credits,
        ),
        metadata=ExtractionMetadata(
            assumptions=assumptions,
            needs_confirmation=needs_confirmation,
        ),
    )