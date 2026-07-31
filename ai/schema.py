"""
IAPO — Student Plan Request schema.

This is the structured object the AI/NLP layer produces from a student's
free-text input, and the object the CSP solver consumes. It is the contract
between the AI role (#5), the Backend/solver role (#2), and the Data role (#4).

Design principle: HARD constraints determine whether a schedule is *valid*;
SOFT preferences only determine which valid schedule is *best*. They are kept
in separate models because the solver treats them completely differently.

Usage with Gemini structured output:
    resp = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=student_free_text,
        config={"response_mime_type": "application/json",
                "response_schema": StudentPlanRequest},
    )
    plan = StudentPlanRequest.model_validate_json(resp.text)
"""

from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


# --- Enumerations -----------------------------------------------------------

class Season(str, Enum):
    FALL = "fall"
    SPRING = "spring"
    SUMMER = "summer"


class Level(str, Enum):
    UNDERGRADUATE = "undergraduate"
    GRADUATE = "graduate"


class WorkloadPreference(str, Enum):
    LIGHTER = "lighter"
    BALANCED = "balanced"
    HEAVIER = "heavier"


class OptimizationGoal(str, Enum):
    FINISH_FASTEST = "finish_fastest"   # minimize number of terms
    SPREAD_OUT = "spread_out"           # avoid heavy terms, take longer
    BALANCED = "balanced"               # reasonable middle ground


class Term(BaseModel):
    """A specific academic term, e.g. Fall 2026."""
    season: Season
    year: int = Field(..., ge=2000, le=2100)


# --- Group 1 & 2: who the student is and what they've already done ----------

class AcademicStanding(BaseModel):
    program: str = Field(..., description="Degree program, e.g. 'MS in Computer Science'")
    level: Level
    catalog_year: int | None = Field(
        None, description="Requirement/catalog year the student is held to (often entry year)"
    )
    completed_courses: list[str] = Field(
        default_factory=list, description="Course codes already passed; satisfy prereqs and aren't rescheduled"
    )
    waived_or_transferred: list[str] = Field(
        default_factory=list, description="Course codes satisfied without being taken here"
    )
    in_progress_courses: list[str] = Field(
        default_factory=list, description="Treated as completed when checking prereqs for future terms"
    )


# --- Group 3: hard scheduling constraints (solver MUST obey) ----------------

class HardConstraints(BaseModel):
    start_term: Term
    target_graduation_term: Term | None = Field(
        None, description="None means 'finish as soon as possible'"
    )
    max_credits_per_term: int = Field(..., ge=1, le=21)
    max_credits_summer: int | None = Field(
        None, description="Optional separate, usually lower, cap for summer terms"
    )
    unavailable_terms: list[Term] = Field(
        default_factory=list, description="Terms the student will skip entirely (e.g. a summer off)"
    )


# --- Group 4: soft preferences (tune ranking, not validity) -----------------
#
# NOTE ON WEIGHTS: what a course *is about* (math-heavy, ML, etc.) is a property
# of the COURSE and lives in the course database as tags, set once by the Data
# role -- the AI does not score courses. These preference fields only capture
# what the STUDENT cares about. The solver combines the two: it schedules valid
# paths using the hard constraints, then ranks them using these priorities.

class SoftPreferences(BaseModel):
    workload: WorkloadPreference = WorkloadPreference.BALANCED
    optimization_goal: OptimizationGoal = OptimizationGoal.BALANCED
    priority_preferences: list[str] = Field(
        default_factory=list,
        description="The student's top priorities, up to 3, in order (e.g. 'machine learning', "
                    "'light workload'). The solver weights these when ranking valid schedules.",
        max_length=3,
    )
    topic_interests: list[str] = Field(
        default_factory=list, description="Broader interests to bias elective choice, e.g. 'security'"
    )
    desired_electives: list[str] = Field(
        default_factory=list, description="Specific elective course codes to include if feasible"
    )


# --- Group 5: extraction metadata (your fallback handling) ------------------

class ExtractionMetadata(BaseModel):
    assumptions: list[str] = Field(
        default_factory=list, description="Defaults the AI filled in that the student did not state"
    )
    needs_confirmation: list[str] = Field(
        default_factory=list, description="Field names the frontend should ask the student to verify"
    )
    unparsed_notes: str | None = Field(
        None, description="Input the AI could not confidently map to a field; surface as a follow-up question"
    )


# --- Top-level object handed to the solver ----------------------------------

class StudentPlanRequest(BaseModel):
    standing: AcademicStanding
    hard_constraints: HardConstraints
    preferences: SoftPreferences = Field(default_factory=SoftPreferences)
    metadata: ExtractionMetadata = Field(default_factory=ExtractionMetadata)