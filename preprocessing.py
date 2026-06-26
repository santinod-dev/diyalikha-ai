from __future__ import annotations

import re
from pathlib import Path

from .models import Metadata, PreprocessedContent, TranslationRequest


class Preprocessor:
    """Converts user input into clean, chunked text for agent processing."""

    def run(self, request: TranslationRequest) -> PreprocessedContent:
        cleaned = self.clean_text(request.text)
        chunks = self.chunk_text(cleaned)
        metadata = Metadata(
            source_language=request.source_language,
            target_language=request.target_language,
            grade_level=request.grade_level,
            subject=request.subject,
            estimated_word_count=len(cleaned.split()),
            chunk_count=len(chunks),
        )
        return PreprocessedContent(cleaned_text=cleaned, chunks=chunks, metadata=metadata)

    @staticmethod
    def from_file(path: str | Path) -> str:
        file_path = Path(path)
        suffix = file_path.suffix.lower()
        if suffix in {".txt", ".md"}:
            return file_path.read_text(encoding="utf-8")
        raise ValueError(
            f"Unsupported file type '{suffix}'. Add a parser for PDF, DOCX, PPTX, or OCR in preprocessing.py."
        )

    @staticmethod
    def clean_text(text: str) -> str:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def chunk_text(text: str, max_words: int = 180) -> list[str]:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks: list[str] = []
        current: list[str] = []
        current_words = 0

        for paragraph in paragraphs or [text]:
            words = paragraph.split()
            if current and current_words + len(words) > max_words:
                chunks.append(" ".join(current).strip())
                current = []
                current_words = 0
            current.append(paragraph)
            current_words += len(words)

        if current:
            chunks.append(" ".join(current).strip())
        return chunks

