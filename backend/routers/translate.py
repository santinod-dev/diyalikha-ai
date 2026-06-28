from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_uid
from models.schemas import TranslateRequest, TranslateResponse
from services import watsonx

router = APIRouter()


@router.post("", response_model=TranslateResponse)
async def translate(req: TranslateRequest, uid: str = Depends(get_current_uid)):
    try:
        result = await watsonx.run_translation_flow(
            text=req.text,
            grade_level=req.grade_level,
            subject_area=req.subject_area,
            target_dialect=req.target_dialect,
            source_language=req.source_language,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"watsonx error: {exc}") from exc

    output = result.get("output", result)
    return TranslateResponse(
        translated_text=output.get("translated_text", ""),
        bilingual_script=output.get("bilingual_script", ""),
        key_terms=output.get("key_terms", []),
        quality_score=float(output.get("quality_score", 0)),
    )
