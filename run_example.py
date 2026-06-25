"""
Example: run the Multi-Agent Translation System against one piece of lesson
content, the way Box 1 (User Input) + Box 3 (RAG Knowledge Base) would feed it
in. Requires OPENAI_API_KEY to be set (see .env.example).

    python3 run_example.py
"""

import json
import os
from dotenv import load_dotenv

load_dotenv()

from app.graph import run_translation  # noqa: E402

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("Set OPENAI_API_KEY in your environment or a .env file first.")

    final_output = run_translation(
        source_text=(
            "Plants need sunlight, water, and air to grow. This process of making "
            "food using sunlight is called photosynthesis."
        ),
        target_language="Cebuano",
        grade_level="Grade 4",
        subject="Science",
        # In production this comes from Box 3 (RAG retrieval over DepEd standards,
        # dictionaries, regional terms, cultural knowledge). Hardcoded here as a stand-in:
        rag_context=(
            "DepEd Grade 4 Science term for 'photosynthesis': 'photosynthesis' is "
            "commonly taught using the loanword in Cebuano-medium classrooms, paired "
            "with a local explanation. Common regional analogy: comparing sunlight "
            "absorption to how rice plants visibly lean toward the sun in nearby fields."
        ),
        max_iterations=2,
        quality_threshold=8.0,
    )

    print(json.dumps(final_output, indent=2, ensure_ascii=False))
