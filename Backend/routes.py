from fastapi import APIRouter, Request, Response, Cookie
from schemas import EmailData, SignUpData, SignInData, UpdateUserData, ScheduleInfo, TranscriptData, UpdateUserDataAcademic
import userInfo
from ai import catalog, aiInfo, transcriptChecker

router = APIRouter()



@router.get("/auth")
async def quick_log(request: Request):
    return userInfo.getSession(request)

@router.post("/auth/email")
async def emailCheck(data: EmailData):
    return userInfo.emailAuth(data.email)

@router.post("/signUp")
async def signUp(data: SignUpData, response: Response):
    return userInfo.signUp(data, response)

@router.post("/signIn")
async def signIn(data: SignInData, response: Response):
    return userInfo.signIn(data, response)

@router.post("/signOut")
async def signOut(response: Response, session_id: str | None = Cookie(default=None),):
    return userInfo.signOut(session_id, response)

@router.post("/updateUser")
async def updateUser(data: UpdateUserData, request: Request, response: Response):
    return userInfo.updateUser(data, request, response)

@router.post("/updateUser/academic")
async def updateUserAcademic(data: UpdateUserDataAcademic, response: Response):
    return userInfo.updateAcademic(data, response)

@router.get("/api/info")
async def get_data():
    return catalog.get_programInfo()

@router.post("/api/extract")
async def extract_schedule(data: ScheduleInfo):
    return aiInfo.extractSchedule(data)

@router.post("/api/transcriptCheck")
async def check_transcript(data: TranscriptData):
    return transcriptChecker.checkTranscript(data)

@router.get("/api/health")
async def getApiHealth():
    return aiInfo.checkHealth()

