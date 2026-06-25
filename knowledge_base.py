from __future__ import annotations

import json
import re
from pathlib import Path

from .models import KnowledgeDocument, PreprocessedContent, TranslationRequest


class KnowledgeBase:
    """Small dependency-free RAG store using keyword overlap retrieval."""

    def __init__(self, root: str | Path):
        self.root = Path(root)
        self.documents = self._load_documents()

    def retrieve(
        self,
        request: TranslationRequest,
        content: PreprocessedContent,
        limit: int = 6,
    ) -> list[KnowledgeDocument]:
        query_terms = self._terms(
            " ".join(
                [
                    request.target_language,
                    request.grade_level,
                    request.subject,
                    content.cleaned_text,
                ]
            )
        )
        ranked = sorted(
            self.documents,
            key=lambda doc: self._score(doc, query_terms, request.target_language),
            reverse=True,
        )
        return [doc for doc in ranked if self._score(doc, query_terms, request.target_language) > 0][:limit]

    def _load_documents(self) -> list[KnowledgeDocument]:
        documents: list[KnowledgeDocument] = []
        for path in sorted(self.root.glob("*.json")):
            raw_items = json.loads(path.read_text(encoding="utf-8"))
            for item in raw_items:
                documents.append(
                    KnowledgeDocument(
                        id=item["id"],
                        title=item["title"],
                        language=item.get("language", "Multi"),
                        tags=item.get("tags", []),
                        content=item["content"],
                        source=path.name,
                    )
                )
        return documents

    @staticmethod
    def _terms(text: str) -> set[str]:
        return set(re.findall(r"[a-zA-Z0-9]+", text.lower()))

    def _score(self, doc: KnowledgeDocument, query_terms: set[str], target_language: str) -> float:
        haystack = " ".join([doc.title, doc.language, " ".join(doc.tags), doc.content])
        doc_terms = self._terms(haystack)
        score = len(query_terms & doc_terms)
        if doc.language.lower() in {target_language.lower(), "multi"}:
            score += 2
        return float(score)

