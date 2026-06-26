from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class TranslationRequest:
    text: str
    target_language: str
    grade_level: str
    subject: str
    source_language: str = "English"
    dialect: str | None = None
    output_format: str = "json"


@dataclass(frozen=True)
class Metadata:
    source_language: str
    target_language: str
    grade_level: str
    subject: str
    estimated_word_count: int
    chunk_count: int


@dataclass(frozen=True)
class PreprocessedContent:
    cleaned_text: str
    chunks: list[str]
    metadata: Metadata


@dataclass(frozen=True)
class KnowledgeDocument:
    id: str
    title: str
    language: str
    tags: list[str]
    content: str
    source: str


@dataclass(frozen=True)
class AgentContext:
    request: TranslationRequest
    preprocessed: PreprocessedContent
    knowledge: list[KnowledgeDocument]


@dataclass(frozen=True)
class LinguistResult:
    localized_text: str
    key_terms: dict[str, str]
    cultural_notes: list[str]


@dataclass(frozen=True)
class EducatorResult:
    learner_material: str
    teacher_script: str
    learning_alignment: list[str]


@dataclass(frozen=True)
class QualityResult:
    score: float
    issues: list[str]
    recommendations: list[str]
    passed: bool


@dataclass(frozen=True)
class TranslationOutput:
    translated_material: str
    bilingual_teacher_script: str
    key_terms: dict[str, str]
    cultural_examples: list[str]
    quality: QualityResult
    metadata: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "translated_material": self.translated_material,
            "bilingual_teacher_script": self.bilingual_teacher_script,
            "key_terms": self.key_terms,
            "cultural_examples": self.cultural_examples,
            "quality": {
                "score": self.quality.score,
                "passed": self.quality.passed,
                "issues": self.quality.issues,
                "recommendations": self.quality.recommendations,
            },
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                **self.metadata,
            },
        }

