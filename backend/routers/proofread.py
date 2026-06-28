import json
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_uid
from models.schemas import ProofreadRequest, ProofreadResponse, Suggestion
from services import watsonx

router = APIRouter()


@router.post("", response_model=ProofreadResponse)
async def proofread(req: ProofreadRequest, uid: str = Depends(get_current_uid)):
    """
    Calls the A3 Quality Checker agent via the translation flow's proofread
    entry point and returns structured suggestions.
    """
    try:
        # A3 can be invoked directly; we reuse invoke_orchestrate_flow with the
        # translation flow ID — the backend passes a proofread-only context so
        # the Orchestrator routes to A3 only.
        result = await watsonx.invoke_orchestrate_flow(
            watsonx.TRANSLATION_FLOW_ID,
            {
                "mode": "proofread",
                "text": req.text,
                "dialect": req.dialect,
                "grade_level": req.grade_level,
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"watsonx error: {exc}") from exc

    output = result.get("output", result)

    # A3 returns JSON; handle both pre-parsed dict and raw string
    if isinstance(output, str):
        try:
            output = json.loads(output)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=502, detail=f"Could not parse A3 response as JSON: {exc}"
            ) from exc

    suggestions = [
        Suggestion(
            severity=s.get("severity", "suggestion"),
            original=s.get("original", ""),
            corrected=s.get("corrected", ""),
            reason=s.get("reason", ""),
            position=s.get("position"),
        )
        for s in output.get("suggestions", [])
    ]

    return ProofreadResponse(
        quality_score=float(output.get("quality_score", 0)),
        suggestions=suggestions,
    )
