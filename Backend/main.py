import os

os.environ["HTTPS_PROXY"] = "http://proxy.server:3128"
os.environ["https_proxy"] = "http://proxy.server:3128"

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from security import verify_api_key
from routes import router

import os
import sys

print("Python:", sys.executable)
print("HTTPS_PROXY:", os.environ.get("HTTPS_PROXY"))
print("https_proxy:", os.environ.get("https_proxy"))

app = FastAPI(
    dependencies=[Depends(verify_api_key)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://2026-paceu-capstone.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


