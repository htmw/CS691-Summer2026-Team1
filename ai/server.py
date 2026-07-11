"""
IAPO — AI extraction service (FastAPI).

Run:
    uvicorn server:app --reload

Then POST to /extract with JSON:
    { "student_text": "...", "transcript_text": "...optional..." }

Returns a validated StudentPlanRequest (the object the CSP solver consumes).
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from extract import extract_plan
from schema import StudentPlanRequest

app = FastAPI(title="IAPO AI Extraction Service", version="0.1.0")


class ExtractRequest(BaseModel):
    student_text: str
    transcript_text: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract", response_model=StudentPlanRequest)
def extract(req: ExtractRequest):
    """Turn free-text student input into the structured constraint object."""
    try:
        return extract_plan(req.student_text, req.transcript_text)
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the caller
        raise HTTPException(status_code=502, detail=f"Extraction failed: {exc}")