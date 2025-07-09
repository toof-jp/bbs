#!/usr/bin/env python3
"""Clear all data from RAG database for fresh sync."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.core.database import get_rag_db


def main() -> None:
    """Clear all data from RAG database."""
    print("🧹 Clearing RAG database...")

    with get_rag_db() as session:
        try:
            # Delete all relationships first (foreign key constraint)
            session.execute(text("DELETE FROM relationships"))
            print("  - Deleted all relationships")

            # Delete all posts
            session.execute(text("DELETE FROM posts"))
            print("  - Deleted all posts")

            session.commit()
            print("✅ RAG database cleared successfully!")
        except Exception as e:
            print(f"❌ Error clearing database: {e}")
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
