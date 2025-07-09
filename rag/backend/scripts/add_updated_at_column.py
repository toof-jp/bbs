#!/usr/bin/env python3
"""Add updated_at column to posts table if it doesn't exist."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.core.database import get_rag_db


def main() -> None:
    """Add updated_at column to posts table."""
    print("🔧 Adding updated_at column to posts table...")

    with get_rag_db() as session:
        try:
            # Check if column exists
            result = session.execute(
                text(
                    """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'posts' 
                    AND column_name = 'updated_at'
                    """
                )
            ).scalar()

            if result:
                print("ℹ️  updated_at column already exists")
                return

            # Add updated_at column with default value
            session.execute(
                text(
                    """
                    ALTER TABLE posts 
                    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE 
                    DEFAULT CURRENT_TIMESTAMP
                    """
                )
            )
            
            # Update existing rows to have updated_at = created_at
            session.execute(
                text(
                    """
                    UPDATE posts 
                    SET updated_at = created_at 
                    WHERE updated_at IS NULL
                    """
                )
            )
            
            session.commit()
            print("✅ updated_at column added successfully!")
        except Exception as e:
            print(f"❌ Error adding updated_at column: {e}")
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()