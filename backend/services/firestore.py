from __future__ import annotations
import os
from datetime import datetime, timezone

from google.cloud.firestore_v1 import AsyncClient
from firebase_admin import firestore

# Lazy singleton — created on first use after firebase_admin.initialize_app()
_db: AsyncClient | None = None


def _get_db() -> AsyncClient:
    global _db
    if _db is None:
        _db = firestore.async_client()
    return _db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Library helpers ────────────────────────────────────────────────────────────

async def create_library_item(uid: str, data: dict) -> str:
    """Creates a new library document under users/{uid}/library and returns its ID."""
    db = _get_db()
    doc_ref = db.collection("users").document(uid).collection("library").document()
    payload = {
        **data,
        "uid": uid,
        "status": "complete",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await doc_ref.set(payload)
    return doc_ref.id


async def get_library_items(uid: str) -> list[dict]:
    """Returns all library items for a user, ordered by created_at descending."""
    db = _get_db()
    snapshot = (
        await db.collection("users")
        .document(uid)
        .collection("library")
        .order_by("created_at", direction="DESCENDING")
        .get()
    )
    return [{"doc_id": doc.id, **doc.to_dict()} for doc in snapshot]


async def get_library_item(uid: str, doc_id: str) -> dict | None:
    """Returns a single library item or None if not found / unauthorized."""
    db = _get_db()
    doc = await (
        db.collection("users").document(uid).collection("library").document(doc_id).get()
    )
    if not doc.exists:
        return None
    return {"doc_id": doc.id, **doc.to_dict()}


async def update_library_item(uid: str, doc_id: str, updates: dict) -> None:
    """Partial-updates a library document."""
    db = _get_db()
    updates["updated_at"] = _now_iso()
    await (
        db.collection("users")
        .document(uid)
        .collection("library")
        .document(doc_id)
        .update(updates)
    )


async def delete_library_item(uid: str, doc_id: str) -> None:
    """Deletes a library document."""
    db = _get_db()
    await (
        db.collection("users")
        .document(uid)
        .collection("library")
        .document(doc_id)
        .delete()
    )
