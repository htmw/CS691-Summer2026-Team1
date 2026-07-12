from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from security import verify_api_key
from routes import router



app = FastAPI(
    dependencies=[Depends(verify_api_key)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
         "*" # Add the front-end URL near end
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


