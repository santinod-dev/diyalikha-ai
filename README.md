# Multi-Agent Translation System

This is a runnable Python scaffold for the architecture in the diagram:

1. User input
2. Preprocessing
3. RAG knowledge base
4. Planner-orchestrated agents
5. Classroom-ready output

It is designed for Philippine language and dialect localization workflows. The default `mock` LLM provider lets you run the pipeline immediately without API keys. Replace it with a real provider in `src/mats/llm.py` when you are ready to connect a model.

## Quick Start

```powershell
cd outputs/multi_agent_translation_system
python -m src.mats.cli --text "Photosynthesis is the process by which plants make food from sunlight." --target-language "Filipino" --grade-level "Grade 6" --subject "Science"
```

Or translate a text file:

```powershell
python -m src.mats.cli --file sample_input.txt --target-language "Cebuano" --grade-level "Grade 4" --subject "Araling Panlipunan" --output result.json
```

## Project Structure

```text
src/mats/
  agents.py          # Context/Linguist, Educator, and Quality Checker agents
  cli.py             # Command-line entry point
  knowledge_base.py  # Lightweight local RAG retrieval
  llm.py             # Mock LLM plus provider interface
  models.py          # Shared dataclasses
  orchestrator.py    # Planner that coordinates agents
  preprocessing.py   # Text cleaning, metadata, chunking
data/knowledge_base/
  curriculum_standards.json
  language_terms.json
  cultural_examples.json
```

## Notes

- The current parser handles plain text directly. PDF, DOCX, PPTX, and OCR are represented as extension points in `preprocessing.py`.
- The RAG layer uses simple keyword overlap so it works without extra dependencies. You can replace it with embeddings/vector search later.
- The mock LLM produces a traceable pseudo-translation so you can verify the pipeline shape before connecting a production model.

