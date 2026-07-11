"""
IAPO — AI extraction layer.

Turns a student's free-text message (and optional transcript text) into a
validated StudentPlanRequest object for the CSP solver.

Two modes:
  * REAL:  if GEMINI_API_KEY is set, calls Gemini with schema-enforced JSON output.
  * MOCK:  if no key is set, returns a placeholder object so the service still
           runs and can be demoed offline. Mock output is clearly flagged in
           metadata.assumptions -- it is NOT real AI output.
"""

import os
import re
from pathlib import Path

# Load GEMINI_API_KEY from a local .env file if one exists (kept out of git by
# .gitignore). Optional: if python-dotenv isn't installed, we just fall back to
# a normal environment variable.
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).with_name(".env"))
except ImportError:
    pass

from schema import (
    StudentPlanRequest, AcademicStanding, HardConstraints,
    ExtractionMetadata, Term, Season, Level,
)

MODEL = "gemini-3.1-flash-lite"

SYSTEM_INSTRUCTION = """You extract academic-planning details from a student's message \
(and optional transcript text) into the provided schema, for a course-scheduling system.

Rules:
1. Use only what the student states or clearly implies. Never invent course codes, \
prerequisites, or degree requirements -- leave anything you don't know empty.
2. completed_courses: include a course only if the student or transcript clearly \
indicates it's finished or in progress. Do NOT infer completion from work experience.
3. When you fill in a sensible default the student did not state, add a short note to \
metadata.assumptions and list that field name in metadata.needs_confirmation.
4. Put anything you can't confidently map to a field into metadata.unparsed_notes.
5. priority_preferences: at most 3, in the student's order of importance.
Return only the JSON object matching the schema."""


def _build_contents(student_text: str, transcript_text: str | None) -> str:
    parts = [f"Student message:\n{student_text}"]
    if transcript_text:
        parts.append(
            "\n\nTranscript text (may list completed courses -- treat as suggestions "
            f"to confirm, not authoritative):\n{transcript_text}"
        )
    return "".join(parts)


def extract_plan(
    student_text: str,
    transcript_text: str | None = None,
    model: str = MODEL,
) -> StudentPlanRequest:
    """Extract a StudentPlanRequest from free-text input."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return _mock_extract(student_text, transcript_text)

    # Imported lazily so the mock path works even without the SDK installed.
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=_build_contents(student_text, transcript_text),
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
    """True if a Gemini key is set (real extraction), False if running mock."""
    return bool(os.environ.get("GEMINI_API_KEY"))


def _mock_extract(student_text: str, transcript_text: str | None) -> StudentPlanRequest:
    """Lightweight offline stand-in. Picks up obvious signals so the demo looks
    responsive, but is clearly labeled as mock -- real extraction needs the API key."""
    text = f"{student_text}\n{transcript_text or ''}"

    codes = [c.replace(" ", "") for c in re.findall(r"\b[A-Z]{2,4}\s?\d{3}\b", text)]
    low = text.lower()
    if "undergrad" in low:
        is_grad = False
    else:
        is_grad = bool(re.search(r"\bgrad|master|\bms\b|m\.s", low))
    level = Level.GRADUATE if is_grad else Level.UNDERGRADUATE
    credit_match = re.search(r"(\d{1,2})\s*credit", text, re.I)
    max_credits = int(credit_match.group(1)) if credit_match else 9

    return StudentPlanRequest(
        standing=AcademicStanding(
            program="MS in Computer Science" if is_grad else "Computer Science",
            level=level,
            completed_courses=codes,
        ),
        hard_constraints=HardConstraints(
            start_term=Term(season=Season.FALL, year=2026),
            max_credits_per_term=max_credits,
        ),
        metadata=ExtractionMetadata(
            assumptions=[
                "MOCK MODE: GEMINI_API_KEY not set -- placeholder output, not real AI.",
                "start_term defaulted to Fall 2026.",
            ],
            needs_confirmation=["start_term", "target_graduation_term", "max_credits_per_term"],
        ),
    )