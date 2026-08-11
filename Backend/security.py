from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from config import BACKEND_API_KEY

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False
)

ph = PasswordHasher()

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != BACKEND_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )

    return api_key


def passwordHash(password: str):
    password_hash = ph.hash(password)
    return password_hash

def verifyPassword(password: str, stored_hash: str):
    try:
        ph.verify(stored_hash, password)
        return True
    except VerifyMismatchError:
        return False