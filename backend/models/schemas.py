from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ── Translation ────────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    grade_level: str          # e.g. "Grade 3"
    subject_area: str         # e.g. "Science & Nature"
    target_dialect: str       # e.g. "Waray (Samar-Leyte)"
    source_language: str = "English"


class TranslateResponse(BaseModel):
    translated_text: str
    bilingual_script: str
    key_terms: list[dict]     # [{"term": str, "translation": str, "example": str}]
    quality_score: float      # 0–100


# ── Proofreading ───────────────────────────────────────────────────────────────

class ProofreadRequest(BaseModel):
    text: str
    dialect: str
    grade_level: str


class Suggestion(BaseModel):
    severity: str             # "critical" | "major" | "suggestion"
    original: str
    corrected: str
    reason: str
    position: Optional[int] = None   # char offset in text, best-effort


class ProofreadResponse(BaseModel):
    quality_score: float
    suggestions: list[Suggestion]


# ── Chat (Bao) ─────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    output_language: str = "Filipino"
    grade_level: str = "Grade 3"
    learning_style: str = "Visual + Kinesthetic"
    file_context: Optional[str] = None


class ChatResponse(BaseModel):
    content: str


# ── Library ────────────────────────────────────────────────────────────────────

class LibraryItemCreate(BaseModel):
    title: str
    category: str             # e.g. "MATHEMATICS"
    grade: str
    subtitle: str             # e.g. "English to Waray"
    translated_text: str
    storage_url: Optional[str] = None
    source_language: str = "English"
    target_dialect: str = ""
    subject_area: str = ""


class LibraryItemUpdate(BaseModel):
    translated_text: Optional[str] = None
    status: Optional[str] = None      # processing | complete | review | error


class LibraryItem(BaseModel):
    doc_id: str
    uid: str
    title: str
    category: str
    grade: str
    subtitle: str
    status: str
    translated_text: str
    storage_url: Optional[str] = None
    source_language: str
    target_dialect: str
    subject_area: str
    created_at: str
    updated_at: str
