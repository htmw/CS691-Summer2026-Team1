from aws import user_table, user_session_table, s3
from fastapi import APIRouter, Request, HTTPException, Response
from schemas import SignUpData, TranscriptData
from security import passwordHash
import base64
from config import S3_BUCKET
from datetime import datetime, timedelta
import secrets

def getSession(request: Request):
    user_email = request.cookies.get("user")
    session_id = request.cookies.get("session_id")

    if not user_email or not session_id:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication"
        )

    # Look up the session
    session_response = user_session_table.get_item(
        Key={
            "session_id": session_id
        }
    )

    session = session_response.get("Item")

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid session"
        )

    # Ensure the session belongs to the user
    if session["email"] != user_email:
        raise HTTPException(
            status_code=401,
            detail="Session mismatch"
        )

    # Check expiration
    expires = datetime.fromisoformat(session["expires"])

    if expires < datetime.utcnow():
        user_session_table.delete_item(
            Key={
                "session_id": session_id
            }
        )

        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    # Load user
    user_response = user_table.get_item(
        Key={
            "iapo2026": user_email
        }
    )

    user = user_response.get("Item")

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

def emailAuth(email: str):
    user_response = user_table.get_item(
        Key={
            "iapo2026": email
        }
    )
    user = user_response.get("Item")
    if user:
        return {
            "exists": True,
            "message": "Email already registered"
        }
    return {
        "exists": False,
        "message": "Email available"
    }

def signUp(data: SignUpData, response: Response):
    email_check = emailAuth(data.email)

    if email_check["exists"]:
        return {
            "status": 409,
            "message": email_check["message"]
        }

    transcript_key = None
    if (data.transcript and data.transcript.data and data.transcript.name):
        transcript_data = data.transcript.data

        if "," in transcript_data:
            transcript_data = transcript_data.split(",", 1)[1]

        pdf_bytes = base64.b64decode(transcript_data)

        transcript_key = (
            f"transcripts/{data.email}/"
            f"{secrets.token_hex(8)}_{data.transcript.name}"
        )

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=transcript_key,
            Body=pdf_bytes,
            ContentType="application/pdf"
        )

    userInfo = {
        "iapo2026": data.email,
        "password": passwordHash(data.password),
        "name": data.name,
        "academic": {
            "degreeLevel": data.degreeLevel,
            "major": data.major,
            "startingSemester": data.startingSemester,
            "endingSemester": data.endingSemester,
            "credits": data.credits,
            "chat": data.chat
        },
        "transcript": {
            "name": data.transcript.name if transcript_key else "",
            "key": transcript_key or ""
        },
        "createdAt": datetime.utcnow().isoformat()
    }

    user_table.put_item(Item=userInfo)

    loginUser(response, data.email)

    return {
            "status": 409,
            "message": "Account created"
        }

def loginUser(response: Response, email: str):
    session_id = createSession(email)
    setSessionCookies(response, email, session_id)

def createSession(email: str) -> str:
    session_id = secrets.token_urlsafe(64)

    expires = datetime.utcnow() + timedelta(days=SESSION_LENGTH_DAYS)

    user_session_table.put_item(
        Item={
            "session_id": session_id,
            "email": email,
            "expires": expires.isoformat()
        }
    )

    return session_id

def setSessionCookies(response: Response, email: str, session_id: str):
    max_age = SESSION_LENGTH_DAYS * 24 * 60 * 60

    response.set_cookie(
        key="user",
        value=email,
        httponly=True,
        secure=False, #False for now
        samesite="Lax",
        max_age=max_age
    )

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False, #false
        samesite="Lax",
        max_age=max_age
    )



