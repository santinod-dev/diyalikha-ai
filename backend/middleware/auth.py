from firebase_admin import auth as firebase_auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()


def get_current_uid(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    """
    FastAPI dependency — verifies the Firebase ID token in the Authorization
    header and returns the authenticated user's UID.

    Usage:
        @router.get("/me")
        def me(uid: str = Depends(get_current_uid)):
            ...
    """
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
