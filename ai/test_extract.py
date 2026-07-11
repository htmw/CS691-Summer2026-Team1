"""
IAPO — Test cases for the AI extraction layer.

These run offline (mock mode, no API key needed):
    pytest -v

They double as the Sprint 1 "Test Cases" artifact: each test maps to a user
story / acceptance criterion for the extraction feature.
"""

from fastapi.testclient import TestClient

import extract
from schema import StudentPlanRequest, Level
from server import app

client = TestClient(app)


# TC-01 — graduate students are identified from their message
def test_grad_classification():
    plan = extract.extract_plan("I'm in the MS CS program, 9 credits per term")
    assert plan.standing.level == Level.GRADUATE


# TC-02 — "undergrad" is NOT misread as graduate (regression guard)
def test_undergrad_not_matched_as_grad():
    plan = extract.extract_plan("im an undergrad comp sci major")
    assert plan.standing.level == Level.UNDERGRADUATE


# TC-03 — course codes are extracted and normalized ("CS 101" -> "CS101")
def test_course_code_extraction_and_normalization():
    plan = extract.extract_plan("finished CS 101 and CS201")
    assert "CS101" in plan.standing.completed_courses
    assert "CS201" in plan.standing.completed_courses


# TC-04 — credit load is captured from free text
def test_credits_extraction():
    plan = extract.extract_plan("I can only do 6 credits per semester")
    assert plan.hard_constraints.max_credits_per_term == 6


# TC-05 — the AI flags its own guesses instead of silently deciding
def test_assumptions_are_flagged():
    plan = extract.extract_plan("MS CS student")
    assert plan.metadata.assumptions, "assumptions should be recorded, not hidden"
    assert plan.metadata.needs_confirmation, "uncertain fields should be flagged"


# TC-06 — output always validates against the shared schema (solver contract)
def test_output_is_valid_schema():
    plan = extract.extract_plan("MS CS, CS101 done, 9 credits")
    StudentPlanRequest.model_validate_json(plan.model_dump_json())  # raises if invalid


# TC-07 — the /extract endpoint returns a valid structured object
def test_extract_endpoint():
    resp = client.post(
        "/extract", json={"student_text": "MS CS, finished CS101, 9 credits/term"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["standing"]["level"] == "graduate"
    assert "CS101" in body["standing"]["completed_courses"]


# TC-08 — health check is up
def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"