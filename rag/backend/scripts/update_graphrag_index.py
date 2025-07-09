#!/usr/bin/env python3
"""Update vector index for GraphRAG system incrementally."""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import get_rag_db
from app.models.graph import Post


class GraphRAGIndexUpdater:
    """Incremental updater for GraphRAG vector index."""

    def __init__(self):
        """Initialize the updater."""
        self.metadata_path = Path("graphrag_index_metadata.json")
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )
        self.vectorstore = Chroma(
            collection_name=settings.collection_name,
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_directory,
        )

    def load_metadata(self) -> dict[str, Any]:
        """Load index metadata from file."""
        if self.metadata_path.exists():
            with open(self.metadata_path, "r") as f:
                return json.load(f)
        return {
            "last_processed_post_no": 0,
            "last_processed_timestamp": None,
            "total_indexed": 0,
            "last_update": None,
        }

    def save_metadata(self, metadata: dict[str, Any]) -> None:
        """Save index metadata to file."""
        metadata["last_update"] = datetime.now().isoformat()
        with open(self.metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

    def get_indexed_post_ids(self) -> set[str]:
        """Get all post IDs currently in the index."""
        try:
            # Get all documents from Chroma
            results = self.vectorstore._collection.get()
            if results and "metadatas" in results:
                return {
                    meta["post_id"]
                    for meta in results["metadatas"]
                    if meta and "post_id" in meta
                }
        except Exception as e:
            print(f"⚠️  Warning: Could not retrieve existing documents: {e}")
        return set()

    async def update_index(
        self, batch_size: int = 100, force_reindex: bool = False
    ) -> int:
        """Update the vector index incrementally.

        Args:
            batch_size: Number of posts to process in each batch
            force_reindex: Force reindexing of all posts

        Returns:
            Number of posts indexed
        """
        metadata = self.load_metadata()

        if force_reindex:
            print("🔄 Force reindex mode: will reindex all posts")
            last_processed_no = 0
            indexed_post_ids = set()
        else:
            last_processed_no = metadata["last_processed_post_no"]
            print(f"📊 Incremental update from post No.{last_processed_no + 1}")
            indexed_post_ids = self.get_indexed_post_ids()
            print(f"📚 Found {len(indexed_post_ids)} posts already indexed")

        total_new_posts = 0
        total_updated_posts = 0

        with get_rag_db() as session:
            # Get posts newer than last processed
            query = select(Post).where(Post.source_post_no > last_processed_no)

            # If not force reindex, also check for updated posts
            if not force_reindex and metadata.get("last_processed_timestamp"):
                last_timestamp = datetime.fromisoformat(
                    metadata["last_processed_timestamp"]
                )
                # Get posts that were updated after our last run
                updated_query = select(Post).where(
                    Post.updated_at > last_timestamp,
                    Post.source_post_no <= last_processed_no,
                )
                updated_posts = session.execute(updated_query).scalars().all()

                if updated_posts:
                    print(f"🔄 Found {len(updated_posts)} updated posts to reindex")
                    total_updated_posts = len(updated_posts)
                    # Process updated posts
                    await self._process_posts(
                        updated_posts, indexed_post_ids, batch_size, is_update=True
                    )

            # Get total count of new posts
            new_count = session.execute(
                select(func.count()).select_from(Post).where(
                    Post.source_post_no > last_processed_no
                )
            ).scalar() or 0

            if new_count == 0:
                print("✅ No new posts to index")
                if total_updated_posts > 0:
                    print(f"📊 Updated {total_updated_posts} existing posts")
                return total_updated_posts

            print(f"📄 Found {new_count} new posts to index")

            # Process new posts in batches
            offset = 0
            max_post_no = last_processed_no

            while offset < new_count:
                # Get batch of posts
                posts = (
                    session.execute(
                        query.order_by(Post.source_post_no)
                        .limit(batch_size)
                        .offset(offset)
                    )
                    .scalars()
                    .all()
                )

                if not posts:
                    break

                # Process batch
                indexed_count = await self._process_posts(
                    posts, indexed_post_ids, batch_size, is_update=False
                )
                total_new_posts += indexed_count

                # Update max post number
                max_post_no = max(max_post_no, max(p.source_post_no for p in posts))

                # Update progress
                offset += batch_size
                print(
                    f"   Progress: {min(offset, new_count)}/{new_count} new posts processed"
                )

            # Get the latest timestamp
            latest_timestamp = session.execute(
                select(func.max(Post.updated_at))
            ).scalar()

            # Update metadata
            metadata["last_processed_post_no"] = max_post_no
            metadata["last_processed_timestamp"] = (
                latest_timestamp.isoformat() if latest_timestamp else None
            )
            metadata["total_indexed"] = len(indexed_post_ids)
            self.save_metadata(metadata)

        print("✅ GraphRAG vector index update completed!")
        print(f"📊 New posts indexed: {total_new_posts}")
        print(f"📊 Updated posts reindexed: {total_updated_posts}")
        print(f"📊 Total posts in index: {metadata['total_indexed']}")

        return total_new_posts + total_updated_posts

    async def _process_posts(
        self,
        posts: list[Post],
        indexed_post_ids: set[str],
        batch_size: int,
        is_update: bool = False,
    ) -> int:
        """Process a batch of posts.

        Args:
            posts: Posts to process
            indexed_post_ids: Set of already indexed post IDs
            batch_size: Batch size for vector store operations
            is_update: Whether these are updated posts

        Returns:
            Number of posts indexed
        """
        documents = []
        post_ids_to_delete = []

        for post in posts:
            post_id_str = str(post.post_id)

            # If updating, mark for deletion
            if is_update and post_id_str in indexed_post_ids:
                post_ids_to_delete.append(post_id_str)

            # Create document
            doc = Document(
                page_content=post.content,
                metadata={
                    "post_id": post_id_str,
                    "source_post_no": post.source_post_no,
                    "timestamp": post.timestamp.isoformat(),
                    "source": f"graphrag_post_{post.source_post_no}",
                    "author": post.author or "名無し",
                },
            )
            documents.append(doc)
            indexed_post_ids.add(post_id_str)

        # Delete old versions if updating
        if post_ids_to_delete:
            try:
                self.vectorstore._collection.delete(ids=post_ids_to_delete)
                print(f"   Deleted {len(post_ids_to_delete)} old document versions")
            except Exception as e:
                print(f"⚠️  Warning: Could not delete old documents: {e}")

        # Add documents in smaller batches to avoid timeouts
        indexed = 0
        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            try:
                self.vectorstore.add_documents(batch)
                indexed += len(batch)
            except Exception as e:
                print(f"❌ Error indexing batch: {e}")
                raise

        return indexed


async def main() -> None:
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Update GraphRAG vector index incrementally"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Batch size for processing (default: 100)",
    )
    parser.add_argument(
        "--force-reindex",
        action="store_true",
        help="Force reindexing of all posts",
    )

    args = parser.parse_args()

    updater = GraphRAGIndexUpdater()

    try:
        indexed = await updater.update_index(
            batch_size=args.batch_size,
            force_reindex=args.force_reindex,
        )
        if indexed == 0:
            print("ℹ️  Index is already up to date")
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())