from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_uid
from models.schemas import ChatRequest, ChatResponse
from services import watsonx

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, uid: str = Depends(get_current_uid)):
    try:
        result = await watsonx.run_bao_chat_flow(
            message=req.message,
            output_language=req.output_language,
            grade_level=req.grade_level,
            learning_style=req.learning_style,
            file_context=req.file_context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"watsonx error: {exc}") from exc

    output = result.get("output", result)
    content = output if isinstance(output, str) else output.get("content", "")
    return ChatResponse(content=content)
