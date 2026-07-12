from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from argon2 import PasswordHasher

from config import BACKEND_API_KEY

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False
)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != BACKEND_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )

    return api_key


def passwordHash(password: str):
    ph = PasswordHasher()
    password_hash = ph.hash(password)
    return password_hash