from __future__ import annotations

from pathlib import Path

from .agents import ContextLinguistAgent, EducatorAgent, QualityCheckerAgent
from .knowledge_base import KnowledgeBase
from .llm import LLMProvider
from .models import AgentContext, TranslationOutput, TranslationRequest
from .preprocessing import Preprocessor


class TranslationPlanner:
    """Coordinates preprocessing, RAG retrieval, agents, and final output."""

    def __init__(self, llm: LLMProvider, knowledge_root: str | Path):
        self.preprocessor = Preprocessor()
        self.knowledge_base = KnowledgeBase(knowledge_root)
        self.linguist = ContextLinguistAgent(llm)
        self.educator = EducatorAgent(llm)
        self.quality_checker = QualityCheckerAgent(llm)

    def run(self, request: TranslationRequest) -> TranslationOutput:
        preprocessed = self.preprocessor.run(request)
        knowledge = self.knowledge_base.retrieve(request, preprocessed)
        context = AgentContext(request=request, preprocessed=preprocessed, knowledge=knowledge)

        linguist_result = self.linguist.run(context)
        educator_result = self.educator.run(context, linguist_result)
        quality_result = self.quality_checker.run(context, linguist_result, educator_result)

        return TranslationOutput(
            translated_material=educator_result.learner_material,
            bilingual_teacher_script=educator_result.teacher_script,
            key_terms=linguist_result.key_terms,
            cultural_examples=linguist_result.cultural_notes,
            quality=quality_result,
            metadata={
                "source_language": request.source_language,
                "target_language": request.target_language,
                "dialect": request.dialect,
                "grade_level": request.grade_level,
                "subject": request.subject,
                "word_count": preprocessed.metadata.estimated_word_count,
                "chunk_count": preprocessed.metadata.chunk_count,
                "knowledge_sources": [doc.id for doc in knowledge],
            },
        )

