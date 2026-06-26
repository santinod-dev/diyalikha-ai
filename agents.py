from __future__ import annotations

import re

from .llm import LLMProvider
from .models import AgentContext, EducatorResult, LinguistResult, QualityResult


class ContextLinguistAgent:
    name = "A1. Context & Linguist Agent"

    def __init__(self, llm: LLMProvider):
        self.llm = llm

    def run(self, context: AgentContext) -> LinguistResult:
        knowledge = _knowledge_block(context)
        prompt = f"""
Target language: {context.request.target_language}
Dialect: {context.request.dialect or "General"}
Source language: {context.request.source_language}

Knowledge:
{knowledge}

Translate and localize this text:
{context.preprocessed.cleaned_text}
"""
        localized = self.llm.complete(
            system=f"{self.name}\nSelect terminology, culture, and language choices.",
            prompt=prompt,
        )
        terms = _extract_terms(context)
        notes = _extract_cultural_notes(context)
        return LinguistResult(localized_text=localized, key_terms=terms, cultural_notes=notes)


class EducatorAgent:
    name = "A2. Educator Agent"

    def __init__(self, llm: LLMProvider):
        self.llm = llm

    def run(self, context: AgentContext, linguist: LinguistResult) -> EducatorResult:
        prompt = f"""
Grade level: {context.request.grade_level}
Subject: {context.request.subject}
Target language: {context.request.target_language}

Localized draft:
{linguist.localized_text}

Create a learner-friendly material and a bilingual teacher script.
"""
        material = self.llm.complete(
            system=f"{self.name}\nAdapt content for curriculum alignment and comprehension.",
            prompt=prompt,
        )
        teacher_script = (
            f"English bridge: {context.preprocessed.cleaned_text}\n\n"
            f"{context.request.target_language} classroom script: {material}"
        )
        alignment = [
            f"Matched to {context.request.grade_level}",
            f"Subject focus: {context.request.subject}",
            "Uses short explanations and local examples where available",
        ]
        return EducatorResult(
            learner_material=material,
            teacher_script=teacher_script,
            learning_alignment=alignment,
        )


class QualityCheckerAgent:
    name = "A3. Quality Checker Agent"

    def __init__(self, llm: LLMProvider):
        self.llm = llm

    def run(
        self,
        context: AgentContext,
        linguist: LinguistResult,
        educator: EducatorResult,
    ) -> QualityResult:
        issues: list[str] = []
        recommendations: list[str] = []

        if len(educator.learner_material.split()) < max(20, len(context.preprocessed.cleaned_text.split()) // 3):
            issues.append("Learner material may be too short for the source content.")
            recommendations.append("Expand explanations or examples before classroom use.")

        if context.request.target_language.lower() not in educator.learner_material.lower():
            recommendations.append("Have a native speaker verify that the final wording is natural.")

        if not linguist.cultural_notes:
            recommendations.append("Add at least one local cultural or classroom example.")

        score = 100.0 - (len(issues) * 15.0) - (len(recommendations) * 5.0)
        score = max(0.0, min(100.0, score))
        return QualityResult(
            score=round(score, 2),
            issues=issues,
            recommendations=recommendations,
            passed=score >= 75.0 and not issues,
        )


def _knowledge_block(context: AgentContext) -> str:
    if not context.knowledge:
        return "No matching knowledge documents found."
    return "\n".join(f"- {doc.title}: {doc.content}" for doc in context.knowledge)


def _extract_terms(context: AgentContext) -> dict[str, str]:
    terms: dict[str, str] = {}
    for doc in context.knowledge:
        for sentence in re.split(r"(?<=[.!?])\s+", doc.content):
            for target, source in re.findall(r"Use '([^']+)' for ([^,.]+)", sentence):
                source = source.strip()
                if " and " in source:
                    source = source.split(" and ", 1)[0].strip()
                terms[source] = target.strip()
    return terms


def _extract_cultural_notes(context: AgentContext) -> list[str]:
    notes = []
    for doc in context.knowledge:
        if "example" in doc.title.lower() or "local" in doc.tags or "culture" in doc.tags:
            notes.append(doc.content)
    return notes
