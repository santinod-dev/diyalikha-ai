from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_uid
from models.schemas import LibraryItem, LibraryItemCreate, LibraryItemUpdate
from services import firestore

router = APIRouter()


@router.get("", response_model=list[LibraryItem])
async def list_library(uid: str = Depends(get_current_uid)):
    items = await firestore.get_library_items(uid)
    return items


@router.post("", response_model=dict)
async def create_library_item(
    payload: LibraryItemCreate, uid: str = Depends(get_current_uid)
):
    doc_id = await firestore.create_library_item(uid=uid, data=payload.model_dump())
    return {"doc_id": doc_id}


@router.patch("/{doc_id}")
async def update_library_item(
    doc_id: str,
    payload: LibraryItemUpdate,
    uid: str = Depends(get_current_uid),
):
    item = await firestore.get_library_item(uid, doc_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Library item not found.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await firestore.update_library_item(uid, doc_id, updates)
    return {"ok": True}


@router.delete("/{doc_id}")
async def delete_library_item(
    doc_id: str,
    uid: str = Depends(get_current_uid),
):
    item = await firestore.get_library_item(uid, doc_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Library item not found.")
    await firestore.delete_library_item(uid, doc_id)
    return {"ok": True}
