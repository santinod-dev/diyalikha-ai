from fastapi import APIRouter, Depends
from middleware.auth import get_current_uid

router = APIRouter()


@router.get("/me")
def me(uid: str = Depends(get_current_uid)):
    """Returns the authenticated user's UID — useful for verifying token validity."""
    return {"uid": uid}
