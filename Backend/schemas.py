from pydantic import BaseModel
from typing import Optional, Any

class EmailData(BaseModel):
    email: str

class TranscriptData(BaseModel):
    data: Optional[str] = ""
    name: Optional[str] = ""


class SignUpData(BaseModel):
    email: str
    password: str
    name: str
    degreeLevel: str
    major: str
    startingSemester: str
    endingSemester: str
    credits: int
    transcript: TranscriptData
    chat: str

class SignInData(BaseModel):
    email: str
    password: str

class UpdateUserData(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None

class ScheduleInfo(BaseModel):
    degreeLevel: str
    major: str
    startingSemester: str
    endingSemester: str
    credits: int
    transcript: TranscriptData
    chat: str

class UpdateUserDataAcademic(ScheduleInfo):
    email: str
    schedule: Any