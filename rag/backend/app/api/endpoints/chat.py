"""Chat endpoint for RAG queries."""

import json
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from sqlalchemy import func
from sse_starlette.sse import EventSourceResponse

from app.core.database import get_rag_db
from app.models.graph import Post
from app.rag.graphrag_chain import graphrag_chain
from app.rag.schemas import QuestionRequest, StreamToken

router = APIRouter()


async def generate_stream(question: str, conversation_id: str) -> AsyncGenerator[str, None]:
    """Generate SSE stream for the answer.

    Args:
        question: The question to answer
        conversation_id: Conversation ID for tracking (not used in GraphRAG)

    Yields:
        SSE formatted events
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"generate_stream called with question: {question}")
        token_count = 0

        # Create a task for the full result to get citations
        from app.rag.graphrag_chain import StreamingCallbackHandler

        stream_handler = StreamingCallbackHandler()

        # Run the chain asynchronously to get the full result including citations
        import asyncio

        full_result_task = asyncio.create_task(graphrag_chain.ainvoke(question, stream_handler))

        # Stream tokens
        async for token in stream_handler.aiter():
            token_count += 1
            logger.debug(
                f"Received token {token_count}: " f"{token[:20] if len(token) > 20 else token}"
            )
            # Format as SSE event
            event_data = StreamToken(token=token).model_dump_json()
            yield f"{event_data}"

        # Wait for the full result to get citations
        full_result = await full_result_task
        logger.info(f"Streaming completed. Total tokens: {token_count}")

        # Send citations event
        if "citations" in full_result and full_result["citations"]:
            citations_data = json.dumps(
                {"type": "citations", "citations": full_result["citations"]}
            )
            yield f"{citations_data}"

        # Send completion event
        completion_data = json.dumps({"type": "complete"})
        yield f"{completion_data}"

    except Exception as e:
        # Log the full error
        import traceback

        logger.error(f"Error in generate_stream: {e}")
        traceback.print_exc()
        # Send error event
        error_data = json.dumps({"type": "error", "message": str(e)})
        yield f"{error_data}"


@router.post("/ask")
async def ask_question(request: QuestionRequest) -> EventSourceResponse:
    """Ask a question about the bulletin board content.

    This endpoint streams the answer using Server-Sent Events (SSE).

    Args:
        request: Question request with question text and optional conversation ID

    Returns:
        EventSourceResponse streaming the answer tokens
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Use provided conversation_id or generate a default one
    conversation_id = request.conversation_id or "default"

    return EventSourceResponse(
        generate_stream(request.question, conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


@router.get("/status")
async def get_index_status() -> dict:
    """Get the current index status."""
    try:
        with get_rag_db() as session:
            # Get total posts count
            total_posts = session.query(func.count(Post.post_id)).scalar() or 0

            # Get min and max post numbers
            min_max = session.query(
                func.min(Post.source_post_no), func.max(Post.source_post_no)
            ).first()

            min_post_no = min_max[0] if min_max[0] is not None else 0
            max_post_no = min_max[1] if min_max[1] is not None else 0

            # Get last sync timestamp
            last_sync = session.query(func.max(Post.created_at)).scalar()

            return {
                "status": "ok",
                "index": {
                    "total_posts": total_posts,
                    "min_post_no": min_post_no,
                    "max_post_no": max_post_no,
                    "last_sync": last_sync.isoformat() if last_sync else None,
                },
            }
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error getting index status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
