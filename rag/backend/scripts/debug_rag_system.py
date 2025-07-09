#!/usr/bin/env python
"""Debug script to check RAG system components."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_rag_db
from app.models.graph import Post


def check_rag_database():
    """Check RAG database status."""
    print("=== RAG Database Check ===")
    try:
        with get_rag_db() as session:
            post_count = session.query(func.count(Post.post_id)).scalar()
            print(f"Total posts in RAG database: {post_count}")

            if post_count > 0:
                # Get some sample posts
                sample_posts = session.query(Post).limit(5).all()
                print("\nSample posts:")
                for post in sample_posts:
                    print(f"  - No.{post.source_post_no}: {post.content[:50]}...")

                # Check min/max post numbers
                min_max = session.query(
                    func.min(Post.source_post_no), func.max(Post.source_post_no)
                ).first()
                print(f"\nPost number range: {min_max[0]} - {min_max[1]}")
            else:
                print("WARNING: No posts found in RAG database!")
                print("Please run: python scripts/sync_data.py --initial")

    except Exception as e:
        print(f"ERROR checking RAG database: {e}")
        return False

    return post_count > 0


def check_chroma_index():
    """Check Chroma vector database."""
    print("\n=== Chroma Vector Database Check ===")
    try:
        # Initialize embeddings
        embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )

        # Initialize Chroma
        vectorstore = Chroma(
            collection_name=settings.collection_name,
            embedding_function=embeddings,
            persist_directory=settings.chroma_persist_directory,
        )

        # Get collection
        collection = vectorstore._collection
        count = collection.count()
        print(f"Total documents in Chroma: {count}")

        if count > 0:
            # Test similarity search
            test_query = "テスト質問"
            docs = vectorstore.similarity_search(test_query, k=3)
            print(f"\nTest search for '{test_query}' returned {len(docs)} results")

            for i, doc in enumerate(docs):
                print(f"\nResult {i+1}:")
                print(f"  Content: {doc.page_content[:100]}...")
                print(f"  Metadata: {doc.metadata}")
        else:
            print("WARNING: No documents found in Chroma!")
            print("Please run: python scripts/create_graphrag_index.py")

    except Exception as e:
        print(f"ERROR checking Chroma: {e}")
        return False

    return count > 0


def test_vector_search():
    """Test vector search functionality."""
    print("\n=== Vector Search Test ===")
    try:
        from app.rag.graphrag_chain import graphrag_chain

        # Test question
        test_question = "最新の投稿について教えてください"
        print(f"Testing with question: '{test_question}'")

        # Create initial state
        state = {
            "question": test_question,
            "vector_results": [],
            "graph_context": {},
            "formatted_context": "",
            "answer": "",
            "citations": [],
            "streaming_handler": None,
        }

        # Run vector retriever
        import asyncio

        result = asyncio.run(graphrag_chain._vector_retriever(state))

        print(f"Found {len(result['vector_results'])} posts")

        if result["vector_results"]:
            print("Vector search is working!")
            # Get post details
            with get_rag_db() as session:
                for post_id in result["vector_results"][:3]:
                    post = session.get(Post, post_id)
                    if post:
                        print(f"  - No.{post.source_post_no}: {post.content[:50]}...")
        else:
            print("WARNING: Vector search returned no results!")

    except Exception as e:
        print(f"ERROR testing vector search: {e}")
        import traceback

        traceback.print_exc()


def check_configuration():
    """Check configuration settings."""
    print("\n=== Configuration Check ===")
    print(f"Collection name: {settings.collection_name}")
    print(f"Chroma persist directory: {settings.chroma_persist_directory}")
    print(f"Embedding model: {settings.embedding_model}")
    print(f"LLM model: {settings.llm_model}")
    print(f"OpenAI API key: {'Set' if settings.openai_api_key else 'Not set'}")

    # Check if Chroma directory exists
    chroma_dir = Path(settings.chroma_persist_directory)
    print(f"\nChroma directory exists: {chroma_dir.exists()}")
    if chroma_dir.exists():
        files = list(chroma_dir.glob("*"))
        print(f"Files in Chroma directory: {len(files)}")


def main():
    """Run all debug checks."""
    print("RAG System Debug Report")
    print("=" * 50)

    # Check configuration
    check_configuration()

    # Check databases
    rag_ok = check_rag_database()
    chroma_ok = check_chroma_index()

    # Test vector search if databases are OK
    if rag_ok and chroma_ok:
        test_vector_search()

    print("\n" + "=" * 50)
    print("Debug Summary:")
    print(f"- RAG Database: {'OK' if rag_ok else 'NEEDS SETUP'}")
    print(f"- Chroma Index: {'OK' if chroma_ok else 'NEEDS SETUP'}")

    if not rag_ok:
        print("\nTo fix RAG database:")
        print("1. python scripts/init_rag_db.py")
        print("2. python scripts/sync_data.py --initial")

    if not chroma_ok:
        print("\nTo fix Chroma index:")
        print("1. python scripts/create_graphrag_index.py")


if __name__ == "__main__":
    main()
