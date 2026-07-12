from pydantic import BaseModel
from typing import Optional

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
