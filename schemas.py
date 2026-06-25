"""
Schemas for DiyaLikha AI — Multi-Agent Translation Engine (Box 4 of the architecture).

TranslationState  -> the single object passed between every node in the graph.
                     Boxes 1-3 (User Input / Preprocessing / RAG Knowledge Base) are
                     assumed to already be done upstream — this is where their
                     output lands (source_text, target_language, rag_context, ...).
LinguistOutput    -> structured output of Agent A1 (Context & Linguist, merged)
EducatorOutput    -> structured output of Agent A2 (Educator)
QualityReport     -> structured output of Agent A3 (Quality Checker)
"""

from typing import List, Optional, TypedDict
from pydantic import BaseModel, Field


class TranslationState(TypedDict, total=False):
    # ---- Inputs (from Box 1 User Input + Box 3 RAG Knowledge Base) ----
    source_text: str           # original English lesson content
    target_language: str       # e.g. "Cebuano", "Ilocano", "Hiligaynon"
    grade_level: str           # e.g. "Grade 4"
    subject: str               # e.g. "Science"
    rag_context: str           # retrieved snippets: DepEd standards, dictionaries,
                                # regional terms, cultural/community knowledge,
                                # lesson templates, pedagogical guides (Box 3 output)

    # ---- Working state produced by the agents ----
    draft_translation: str     # A1 output: localized text
    linguist_notes: str        # A1 output: terminology + cultural notes
    adapted_content: str       # A2 output: pedagogically adapted text
    educator_notes: str        # A2 output: pedagogical adaptation notes
    quality_report: dict       # A3 output: serialized QualityReport
    revision_feedback: str     # A3 -> A1 feedback when a revision loop is triggered

    # ---- Planner bookkeeping ----
    iteration: int
    max_iterations: int
    quality_threshold: float

    # ---- Final output (Box 5) ----
    final_output: dict


class LinguistOutput(BaseModel):
    """Structured output for Agent A1: Context & Linguist Agent (merged)."""
    translated_text: str = Field(
        description="The lesson content fully translated/localized into the target "
                     "Philippine language or dialect."
    )
    terminology_notes: str = Field(
        description="Key terms chosen and why (e.g. DepEd-standard term vs regional "
                     "term), to surface to the teacher."
    )
    cultural_notes: str = Field(
        description="Cultural context/examples substituted or added to localize the "
                     "content for the target community."
    )


class EducatorOutput(BaseModel):
    """Structured output for Agent A2: Educator Agent."""
    adapted_text: str = Field(
        description="The localized text re-shaped for the target grade level: "
                     "sentence complexity, structure, scaffolding, and examples "
                     "aligned to learning objectives. Stays in the target language."
    )
    pedagogical_notes: str = Field(
        description="What was changed pedagogically and why (e.g. simplified "
                     "sentence structure, added a local analogy for a science concept)."
    )


class QualityReport(BaseModel):
    """Structured output for Agent A3: Quality Checker Agent."""
    grammar_score: float = Field(ge=0, le=10)
    accuracy_score: float = Field(ge=0, le=10, description="Faithfulness to source_text")
    fluency_score: float = Field(ge=0, le=10)
    cultural_relevance_score: float = Field(ge=0, le=10)
    overall_score: float = Field(ge=0, le=10)
    issues: List[str] = Field(default_factory=list)
    revision_feedback: Optional[str] = Field(
        default=None,
        description="Concrete, actionable feedback for the Linguist agent. "
                     "Required if approved=False, otherwise null."
    )
    approved: bool
