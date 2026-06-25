"""
Minimal HTTP wrapper around the translation graph, so your teacher/admin
upload UI (or student UI) can call this regardless of what stack it's built
in.

Run with:  uvicorn api:app --reload --port 8000
Then:      POST http://localhost:8000/translate
"""

import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from app.graph import run_translation  # noqa: E402

app = FastAPI(title="DiyaLikha AI — Multi-Agent Translation Engine")


class TranslateRequest(BaseModel):
    source_text: str
    target_language: str
    grade_level: str = ""
    subject: str = ""
    rag_context: str = ""          # output of your Box 3 RAG retrieval step
    max_iterations: int = 2
    quality_threshold: float = 8.0


@app.post("/translate")
def translate(req: TranslateRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set on the server.")
    try:
        final_output = run_translation(
            source_text=req.source_text,
            target_language=req.target_language,
            grade_level=req.grade_level,
            subject=req.subject,
            rag_context=req.rag_context,
            max_iterations=req.max_iterations,
            quality_threshold=req.quality_threshold,
        )
        return final_output
    except Exception as e:  # surface agent/LLM errors clearly during the demo
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
