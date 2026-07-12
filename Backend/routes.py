from fastapi import APIRouter, Request, HTTPException, Response
from schemas import EmailData, SignUpData
import userInfo

router = APIRouter()

from aws import user_table, user_session_table

@router.get("/auth")
async def quick_log(request: Request):
    return userInfo.getSession(request)

@router.post("/authEmail")
async def emailCheck(data: EmailData):
    return userInfo.emailAuth(data.email)

@router.post("/signUp")
async def signUp(data: SignUpData, response: Response):
    return userInfo.signUp(data, response)

@router.get("/get-data")
async def get_data():
    return {
        "message": f"Connected to DynamoDB table: {user_table.name} + {user_session_table}",
        "status": "success"
    }


