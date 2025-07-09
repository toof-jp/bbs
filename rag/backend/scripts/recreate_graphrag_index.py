#!/usr/bin/env python3
"""Recreate GraphRAG vector index from scratch."""

import shutil
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

import subprocess

from app.core.config import settings


def clear_chroma_db():
    """Clear existing Chroma database."""
    chroma_dir = Path(settings.chroma_persist_directory)

    if chroma_dir.exists():
        print(f"🗑️  Clearing existing Chroma database at: {chroma_dir}")
        shutil.rmtree(chroma_dir)
        print("✅ Chroma database cleared")
    else:
        print("ℹ️  No existing Chroma database found")


def main():
    """Main function."""
    print("🔄 Recreating GraphRAG vector index...")
    print("=" * 50)

    # Step 1: Clear existing index
    clear_chroma_db()

    # Step 2: Run the GraphRAG index creation script
    print("\n📚 Creating new index from RAG database...")
    try:
        result = subprocess.run(
            [sys.executable, "scripts/create_graphrag_index.py"],
            capture_output=True,
            text=True,
            check=True,
        )
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating index: {e}")
        print("stdout:", e.stdout)
        print("stderr:", e.stderr)
        sys.exit(1)

    print("\n✅ GraphRAG index recreation completed!")


if __name__ == "__main__":
    main()
