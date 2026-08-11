from config import GEMINI_API_KEY
from pydantic import BaseModel, Field
from schemas import TranscriptData
import base64
import traceback
from fastapi import HTTPException
...

_TRANSCRIPT_CHECK_MODEL = "gemini-3.1-flash-lite"

_TRANSCRIPT_CHECK_SYSTEM = """You are looking at an uploaded PDF to decide whether it is an \
academic transcript. It does NOT need to be official, watermarked, or from any specific \
institution -- an unofficial, informal, or student-printed transcript still counts, as does \
a transcript from any school or country. It should show something like a student's completed \
coursework: course names/codes, credits, grades, and/or terms/semesters.

Do NOT count: a resume/CV, a diploma or certificate, a syllabus, a random essay or report, a \
blank/corrupted file, or an unrelated document. If the PDF has no readable content at all, \
treat that as not a transcript.

Return only the JSON object matching the schema."""


class TranscriptCheckResult(BaseModel):
    is_transcript: bool = Field(
        ..., description="True if the document is recognizably a transcript, official or not"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(..., description="One short sentence explaining the decision")


def checkTranscript(data: TranscriptData):
    if not data.data or not data.name:
        raise HTTPException(status_code=400, detail="No transcript file provided")

    transcript_data = data.data
    if "," in transcript_data:
        transcript_data = transcript_data.split(",", 1)[1]

    try:
        pdf_bytes = base64.b64decode(transcript_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode transcript file")

    if not GEMINI_API_KEY:
        return TranscriptCheckResult(
            is_transcript=True,
            confidence=0.0,
            reason="MOCK MODE: GEMINI_API_KEY not set -- skipping real check, assuming valid.",
        ).model_dump(mode="json")

    from google import genai
    from google.genai import types

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=60_000,
            retry_options=types.HttpRetryOptions(
                attempts=3, initial_delay=1.0, max_delay=8.0, exp_base=2.0, jitter=1.0,
            ),
        ),
    )

    try:
        response = client.models.generate_content(
            model=_TRANSCRIPT_CHECK_MODEL,
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                "Is this document a transcript?",
            ],
            config=types.GenerateContentConfig(
                system_instruction=_TRANSCRIPT_CHECK_SYSTEM,
                response_mime_type="application/json",
                response_schema=TranscriptCheckResult,
            ),
        )
    except Exception as exc:
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Transcript check failed: {exc}\n\nTraceback:\n{tb}",
        )

    if isinstance(response.parsed, TranscriptCheckResult):
        result = response.parsed
    else:
        result = TranscriptCheckResult.model_validate_json(response.text)

    return result.model_dump(mode="json")