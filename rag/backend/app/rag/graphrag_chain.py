"""GraphRAG chain implementation using LangGraph."""

import asyncio
import logging
from typing import Any, AsyncIterator, Optional, TypedDict
from uuid import UUID

from langchain.callbacks.base import AsyncCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.graph import END, StateGraph
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_rag_db
from app.models.graph import Post
from app.rag.graph_traversal import GraphTraverser

logger = logging.getLogger(__name__)


class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming tokens."""

    def __init__(self):
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.done = False

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Put new token to queue."""
        token_preview = token[:20] if len(token) > 20 else token
        logger.debug(f"StreamingCallbackHandler received token: {token_preview}")
        await self.queue.put(token)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Mark streaming as done."""
        self.done = True

    async def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        """Handle errors."""
        logger.error(f"LLM error: {error}")
        self.done = True

    async def aiter(self) -> AsyncIterator[str]:
        """Async iterator for tokens."""
        while not self.done or not self.queue.empty():
            try:
                token = await asyncio.wait_for(self.queue.get(), timeout=0.1)
                yield token
            except asyncio.TimeoutError:
                if self.done:
                    break
                continue


class GraphRAGState(TypedDict):
    """State for GraphRAG workflow."""

    question: str
    vector_results: list[UUID]
    graph_context: dict[str, Any]
    formatted_context: str
    answer: str
    citations: list[dict[str, Any]]
    streaming_handler: Optional[AsyncCallbackHandler]


class GraphRAGChain:
    """GraphRAG chain using LangGraph."""

    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )
        self.llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            api_key=settings.openai_api_key,
        )
        self.graph_traverser = GraphTraverser(max_depth=3, max_nodes=50)
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(GraphRAGState)

        # Add nodes
        workflow.add_node("vector_retriever", self._vector_retriever)
        workflow.add_node("graph_traverser", self._graph_traverser)
        workflow.add_node("context_synthesizer", self._context_synthesizer)
        workflow.add_node("response_generator", self._response_generator)
        workflow.add_node("citation_extractor", self._citation_extractor)

        # Add edges
        workflow.set_entry_point("vector_retriever")
        workflow.add_edge("vector_retriever", "graph_traverser")
        workflow.add_edge("graph_traverser", "context_synthesizer")
        workflow.add_edge("context_synthesizer", "response_generator")
        workflow.add_edge("response_generator", "citation_extractor")
        workflow.add_edge("citation_extractor", END)

        return workflow.compile()

    async def _vector_retriever(self, state: GraphRAGState) -> GraphRAGState:
        """Retrieve relevant posts using vector similarity."""
        logger.info(f"Vector retrieval for question: {state['question']}")

        # Import Chroma here to avoid circular imports
        from langchain_chroma import Chroma

        # Initialize Chroma vector store
        vectorstore = Chroma(
            collection_name=settings.collection_name,
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_directory,
        )

        # Search for similar documents
        docs = await asyncio.to_thread(vectorstore.similarity_search, state["question"], k=5)

        # Extract post IDs from metadata
        post_ids = []
        with get_rag_db() as session:
            for doc in docs:
                logger.debug(f"Document metadata: {doc.metadata}")

                # Handle different metadata formats
                if "source_post_no" in doc.metadata:
                    # GraphRAG index format
                    post = session.execute(
                        select(Post).where(
                            Post.source_post_no == int(doc.metadata["source_post_no"])
                        )
                    ).scalar_one_or_none()
                    if post:
                        post_ids.append(post.post_id)
                elif "start_no" in doc.metadata and "end_no" in doc.metadata:
                    # Sliding window format - get posts in the range
                    start_no = int(doc.metadata["start_no"])
                    end_no = int(doc.metadata["end_no"])
                    posts = (
                        session.execute(
                            select(Post)
                            .where(Post.source_post_no >= start_no, Post.source_post_no <= end_no)
                            .order_by(Post.source_post_no)
                        )
                        .scalars()
                        .all()
                    )

                    # Add up to 5 posts from each window
                    for post in posts[:5]:
                        if post.post_id not in post_ids:
                            post_ids.append(post.post_id)

        state["vector_results"] = post_ids
        logger.info(f"Found {len(post_ids)} relevant posts")
        return state

    async def _graph_traverser(self, state: GraphRAGState) -> GraphRAGState:
        """Traverse the graph to collect context."""
        logger.info("Starting graph traversal")

        with get_rag_db() as session:
            context = self.graph_traverser.get_conversation_context(
                session, state["vector_results"]
            )

        state["graph_context"] = context
        logger.info(f"Collected {context['stats']['total_posts']} posts from graph")
        return state

    async def _context_synthesizer(self, state: GraphRAGState) -> GraphRAGState:
        """Synthesize context for LLM."""
        logger.info("Synthesizing context")

        formatted_context = self.graph_traverser.format_context_for_llm(state["graph_context"])

        state["formatted_context"] = formatted_context
        return state

    async def _response_generator(self, state: GraphRAGState) -> GraphRAGState:
        """Generate response using LLM."""
        logger.info("Generating response")

        # Build prompt
        system_prompt = """あなたは賢い掲示板のアシスタントです。
提供された掲示板の会話コンテキストを元に、ユーザーの質問に日本語で回答してください。
文脈に答えがない場合は、無理に答えを生成せず「分かりません」と回答してください。

回答する際は、参考にしたレス番号（No.XXX）を明示してください。
会話の時系列的な流れを理解した上で回答してください。"""

        user_prompt = f"""【コンテキスト】
{state['formatted_context']}

【質問】
{state['question']}

【回答】"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # Use streaming handler if provided
        if state.get("streaming_handler"):
            response = await self.llm.ainvoke(
                messages,
                config={"callbacks": [state["streaming_handler"]]},
                stream=True,  # Enable streaming for ChatOpenAI
            )
        else:
            response = await self.llm.ainvoke(messages)

        state["answer"] = response.content
        return state

    async def _citation_extractor(self, state: GraphRAGState) -> GraphRAGState:
        """Extract citations from the answer."""
        logger.info("Extracting citations")

        import re

        # Extract post numbers from the answer (No.XXX format)
        post_numbers = re.findall(r"No\.(\d+)", state["answer"])
        logger.info(f"Found post numbers in answer: {post_numbers}")

        citations = []
        if post_numbers:
            with get_rag_db() as session:
                for post_no in post_numbers:
                    try:
                        post_no_int = int(post_no)
                        post = session.execute(
                            select(Post).where(Post.source_post_no == post_no_int)
                        ).scalar_one_or_none()

                        if post:
                            # Create citation info
                            citation = {
                                "source_post_no": post.source_post_no,
                                "author": post.author or "名無し",
                                "timestamp": post.timestamp.isoformat(),
                                "content_excerpt": (
                                    post.content[:200] + "..."
                                    if len(post.content) > 200
                                    else post.content
                                ),
                            }
                            citations.append(citation)
                            logger.info(f"Added citation for No.{post_no}")
                    except (ValueError, Exception) as e:
                        logger.warning(f"Failed to extract citation for No.{post_no}: {e}")

        # Also add citations from the context that were used
        if "posts" in state["graph_context"]:
            context_posts = state["graph_context"]["posts"]
            # Limit to top 5 most relevant posts not already in citations
            cited_nos = {c["source_post_no"] for c in citations}

            for post in context_posts[:10]:  # Check top 10 posts
                if post.source_post_no not in cited_nos and len(citations) < 5:
                    citation = {
                        "source_post_no": post.source_post_no,
                        "author": post.author or "名無し",
                        "timestamp": post.timestamp.isoformat(),
                        "content_excerpt": (
                            post.content[:200] + "..." if len(post.content) > 200 else post.content
                        ),
                    }
                    citations.append(citation)

        state["citations"] = citations
        logger.info(f"Total citations: {len(citations)}")
        return state

    async def ainvoke(
        self, question: str, streaming_handler: Optional[AsyncCallbackHandler] = None
    ) -> dict[str, Any]:
        """Invoke the GraphRAG chain.

        Args:
            question: User's question
            streaming_handler: Optional callback handler for streaming

        Returns:
            Dictionary with answer and context
        """
        initial_state = GraphRAGState(
            question=question,
            vector_results=[],
            graph_context={},
            formatted_context="",
            answer="",
            citations=[],
            streaming_handler=streaming_handler,
        )

        result = await self.workflow.ainvoke(initial_state)

        return {
            "answer": result["answer"],
            "citations": result["citations"],
            "context": result["graph_context"],
            "stats": result["graph_context"].get("stats", {}),
        }

    async def astream(self, question: str) -> AsyncIterator[str]:
        """Stream the answer for a question.

        Args:
            question: User's question

        Yields:
            Tokens of the generated answer
        """
        try:
            logger.info(f"Starting astream for question: {question}")

            # Use the StreamingCallbackHandler defined in this file
            stream_handler = StreamingCallbackHandler()

            # Run the chain asynchronously
            task = asyncio.create_task(self.ainvoke(question, stream_handler))

            # Stream tokens
            token_count = 0
            async for token in stream_handler.aiter():
                token_count += 1
                token_preview = token[:20] if len(token) > 20 else token
                logger.debug(f"Yielding token {token_count}: {token_preview}")
                yield token

            # Wait for completion
            await task
            logger.info(f"Completed streaming. Total tokens: {token_count}")

        except Exception as e:
            logger.error(f"Error in astream: {e}", exc_info=True)
            raise


# Global GraphRAG chain instance
graphrag_chain = GraphRAGChain()
