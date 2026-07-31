"""
IAPO — AI extraction service (Flask / WSGI).

This is the deployable server. It's Flask (WSGI) rather than FastAPI (ASGI)
because PythonAnywhere's normal web apps only run WSGI apps -- FastAPI won't
deploy there on the standard setup. All the real work still lives in
extract.py / schema.py / intake.py; this file is just the web wrapper.

Endpoints:
  GET  /health   -> {"status": "ok", "mode": "real" | "mock"}
  POST /extract  -> a StudentPlanRequest as JSON (what the CSP solver consumes)

Expected POST body (JSON) -- matches what the frontend actually sends (flat):
  {
    "chat": "I'm into ML and want a lighter fall semester...",
    "degreeLevel": "Graduate",
    "startingSemester": "Fall 2026",
    "endingSemester": "Spring 2028",
    "credits": "12",
    "name": "Jordan Lee",
    "major": "Computer Science",
    "transcript": {"data": "data:application/pdf;base64,JVBERi0...", "name": "t.pdf"}
  }
  (A nested {"form": {...}} and "ask"/"student_text" are also accepted.)

Local dev:   python flask_app.py    (runs on http://localhost:8000)
PythonAnywhere: the WSGI file imports `app` from this module (see README notes).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from extract import extract_plan, is_real_mode

app = Flask(__name__)

# The React frontend runs on a DIFFERENT origin than this API, so without CORS
# headers the browser silently blocks every request. "*" is fine while testing;
# before you submit, replace it with your real frontend URL, e.g.
#   {"origins": ["https://yourfrontend.example.com"]}
CORS(app, resources={r"/*": {"origins": "*"}})

# A base64 transcript is ~1.3x the size of the PDF, so allow headroom over the
# frontend's 5 MB PDF limit. Requests larger than this get a clean 413.
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024


# The frontend sends these fields flat (top level of the JSON), not nested.
_FORM_KEYS = ["name", "degreeLevel", "major", "startingSemester", "endingSemester", "credits"]


def _get_transcript(payload: dict):
    """The frontend stores the transcript as {data, name}. It may send that whole
    object, or just the data-URL string. Accept either; return None if absent."""
    t = payload.get("transcript")
    if isinstance(t, dict):
        return t.get("data")
    return t


@app.get("/health")
def health():
    # Handy for confirming the deploy is alive AND whether the API key is wired.
    return jsonify(status="ok", mode="real" if is_real_mode() else "mock")


@app.post("/extract")
def extract():
    """Turn the frontend's inputs into the structured constraint object."""
    payload = request.get_json(silent=True) or {}

    # Free-text box: the frontend (InitChat.jsx) names it "chat".
    student_text = payload.get("chat") or payload.get("ask") or payload.get("student_text") or ""

    # Frontend sends the form fields flat, so gather them from the top level.
    # (Also accept a nested "form" object, which is what the tests send.)
    form = payload.get("form") or {k: payload[k] for k in _FORM_KEYS if k in payload}

    transcript = _get_transcript(payload)

    try:
        result = extract_plan(
            student_text=student_text,
            form=form,
            transcript=transcript,
        )
    except Exception as exc:  # surface a clean JSON error to the caller
        return jsonify(error=f"Extraction failed: {exc}"), 502

    # StudentPlanRequest is a Pydantic model; mode="json" converts enums and
    # nested objects into plain JSON-safe values the frontend can read.
    return jsonify(result.model_dump(mode="json"))


if __name__ == "__main__":
    # Local development only. On PythonAnywhere the WSGI file imports `app`
    # directly and this block is never run.
    app.run(host="0.0.0.0", port=8000, debug=True)