"""
Validates the Planner's routing logic (revision loop + max-iterations cutoff)
using a fake LLM, so this runs with no API key and no network access.

Run with: python3 -m tests.test_graph_routing
"""

from langchain_core.runnables import Runnable

from app.schemas import LinguistOutput, EducatorOutput, QualityReport
from app.graph import build_translation_graph


class _FakeStructuredRunnable(Runnable):
    """Returns canned responses in sequence, one per .invoke() call."""

    def __init__(self, responses):
        self._responses = responses
        self._calls = 0

    def invoke(self, _input, config=None, **kwargs):
        i = min(self._calls, len(self._responses) - 1)
        self._calls += 1
        return self._responses[i]


class FakeLLM:
    """Stands in for a ChatOpenAI model. Hands out a canned-response runnable
    per schema, so each agent's `.with_structured_output(Schema)` gets its
    own independent response sequence."""

    def __init__(self, responses_by_schema):
        self._responses_by_schema = responses_by_schema

    def with_structured_output(self, schema):
        return _FakeStructuredRunnable(self._responses_by_schema[schema])


def test_approves_on_first_pass():
    fake_llm = FakeLLM({
        LinguistOutput: [LinguistOutput(
            translated_text="Bersyon sa Cebuano", terminology_notes="n/a", cultural_notes="n/a")],
        EducatorOutput: [EducatorOutput(
            adapted_text="Bersyon sa Cebuano (adapted)", pedagogical_notes="simplified")],
        QualityReport: [QualityReport(
            grammar_score=9, accuracy_score=9, fluency_score=9, cultural_relevance_score=9,
            overall_score=9, issues=[], revision_feedback=None, approved=True)],
    })
    app_graph = build_translation_graph(llm=fake_llm)
    final_state = app_graph.invoke({
        "source_text": "Plants need sunlight to grow.",
        "target_language": "Cebuano",
        "grade_level": "Grade 3",
        "subject": "Science",
        "rag_context": "",
        "iteration": 0,
        "max_iterations": 2,
        "quality_threshold": 8.0,
        "revision_feedback": "",
    })
    out = final_state["final_output"]
    assert out["status"] == "approved"
    assert out["iterations_used"] == 1
    print("test_approves_on_first_pass: PASS")


def test_revises_then_approves():
    fake_llm = FakeLLM({
        LinguistOutput: [
            LinguistOutput(translated_text="draft v1", terminology_notes="n/a", cultural_notes="n/a"),
            LinguistOutput(translated_text="draft v2 (revised)", terminology_notes="n/a", cultural_notes="n/a"),
        ],
        EducatorOutput: [
            EducatorOutput(adapted_text="adapted v1", pedagogical_notes="n/a"),
            EducatorOutput(adapted_text="adapted v2", pedagogical_notes="n/a"),
        ],
        QualityReport: [
            QualityReport(grammar_score=5, accuracy_score=5, fluency_score=5, cultural_relevance_score=5,
                          overall_score=5, issues=["awkward phrasing"], revision_feedback="fix phrasing", approved=False),
            QualityReport(grammar_score=9, accuracy_score=9, fluency_score=9, cultural_relevance_score=9,
                          overall_score=9, issues=[], revision_feedback=None, approved=True),
        ],
    })
    app_graph = build_translation_graph(llm=fake_llm)
    final_state = app_graph.invoke({
        "source_text": "Plants need sunlight to grow.",
        "target_language": "Cebuano",
        "iteration": 0,
        "max_iterations": 2,
        "quality_threshold": 8.0,
        "revision_feedback": "",
    })
    out = final_state["final_output"]
    assert out["status"] == "approved"
    assert out["iterations_used"] == 2
    assert out["translated_localized_material"] == "adapted v2"
    print("test_revises_then_approves: PASS")


def test_stops_at_max_iterations_even_if_not_approved():
    never_approved = QualityReport(
        grammar_score=4, accuracy_score=4, fluency_score=4, cultural_relevance_score=4,
        overall_score=4, issues=["still bad"], revision_feedback="try again", approved=False)
    fake_llm = FakeLLM({
        LinguistOutput: [LinguistOutput(translated_text=f"draft v{i}", terminology_notes="", cultural_notes="") for i in range(5)],
        EducatorOutput: [EducatorOutput(adapted_text=f"adapted v{i}", pedagogical_notes="") for i in range(5)],
        QualityReport: [never_approved] * 5,
    })
    app_graph = build_translation_graph(llm=fake_llm)
    final_state = app_graph.invoke({
        "source_text": "Plants need sunlight to grow.",
        "target_language": "Cebuano",
        "iteration": 0,
        "max_iterations": 2,
        "quality_threshold": 8.0,
        "revision_feedback": "",
    })
    out = final_state["final_output"]
    assert out["status"] == "max_iterations_reached"
    assert out["iterations_used"] == 2  # stopped, did not loop forever
    print("test_stops_at_max_iterations_even_if_not_approved: PASS")


if __name__ == "__main__":
    test_approves_on_first_pass()
    test_revises_then_approves()
    test_stops_at_max_iterations_even_if_not_approved()
    print("\nAll planner routing tests passed.")
