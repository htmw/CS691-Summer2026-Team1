from schemas import ScheduleInfo
from fastapi import HTTPException
from decimal import Decimal

from pathlib import Path
from typing import Dict, List
from .extract import extract_plan, is_real_mode

# --- catalog-reasoning layer ---
from .catalog import Catalog
from .constraints import extract_constraints
from .reasoning import build_recommendation, clean_preferences
from .solver import schedule_solve
from io import BytesIO
import base64
import traceback

from aws import CATALOG_TABLE_NAMES, dynamodb_east_1

_FORM_KEYS = ["name", "degreeLevel", "major", "startingSemester", "endingSemester", "credits"]

# ---------------------------------------------------------------------------
# Load the course catalog ONCE at startup (not per request).
#
# Today: reads the CSVs in ai/data/.  When DynamoDB is ready, replace the
# from_dir(...) line with:   CATALOG = Catalog.from_records(<rows from DynamoDB>)
# and you can delete the data/ folder. Everything downstream stays the same.
#
# If the folder is missing, the server still starts and just skips the
# recommendation (extraction keeps working), so a missing data/ never 500s.
# ---------------------------------------------------------------------------
Row = Dict[str, str]
def _stringify(row: Row) -> Row:
    return {k: (str(v) if isinstance(v, Decimal) else v) for k, v in row.items()}
def _read_dynamodb_table(table_name: str) -> List[Row]:

    table = dynamodb_east_1.Table(table_name)
    rows: List[Row] = []
    response = table.scan()
    rows.extend(_stringify(r) for r in response.get("Items", []))
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        rows.extend(_stringify(r) for r in response.get("Items", []))
    return rows

def _load_catalog_from_dynamodb() -> Catalog:
    """Load the entire catalog from DynamoDB in us-east-1."""
    tables: Dict[str, List[Row]] = {}

    for table_name in CATALOG_TABLE_NAMES:
        tables[table_name] = _read_dynamodb_table(table_name)

    return Catalog.from_records(tables)

try:
    CATALOG = _load_catalog_from_dynamodb()
except Exception:
    CATALOG = None


# MVP scope is Pace MS CS only -> MajorID 1 in the catalog.
_MVP_MAJOR_ID = "1"


def _resolve_major_id(form: dict) -> str:
    major_name = (form or {}).get("major")
    if CATALOG is not None and major_name:
        resolved = CATALOG.major_id_for_name(major_name)
        if resolved:
            return resolved
    return _MVP_MAJOR_ID

def _term_to_semester_id(term):
    """schema Term (season+year) -> catalog SemesterID like 'Fall2026'."""
    if not term:
        return None
    try:
        return f"{term.season.value.capitalize()}{term.year}"
    except Exception:
        return None


def _make_recommendation(result, student_text, form):
    """Run the catalog-reasoning layer on top of the extracted plan.
    Returns a JSON-safe dict, or None if the catalog isn't loaded."""
    if CATALOG is None:
        return None

    prefs = result.preferences
    # Interests/goals come from the extracted preferences. Gemini often puts
    # scheduling wishes ("no Friday classes") into priority_preferences, so we
    # strip those out here -- they're already captured as constraints, and
    # feeding them to the scorer pollutes the topic vocabulary.
    interests = clean_preferences(list(prefs.topic_interests)
                                  + list(prefs.priority_preferences))
    career_goals = clean_preferences(list(prefs.topic_interests)
                                     + list(prefs.priority_preferences))

    completed = list(result.standing.completed_courses) + list(result.standing.in_progress_courses)
    constraints = extract_constraints(chat=student_text, form_fields=form, catalog=CATALOG)

    rec = build_recommendation(
        catalog=CATALOG,
        completed=completed,
        constraints=constraints,
        interests=interests,
        career_goals=career_goals,
        major_id= _resolve_major_id(form),
        start_term=_term_to_semester_id(result.hard_constraints.start_term),
        max_credits_per_term=result.hard_constraints.max_credits_per_term,
    )
    return rec.model_dump(mode="json")


def extractSchedule(data: ScheduleInfo):
    """Turn the frontend's inputs into the structured object + recommendation."""
    student_text = data.chat
    form = {
        "degreeLevel": data.degreeLevel,
        "major": data.major,
        "startingSemester": data.startingSemester,
        "endingSemester": data.endingSemester,
        "credits": data.credits,
    }
    transcript = None

    if data.transcript and data.transcript.data and data.transcript.name:
        transcript_data = data.transcript.data

        # Remove data URI prefix if present:
        # data:application/pdf;base64,...
        if "," in transcript_data:
            transcript_data = transcript_data.split(",", 1)[1]

        pdf_bytes = base64.b64decode(transcript_data)

        # Create a file-like object for pypdf
        transcript = BytesIO(pdf_bytes)


    try:
        result = extract_plan(student_text=student_text, form=form, transcript=transcript)
    except Exception as exc:
        tb = traceback.format_exc()
        raise HTTPException(
           status_code=502,
            detail=f"Extraction failed: {exc}\n\nTraceback:\n{tb}",
        )

    out = result.model_dump(mode="json")

    # Additive step: attach the recommendation. A failure here must NOT break
    # extraction -- we return the plan and note what went wrong.
    try:
        rec = _make_recommendation(result, student_text, form)
        out["recommendation"] = rec
        if rec is None:
            out.setdefault("notes", []).append(
                "catalog not loaded (ai/data missing) -- recommendation skipped")
    except Exception as exc:
        out["recommendation"] = None
        out.setdefault("notes", []).append(f"recommendation step failed: {exc}")



    return schedule_solve(out)

def checkHealth():
    return {
        "status": "ok",
        "mode": "real" if is_real_mode() else "mock",
        "catalog_loaded": CATALOG is not None,
        "catalog": CATALOG.tables if CATALOG is not None else None,
        "catalog_summary": CATALOG.summary() if CATALOG is not None else None,
    }

