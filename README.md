# DiyaLikha AI — Multi-Agent Translation Engine (Box 4)

This is a runnable implementation of **System 1, Box 4** from your architecture
diagram: the LangGraph-orchestrated A1 → A2 → A3 agent pipeline with a Planner
that can send content back for revision.

## How it maps to the diagram

| Diagram | Code |
|---|---|
| A1. Context & Linguist Agent (merged) | `app/agents.py::make_context_linguist_node` |
| A2. Educator Agent | `app/agents.py::make_educator_node` |
| A3. Quality Checker Agent | `app/agents.py::make_quality_checker_node` |
| Orchestrated by Planner | `app/graph.py::_route_after_quality_check` (conditional edge) |
| Output (Internal) | `app/agents.py::finalize_node` |
| Box 5. Output | the `final_output` dict returned by `run_translation()` |

**The revision loop** (the double-headed arrows between A1↔A2↔A3 in the
diagram): after A3 scores the content, the Planner checks
`quality_report.approved`. If `False` and iterations remain, it routes back
to A1 with `revision_feedback` already in state, so A1's next pass is told
exactly what to fix. If approved, or `max_iterations` is hit, it routes to
`finalize` instead. See `_route_after_quality_check` in `app/graph.py`.

## What this assumes from upstream (Boxes 1–3)

This module starts from clean, already-retrieved inputs:

- `source_text` — cleaned/chunked text from Box 2 (Preprocessing)
- `target_language`, `grade_level`, `subject` — from Box 1 (User Input)
- `rag_context` — a string of retrieved snippets from Box 3 (RAG Knowledge
  Base: DepEd standards, dictionaries, regional terms, cultural knowledge,
  lesson templates). **You need to plug your retriever in here** — right now
  it's just a plain string parameter on `run_translation()` / the `/translate`
  endpoint. A common next step: do the retrieval, join the top-k chunks into
  one string, and pass it as `rag_context`.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # then put your real OPENAI_API_KEY in .env
```

## Run it

**As a script:**
```bash
python3 run_example.py
```

**As an API** (so your teacher/admin upload UI or student UI can call it from
any stack):
```bash
uvicorn api:app --reload --port 8000
curl -X POST localhost:8000/translate -H "Content-Type: application/json" -d '{
  "source_text": "Plants need sunlight to grow.",
  "target_language": "Cebuano",
  "grade_level": "Grade 4",
  "subject": "Science",
  "rag_context": ""
}'
```

**Run the tests** (no API key or network needed — uses a fake LLM to verify
the Planner's routing logic):
```bash
python3 -m tests.test_graph_routing
```

## Output shape (Box 5)

```json
{
  "translated_localized_material": "...",
  "bilingual_teacher_script": "--- English ---\n...\n\n--- Cebuano ---\n...",
  "key_terms_and_cultural_examples": "...",
  "quality_score_and_validation_report": {
    "grammar_score": 9, "accuracy_score": 9, "fluency_score": 8,
    "cultural_relevance_score": 9, "overall_score": 8.7,
    "issues": [], "revision_feedback": null, "approved": true
  },
  "iterations_used": 1,
  "status": "approved"
}
```

`"Ready-to-print material"` (also in Box 5) isn't generated here — that's a
formatting/export step (e.g. your docx/PDF generation) that should consume
`final_output` once it's approved.

## Tuning for the hackathon demo

- `quality_threshold` (default 8.0) and `max_iterations` (default 2) are
  exposed as parameters on `run_translation()` / the API — turn the threshold
  down or iterations down if you need faster/cheaper demo runs.
- Swap `gpt-4o-mini` for a stronger model in `app/graph.py::build_translation_graph`
  if quality matters more than speed/cost for your demo's "wow" lesson.
- The Quality Checker's structured score (`grammar`, `accuracy`, `fluency`,
  `cultural_relevance`) is exactly the kind of concrete, inspectable output
  judges like to see — consider surfacing it directly in your UI rather than
  just showing the final text.
