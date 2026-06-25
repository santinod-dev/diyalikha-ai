"""
Wires Agents A1/A2/A3 into a graph and implements the Planner's routing logic
(the orange "Orchestrated by Planner" box in the architecture diagram).

Flow:
    START -> linguist (A1) -> educator (A2) -> quality_checker (A3)
                                                      |
                                Planner decision: -----+-----
                                approved OR out of iterations -> finalize -> END
                                otherwise                       -> back to linguist (A1)

This realizes the double-headed arrows in the diagram (A1<->A2<->A3): on a
revision loop, content flows forward through A1->A2->A3 again, carrying the
Quality Checker's feedback.
"""

from langgraph.graph import StateGraph, START, END

from app.schemas import TranslationState
from app.agents import (
    make_context_linguist_node,
    make_educator_node,
    make_quality_checker_node,
    finalize_node,
)

LINGUIST = "context_linguist_agent"
EDUCATOR = "educator_agent"
QUALITY = "quality_checker_agent"
FINALIZE = "finalize"


def _route_after_quality_check(state: TranslationState) -> str:
    """The Planner: decide whether to ship the content or send it back for revision."""
    report = state.get("quality_report", {})
    out_of_iterations = state.get("iteration", 0) >= state.get("max_iterations", 2)

    if report.get("approved") or out_of_iterations:
        return FINALIZE
    return LINGUIST


def build_translation_graph(llm=None):
    """
    Build and compile the multi-agent translation graph.

    Args:
        llm: a LangChain chat model instance shared by all three agents.
             If None, defaults to ChatOpenAI(model="gpt-4o-mini").
             Pass a different/fake model here for testing (see tests/).
    """
    if llm is None:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

    graph = StateGraph(TranslationState)

    graph.add_node(LINGUIST, make_context_linguist_node(llm))
    graph.add_node(EDUCATOR, make_educator_node(llm))
    graph.add_node(QUALITY, make_quality_checker_node(llm))
    graph.add_node(FINALIZE, finalize_node)

    graph.add_edge(START, LINGUIST)
    graph.add_edge(LINGUIST, EDUCATOR)
    graph.add_edge(EDUCATOR, QUALITY)
    graph.add_conditional_edges(QUALITY, _route_after_quality_check, {
        FINALIZE: FINALIZE,
        LINGUIST: LINGUIST,
    })
    graph.add_edge(FINALIZE, END)

    return graph.compile()


def run_translation(
    source_text: str,
    target_language: str,
    grade_level: str = "",
    subject: str = "",
    rag_context: str = "",
    max_iterations: int = 2,
    quality_threshold: float = 8.0,
    llm=None,
) -> dict:
    """Convenience wrapper: run the full pipeline and return Box 5's final_output."""
    app_graph = build_translation_graph(llm=llm)
    initial_state: TranslationState = {
        "source_text": source_text,
        "target_language": target_language,
        "grade_level": grade_level,
        "subject": subject,
        "rag_context": rag_context,
        "iteration": 0,
        "max_iterations": max_iterations,
        "quality_threshold": quality_threshold,
        "revision_feedback": "",
    }
    result_state = app_graph.invoke(initial_state)
    return result_state["final_output"]
