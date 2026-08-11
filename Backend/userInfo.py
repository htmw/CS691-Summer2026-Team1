from aws import user_table, user_session_table, s3, to_dynamodb_safe
from fastapi import Request, HTTPException, Response
from schemas import SignUpData, SignInData, UpdateUserData, UpdateUserDataAcademic
from security import passwordHash, verifyPassword
import base64
import traceback
from config import S3_BUCKET, SESSION_LENGTH_DAYS
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
            status_code=404,
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
    return loadUser(user_email)

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

    return loginUser(response, data.email)

def signIn(data: SignUpData, response: Response):
    email = data.email
    password = data.password

    user_response = user_table.get_item(
        Key={
            "iapo2026": email
        }
    )
    user = user_response.get("Item")
    if user is None:
        return {
            "status": 401,
            "message": "Invalid Email/Password"
        }

    if not verifyPassword(password, user["password"]):
        return {
            "status": 401,
            "message": "Invalid Email/Password"
        }

    return loginUser(response, email)

def signOut(session_id: str | None, response: Response):
    if session_id:
        user_session_table.delete_item(
            Key={
                "session_id": session_id
            }
        )

    response.delete_cookie(
        key="user",
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )

    response.delete_cookie(
        key="session_id",
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )

    return {"success": True}


def loginUser(response: Response, email: str):
    session_id = createSession(email)
    setSessionCookies(response, email, session_id)
    return loadUser(email)


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
        secure=True, #False for now
        samesite="none",
        max_age=max_age,
        path="/"
    )

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True, #false
        samesite="none",
        max_age=max_age,
        path="/"
    )

def loadUser(user_email: str):
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

    user.pop("password", None)

    transcript = user.get("transcript", {})
    transcript_data = None

    if transcript.get("key"):
        s3_file = s3.get_object(
            Bucket=S3_BUCKET,
            Key=transcript["key"]
        )

        pdf_bytes = s3_file["Body"].read()

        transcript_data = {
            "name": transcript.get("name", ""),
            "data": base64.b64encode(pdf_bytes).decode("utf-8")
        }

    return {
        "email": user.get("iapo2026"),
        "name": user.get("name"),
        "academic": user.get("academic", {}),
        "schedule": user.get("schedule", {}),
        "transcript": transcript_data
    }




def updateUser(data: UpdateUserData, request: Request, response: Response):
    session_id = request.cookies.get("session_id")

    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated, no session ID cookie")

    session = user_session_table.get_item(
        Key={"session_id": session_id}
    ).get("Item")

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    old_email = session["email"]

    if not old_email:
        raise HTTPException(status_code=401, detail="Not authenticated, no Email from session")

    new_email = data.email.strip() if data.email else old_email

    result = user_table.get_item(
        Key={"iapo2026": old_email}
    )

    user = result.get("Item")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If the email is changing, make sure it isn't already in use.
    if new_email != old_email:
        email_check = emailAuth(new_email)
        if email_check["exists"]:
            raise HTTPException(
                status_code=409,
                detail=email_check["message"]
            )

    try:
        # ------------------------------------------------------------
        # EMAIL CHANGED
        # ------------------------------------------------------------
        if new_email != old_email:
            result = user_table.get_item(
                Key={
                    "iapo2026": old_email
                }
            )

            user = result.get("Item")

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )


            transcript = user.get("transcript", {})

            if transcript.get("key"):
                old_key = transcript["key"]

                # Preserve the filename portion after the email folder
                filename = old_key.split("/", 2)[2]

                new_key = f"transcripts/{new_email}/{filename}"

                # Copy the file
                s3.copy_object(
                    Bucket=S3_BUCKET,
                    CopySource={
                        "Bucket": S3_BUCKET,
                        "Key": old_key
                    },
                    Key=new_key
                )

                # Delete the old file
                s3.delete_object(
                    Bucket=S3_BUCKET,
                    Key=old_key
                )

                # Update DynamoDB reference
                user["transcript"]["key"] = new_key

            # Update fields
            user["iapo2026"] = new_email

            if data.name:
                user["name"] = data.name

            if data.password:
                if verifyPassword(data.password, user["password"]):
                    raise HTTPException(
                        status_code=400,
                        detail="New password must be different from the current password."
                    )
                user["password"] = passwordHash(data.password)



            # Create new user record
            user_table.put_item(Item=user)

            # Delete old record
            user_table.delete_item(
                Key={
                    "iapo2026": old_email
                }
            )

            # Delete old session
            old_session = request.cookies.get("session_id")

            if old_session:
                user_session_table.delete_item(
                    Key={
                        "session_id": old_session
                    }
                )

            # Creates a new session, sets cookies, returns updated user
            return loginUser(response, new_email)

        # ------------------------------------------------------------
        # EMAIL DID NOT CHANGE
        # ------------------------------------------------------------
        update_parts = []
        values = {}
        names = {}

        if data.name:
            update_parts.append("#n = :name")
            names["#n"] = "name"
            values[":name"] = data.name

        if data.password:
            if verifyPassword(data.password, user["password"]):
                raise HTTPException(
                    status_code=400,
                    detail="New password must be different from the current password."
                )

            update_parts.append("password = :password")
            values[":password"] = passwordHash(data.password)


        if update_parts:
            kwargs = {
                "Key": {"iapo2026": old_email},
                "UpdateExpression": "SET " + ", ".join(update_parts),
                "ExpressionAttributeValues": values,
            }

            if names:
                kwargs["ExpressionAttributeNames"] = names

            user_table.update_item(**kwargs)

        return loadUser(old_email)

    except HTTPException:
    # Preserve the status code and detail you've already raised.
        raise

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

def updateAcademic(data: UpdateUserDataAcademic, response: Response):
    try:
        # ------------------------------------------------------------
        # FIND USER
        # ------------------------------------------------------------
        result = user_table.get_item(
            Key={
                "iapo2026": data.email
            }
        )

        user = result.get("Item")

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        old_transcript = user.get("transcript", {})
        old_transcript_key = old_transcript.get("key", "")

        incoming_transcript = data.transcript

        has_new_transcript = (
            incoming_transcript
            and incoming_transcript.data
            and incoming_transcript.name
        )

        if has_new_transcript:

            transcript_data = incoming_transcript.data

            # Remove data URL prefix if present
            if "," in transcript_data:
                transcript_data = transcript_data.split(",", 1)[1]

            pdf_bytes = base64.b64decode(transcript_data)

            new_transcript_key = (
                f"transcripts/{data.email}/"
                f"{secrets.token_hex(8)}_{incoming_transcript.name}"
            )

            # Upload new transcript
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=new_transcript_key,
                Body=pdf_bytes,
                ContentType="application/pdf"
            )

            # Delete old transcript after successful upload
            if old_transcript_key:
                s3.delete_object(
                    Bucket=S3_BUCKET,
                    Key=old_transcript_key
                )

            user["transcript"] = {
                "name": incoming_transcript.name,
                "key": new_transcript_key
            }

        else:
            if old_transcript_key:
                s3.delete_object(
                    Bucket=S3_BUCKET,
                    Key=old_transcript_key
                )

            user["transcript"] = {
                "name": "",
                "key": ""
            }

        user["academic"] = {
            "degreeLevel": data.degreeLevel,
            "major": data.major,
            "startingSemester": data.startingSemester,
            "endingSemester": data.endingSemester,
            "credits": data.credits,
            "chat": data.chat
        }

        user["schedule"] = data.schedule

        user_table.put_item(
            Item=to_dynamodb_safe(user)
        )
        return loadUser(data.email)

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

