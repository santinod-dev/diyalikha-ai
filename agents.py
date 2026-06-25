"""
Agent node implementations for the Multi-Agent Translation System (Box 4).

Each `make_*_node` is a factory that closes over an LLM client and returns a
LangGraph-compatible node function: `(TranslationState) -> dict` (a partial
state update). Using factories (dependency injection) means you can swap in
a different model per agent, or a fake/mock LLM in tests, without touching
the graph wiring in graph.py.
"""

from langchain_core.prompts import ChatPromptTemplate

from app.schemas import TranslationState, LinguistOutput, EducatorOutput, QualityReport


# ---------------------------------------------------------------------------
# A1. Context & Linguist Agent (merged)
# ---------------------------------------------------------------------------
LINGUIST_SYSTEM_PROMPT = """You are the Context & Linguist Agent for DiyaLikha AI, \
an education platform that localizes lesson content for underserved Philippine \
communities.

Your job:
1. Analyze the cultural and educational context of the source lesson content.
2. Translate/localize it into {target_language}, choosing terminology that is \
correct, natural for that language/dialect, and consistent with the reference \
material below (DepEd curriculum standards, dictionaries, regional terms).
3. Where appropriate, substitute or add culturally relevant examples so the \
lesson feels local, without changing the underlying learning content.

Reference material (curriculum standards, dictionaries, cultural/community \
knowledge, retrieved for this lesson):
---
{rag_context}
---

If revision feedback from the Quality Checker is provided below, treat it as \
required fixes — apply every point before returning your answer.
Revision feedback (empty on the first pass):
---
{revision_feedback}
---
"""


def make_context_linguist_node(llm):
    structured_llm = llm.with_structured_output(LinguistOutput)
    prompt = ChatPromptTemplate.from_messages([
        ("system", LINGUIST_SYSTEM_PROMPT),
        ("human", "Source lesson content (English):\n---\n{source_text}\n---"),
    ])
    chain = prompt | structured_llm

    def node(state: TranslationState) -> dict:
        result: LinguistOutput = chain.invoke({
            "target_language": state["target_language"],
            "rag_context": state.get("rag_context", "(none provided)"),
            "revision_feedback": state.get("revision_feedback") or "(none — first pass)",
            "source_text": state["source_text"],
        })
        return {
            "draft_translation": result.translated_text,
            "linguist_notes": f"{result.terminology_notes}\n\n{result.cultural_notes}",
        }

    return node


# ---------------------------------------------------------------------------
# A2. Educator Agent
# ---------------------------------------------------------------------------
EDUCATOR_SYSTEM_PROMPT = """You are the Educator Agent for DiyaLikha AI.

You receive lesson content that has already been translated/localized into \
{target_language}. Your job is purely pedagogical — do NOT change the language \
back to English and do NOT undo the localization:
1. Adapt sentence complexity and structure for {grade_level} learners.
2. Align the material with the subject's learning objectives ({subject}).
3. Improve clarity and comprehension (scaffolding, ordering, formatting as a \
lesson script a teacher could read aloud).

Reference material (lesson templates, pedagogical guides, curriculum context):
---
{rag_context}
---
"""


def make_educator_node(llm):
    structured_llm = llm.with_structured_output(EducatorOutput)
    prompt = ChatPromptTemplate.from_messages([
        ("system", EDUCATOR_SYSTEM_PROMPT),
        ("human", "Localized lesson content ({target_language}):\n---\n{draft_translation}\n---"),
    ])
    chain = prompt | structured_llm

    def node(state: TranslationState) -> dict:
        result: EducatorOutput = chain.invoke({
            "target_language": state["target_language"],
            "grade_level": state.get("grade_level", "unspecified"),
            "subject": state.get("subject", "unspecified"),
            "rag_context": state.get("rag_context", "(none provided)"),
            "draft_translation": state["draft_translation"],
        })
        return {
            "adapted_content": result.adapted_text,
            "educator_notes": result.pedagogical_notes,
        }

    return node


# ---------------------------------------------------------------------------
# A3. Quality Checker Agent
# ---------------------------------------------------------------------------
QUALITY_SYSTEM_PROMPT = """You are the Quality Checker Agent for DiyaLikha AI.

Evaluate the adapted, localized lesson content against the original English \
source. Score each dimension from 0-10:
- grammar: is the {target_language} grammatically correct?
- accuracy: does it faithfully preserve the meaning/learning content of the source?
- fluency: does it read naturally to a native speaker, not like a literal translation?
- cultural_relevance: are examples/context appropriate and localized for the \
target community and grade level ({grade_level})?

overall_score is your holistic judgment (not necessarily a simple average).
Set approved=true only if overall_score >= {quality_threshold} AND there is no \
major accuracy problem. If approved=false, revision_feedback MUST contain \
specific, actionable instructions the Linguist agent can act on directly \
(quote the problem phrase and say what to fix).
"""


def make_quality_checker_node(llm):
    structured_llm = llm.with_structured_output(QualityReport)
    prompt = ChatPromptTemplate.from_messages([
        ("system", QUALITY_SYSTEM_PROMPT),
        ("human",
         "Original English source:\n---\n{source_text}\n---\n\n"
         "Adapted {target_language} content to evaluate:\n---\n{adapted_content}\n---"),
    ])
    chain = prompt | structured_llm

    def node(state: TranslationState) -> dict:
        report: QualityReport = chain.invoke({
            "target_language": state["target_language"],
            "grade_level": state.get("grade_level", "unspecified"),
            "quality_threshold": state.get("quality_threshold", 8.0),
            "source_text": state["source_text"],
            "adapted_content": state["adapted_content"],
        })
        return {
            "quality_report": report.model_dump(),
            "revision_feedback": report.revision_feedback or "",
            "iteration": state.get("iteration", 0) + 1,
        }

    return node


# ---------------------------------------------------------------------------
# Finalize node — assembles Box 5 (Output)
# ---------------------------------------------------------------------------
def finalize_node(state: TranslationState) -> dict:
    bilingual_script = (
        f"--- English ---\n{state['source_text']}\n\n"
        f"--- {state['target_language']} ---\n{state['adapted_content']}"
    )
    final_output = {
        "translated_localized_material": state["adapted_content"],
        "bilingual_teacher_script": bilingual_script,
        "key_terms_and_cultural_examples": state.get("linguist_notes", ""),
        "quality_score_and_validation_report": state.get("quality_report", {}),
        "iterations_used": state.get("iteration", 0),
        "status": "approved" if state.get("quality_report", {}).get("approved") else "max_iterations_reached",
    }
    return {"final_output": final_output}
