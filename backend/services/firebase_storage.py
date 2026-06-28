from __future__ import annotations
import os
from firebase_admin import storage as fb_storage


def _bucket():
    return fb_storage.bucket(os.environ.get("FIREBASE_STORAGE_BUCKET"))


async def upload_file(uid: str, filename: str, data: bytes, content_type: str) -> str:
    """
    Uploads raw bytes to Firebase Storage at users/{uid}/uploads/{filename}.
    Returns a signed URL valid for 7 days.
    """
    bucket = _bucket()
    blob = bucket.blob(f"users/{uid}/uploads/{filename}")
    blob.upload_from_string(data, content_type=content_type)
    # Make publicly readable via a signed URL (service account required)
    from datetime import timedelta
    url = blob.generate_signed_url(expiration=timedelta(days=7), method="GET")
    return url
