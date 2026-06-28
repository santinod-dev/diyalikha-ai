from __future__ import annotations
import json
import os
import re
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

load_dotenv()

IBM_API_KEY     = os.environ["IBM_API_KEY"]
WATSONX_URL     = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_PROJECT_ID = os.environ["WATSONX_PROJECT_ID"]

# Default model — can be overridden via env var
MODEL_ID = os.environ.get("WATSONX_MODEL_ID", "meta-llama/llama-3-3-70b-instruct")

# ── SDK client (lazy singleton) ────────────────────────────────────────────────
_client: APIClient | None = None

def _get_client() -> APIClient:
    global _client
    if _client is None:
        _client = APIClient(
            credentials=Credentials(
                url=WATSONX_URL,
                api_key=IBM_API_KEY,
                # No instance_id — IBM Cloud SaaS is detected automatically from the .ml.cloud.ibm.com URL
            ),
            project_id=WATSONX_PROJECT_ID,
        )
    return _client


def _get_model() -> ModelInference:
    return ModelInference(
        model_id=MODEL_ID,
        api_client=_get_client(),
        params={
            "max_new_tokens": 2048,
            "temperature": 0.3,
            "repetition_penalty": 1.1,
        },
    )


# ── Low-level chat helper ──────────────────────────────────────────────────────

async def _chat(system_prompt: str, user_message: str) -> str:
    """
    Sends a system + user message to the watsonx.ai LLM and returns the
    raw text response. Uses the chat (messages) API format.
    """
    model = _get_model()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_message},
    ]
    # ModelInference.chat() is synchronous — run in thread to avoid blocking
    import asyncio
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: model.chat(messages=messages),
    )
    # Extract content from response
    return response["choices"][0]["message"]["content"].strip()


def _extract_json(text: str) -> dict:
    """
    Extracts the first JSON object from a model response string.
    Handles markdown code fences and leading/trailing text.
    """
    # Strip markdown fences if present
    text = re.sub(r"```(?:json)?", "", text).strip()
    # Find the first { ... } block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in model response: {text[:200]}")
    return json.loads(match.group())


# ── Agent system prompts ───────────────────────────────────────────────────────

_A1_SYSTEM = """You are a Filipino educational linguist and dialect expert.
You will receive a lesson text, a target Philippine dialect, a grade level, and a subject area.

Your job is to do ALL of the following in a single response:
1. Translate the lesson text into the specified target Philippine dialect accurately, preserving all educational content.
2. Adapt the translated text for the specified grade level — use simple, age-appropriate vocabulary and sentence structures.
3. Align the content with DepEd curriculum standards for the specified subject area.

Return your response as a JSON object with this exact structure and no other text:
{
  "translated_text": "...",
  "bilingual_script": "...",
  "key_terms": [{"term": "...", "translation": "...", "example": "..."}]
}"""

_A3_SYSTEM = """You are an expert proofreader and quality checker for Filipino educational materials translated into local dialects.

You will receive a translated text, the target dialect, and the grade level.
Your job is to:
1. Check grammar, spelling, and fluency in the target dialect.
2. Verify dialect accuracy — flag terms that do not belong to the specified dialect.
3. Check that vocabulary is appropriate for the grade level.
4. Check cultural relevance and sensitivity.
5. Calculate an overall quality score from 0 to 100.

You MUST respond ONLY with a valid JSON object in this exact structure, no other text before or after it:
{
  "quality_score": 85,
  "suggestions": [
    {
      "severity": "critical",
      "original": "the exact phrase from the text",
      "corrected": "the corrected version",
      "reason": "brief explanation"
    }
  ]
}

Severity levels: "critical" (wrong dialect or grammar error), "major" (awkward phrasing), "suggestion" (style improvement).
If there are no issues, return an empty suggestions array and a high quality_score.
IMPORTANT: Output ONLY the JSON. No introductory text, no markdown fences."""

_BAO_SYSTEM = """You are Bao, a friendly and encouraging AI teaching assistant for Filipino elementary school teachers.
You help teachers create localized learning materials including lesson plans, activities, worksheets, and quizzes.

Always respond in the teacher's requested output language (Filipino, Waray, Ilocano, Cebuano, etc.).
Adapt all content to the specified grade level and learning style.
When file context is provided, reference the content of that translated lesson material in your response.
Be warm, supportive, and practical — you understand the challenges of teaching in multilingual communities.

Format lesson plans clearly with sections: Objectives, Materials, Lesson Flow (with time stamps), and Assessment."""


# ── Public API — same signatures as before so routers need no changes ──────────

async def run_translation_flow(
    text: str,
    grade_level: str,
    subject_area: str,
    target_dialect: str,
    source_language: str,
) -> dict:
    """
    Agent A1: translate + grade-adapt the lesson text.
    Agent A3: quality-check the translation.
    Returns merged dict with keys: translated_text, bilingual_script,
    key_terms, quality_score, suggestions.
    """
    # ── A1: translate ──────────────────────────────────────────────────────────
    a1_user = (
        f"Source language: {source_language}\n"
        f"Target dialect: {target_dialect}\n"
        f"Grade level: {grade_level}\n"
        f"Subject area: {subject_area}\n\n"
        f"Lesson text:\n{text}"
    )
    a1_raw = await _chat(_A1_SYSTEM, a1_user)
    try:
        a1 = _extract_json(a1_raw)
    except (ValueError, json.JSONDecodeError):
        # Fallback: return raw text if JSON parse fails
        a1 = {"translated_text": a1_raw, "bilingual_script": "", "key_terms": []}

    # ── A3: quality check ──────────────────────────────────────────────────────
    a3_user = (
        f"Target dialect: {target_dialect}\n"
        f"Grade level: {grade_level}\n\n"
        f"Text to check:\n{a1.get('translated_text', a1_raw)}"
    )
    a3_raw = await _chat(_A3_SYSTEM, a3_user)
    try:
        a3 = _extract_json(a3_raw)
    except (ValueError, json.JSONDecodeError):
        a3 = {"quality_score": 0, "suggestions": []}

    return {
        "translated_text": a1.get("translated_text", ""),
        "bilingual_script": a1.get("bilingual_script", ""),
        "key_terms":        a1.get("key_terms", []),
        "quality_score":    a3.get("quality_score", 0),
        "suggestions":      a3.get("suggestions", []),
    }


async def run_proofread(
    text: str,
    dialect: str,
    grade_level: str,
) -> dict:
    """Agent A3 only — for the /proofread endpoint."""
    a3_user = (
        f"Target dialect: {dialect}\n"
        f"Grade level: {grade_level}\n\n"
        f"Text to check:\n{text}"
    )
    a3_raw = await _chat(_A3_SYSTEM, a3_user)
    try:
        return _extract_json(a3_raw)
    except (ValueError, json.JSONDecodeError):
        return {"quality_score": 0, "suggestions": []}


async def run_bao_chat_flow(
    message: str,
    output_language: str,
    grade_level: str,
    learning_style: str,
    file_context: str | None,
) -> dict:
    """Agent A2 (Bao) only."""
    user_msg = (
        f"{message}\n\n"
        f"Output language: {output_language}\n"
        f"Grade level: {grade_level}\n"
        f"Learning style: {learning_style}\n"
        f"File context: {file_context or 'none'}"
    )
    content = await _chat(_BAO_SYSTEM, user_msg)
    return {"content": content}


# ── Kept for backwards compat (proofread router calls this) ───────────────────

async def invoke_orchestrate_flow(flow_id: str, payload: dict) -> dict:
    """
    Legacy shim — routes to the correct function based on payload shape.
    The proofread router calls this with mode='proofread'.
    """
    if payload.get("mode") == "proofread":
        return await run_proofread(
            text=payload["text"],
            dialect=payload["dialect"],
            grade_level=payload["grade_level"],
        )
    # Fallback: treat as translation
    return await run_translation_flow(
        text=payload.get("text", ""),
        grade_level=payload.get("grade_level", ""),
        subject_area=payload.get("subject_area", ""),
        target_dialect=payload.get("target_dialect", ""),
        source_language=payload.get("source_language", "English"),
    )
