"""
IAPO — AI extraction service (Flask / WSGI).

This is the deployable server. Flask (WSGI), not FastAPI (ASGI), because
PythonAnywhere's normal web apps only run WSGI apps. All the real work lives in
extract.py / schema.py / intake.py (extraction) and catalog.py / constraints.py
/ reasoning.py (the catalog-reasoning layer); this file is just the web wrapper.

Endpoints:
  GET  /health   -> {"status": "ok", "mode": ..., "catalog_loaded": true/false}
  POST /extract  -> the StudentPlanRequest PLUS a "recommendation" section
                    (elective rankings + eligibility + candidate plans)

Expected POST body (JSON) -- flat, as the frontend sends it:
  {
    "chat": "...", "degreeLevel": "Graduate", "startingSemester": "Fall 2026",
    "endingSemester": "Spring 2028", "credits": "12", "name": "...",
    "major": "Computer Science", "student_id": "100001",
    "transcript": {"data": "data:application/pdf;base64,...", "name": "t.pdf"}
  }

Local dev:   python flask_app.py    (http://localhost:8000)
"""

from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

from extract import extract_plan, is_real_mode

# --- catalog-reasoning layer ---
from catalog import Catalog
from constraints import extract_constraints
from reasoning import build_recommendation, clean_preferences

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024

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
_CATALOG_DIR = Path(__file__).with_name("data")
try:
    CATALOG = Catalog.from_dir(str(_CATALOG_DIR)) if _CATALOG_DIR.exists() else None
except Exception:
    CATALOG = None

# MVP scope is Pace MS CS only -> MajorID 1 in the catalog.
_MVP_MAJOR_ID = "1"


def _get_transcript(payload: dict):
    t = payload.get("transcript")
    if isinstance(t, dict):
        return t.get("data")
    return t


def _term_to_semester_id(term):
    """schema Term (season+year) -> catalog SemesterID like 'Fall2026'."""
    if not term:
        return None
    try:
        return f"{term.season.value.capitalize()}{term.year}"
    except Exception:
        return None


def _make_recommendation(result, student_text, form, student_id):
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
        student_id=student_id,
        completed=completed,
        constraints=constraints,
        interests=interests,
        career_goals=career_goals,
        major_id=_MVP_MAJOR_ID,
        start_term=_term_to_semester_id(result.hard_constraints.start_term),
    )
    return rec.model_dump(mode="json")


@app.get("/health")
def health():
    return jsonify(status="ok",
                   mode="real" if is_real_mode() else "mock",
                   catalog_loaded=CATALOG is not None)


@app.post("/extract")
def extract():
    """Turn the frontend's inputs into the structured object + recommendation."""
    payload = request.get_json(silent=True) or {}

    student_text = payload.get("chat") or payload.get("ask") or payload.get("student_text") or ""
    form = payload.get("form") or {k: payload[k] for k in _FORM_KEYS if k in payload}
    transcript = _get_transcript(payload)
    student_id = payload.get("student_id")

    try:
        result = extract_plan(student_text=student_text, form=form, transcript=transcript)
    except Exception as exc:
        return jsonify(error=f"Extraction failed: {exc}"), 502

    out = result.model_dump(mode="json")

    # Additive step: attach the recommendation. A failure here must NOT break
    # extraction -- we return the plan and note what went wrong.
    try:
        rec = _make_recommendation(result, student_text, form, student_id)
        out["recommendation"] = rec
        if rec is None:
            out.setdefault("notes", []).append(
                "catalog not loaded (ai/data missing) -- recommendation skipped")
    except Exception as exc:
        out["recommendation"] = None
        out.setdefault("notes", []).append(f"recommendation step failed: {exc}")

    return jsonify(out)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)