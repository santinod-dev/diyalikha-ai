from pathlib import Path
import unittest

from src.mats.llm import get_llm
from src.mats.models import TranslationRequest
from src.mats.orchestrator import TranslationPlanner


class PipelineTest(unittest.TestCase):
    def test_pipeline_returns_classroom_ready_shape(self) -> None:
        root = Path(__file__).resolve().parents[1]
        planner = TranslationPlanner(
            llm=get_llm("mock"),
            knowledge_root=root / "data" / "knowledge_base",
        )
        result = planner.run(
            TranslationRequest(
                text="Water can become water vapor when heated.",
                target_language="Cebuano",
                grade_level="Grade 4",
                subject="Science",
            )
        ).as_dict()

        self.assertIn("translated_material", result)
        self.assertIn("bilingual_teacher_script", result)
        self.assertIn("quality", result)
        self.assertGreaterEqual(result["quality"]["score"], 75)
        self.assertEqual(result["key_terms"]["water"], "tubig")


if __name__ == "__main__":
    unittest.main()
