from __future__ import annotations
import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from middleware.auth import get_current_uid
from services import ibm_storage, firestore

# Optional text-extraction libs — gracefully absent in dev without full install
try:
    import PyPDF2
    _HAS_PYPDF2 = True
except ImportError:
    _HAS_PYPDF2 = False

try:
    from docx import Document as DocxDocument
    _HAS_DOCX = True
except ImportError:
    _HAS_DOCX = False

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
MAX_SIZE_MB = 10


def _extract_text(data: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        if not _HAS_PYPDF2:
            raise HTTPException(status_code=501, detail="PDF extraction not available.")
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        return "\n".join(p.extract_text() or "" for p in reader.pages)
    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        if not _HAS_DOCX:
            raise HTTPException(status_code=501, detail="DOCX extraction not available.")
        doc = DocxDocument(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    # Plain text
    return data.decode("utf-8", errors="replace")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    uid: str = Depends(get_current_uid),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: PDF, DOCX, TXT.",
        )

    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB} MB limit.")

    extracted_text = _extract_text(data, file.content_type)

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    storage_url = await ibm_storage.upload_file(
        uid=uid,
        filename=safe_name,
        data=data,
        content_type=file.content_type,
    )

    # Create a placeholder library entry (status: processing) so the frontend
    # can track it while translation runs.
    doc_id = await firestore.create_library_item(
        uid=uid,
        data={
            "title": file.filename or "Untitled",
            "category": "UNCATEGORIZED",
            "grade": "",
            "subtitle": "",
            "translated_text": "",
            "storage_url": storage_url,
            "source_language": "English",
            "target_dialect": "",
            "subject_area": "",
            "status": "processing",
        },
    )

    return {
        "doc_id": doc_id,
        "extracted_text": extracted_text,
        "storage_url": storage_url,
    }
