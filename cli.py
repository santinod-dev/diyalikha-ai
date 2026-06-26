from __future__ import annotations

import argparse
import json
from pathlib import Path

from .llm import get_llm
from .models import TranslationRequest
from .orchestrator import TranslationPlanner
from .preprocessing import Preprocessor


def main() -> None:
    args = parse_args()
    text = args.text
    if args.file:
        text = Preprocessor.from_file(args.file)
    if not text:
        raise SystemExit("Provide either --text or --file.")

    request = TranslationRequest(
        text=text,
        source_language=args.source_language,
        target_language=args.target_language,
        dialect=args.dialect,
        grade_level=args.grade_level,
        subject=args.subject,
    )

    project_root = Path(__file__).resolve().parents[2]
    knowledge_root = project_root / "data" / "knowledge_base"
    planner = TranslationPlanner(llm=get_llm(args.provider), knowledge_root=knowledge_root)
    result = planner.run(request).as_dict()
    rendered = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        Path(args.output).write_text(rendered, encoding="utf-8")
    print(rendered)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Multi-Agent Translation System.")
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--text", help="Raw text to translate/localize.")
    input_group.add_argument("--file", help="Path to a .txt or .md file.")
    parser.add_argument("--source-language", default="English")
    parser.add_argument("--target-language", required=True)
    parser.add_argument("--dialect")
    parser.add_argument("--grade-level", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--provider", default="mock", choices=["mock"])
    parser.add_argument("--output", help="Optional path for JSON output.")
    return parser.parse_args()


if __name__ == "__main__":
    main()

