# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot that searches BBS (bulletin board system) posts via HTTP API and displays results in Discord. The bot responds to mentions and supports various search parameters.

## Build and Development Commands

```bash
# Build the project
cargo build

# Run the project
cargo run

# Build for release
cargo build --release

# Run tests
cargo test

# Check code without building
cargo check

# Format code
cargo fmt

# Run linter
cargo clippy
```

## Commit Guidelines

Before committing any changes, always run the following commands to ensure code quality:

```bash
# Format code
cargo fmt

# Run clippy to check for common mistakes and improve code
cargo clippy
```

If these commands report any issues, fix them before committing. This helps maintain consistent code style and prevents CI failures.

## Architecture

### Core Components

1. **Discord Bot Framework**: Uses Serenity 0.12.4 for Discord integration
   - Handles Discord events and mentions
   - Manages message replies and interactions

2. **API Integration**: Uses reqwest for HTTP API calls
   - Connects to the search backend API
   - Handles search queries and responses

3. **Search Query Parser**: Custom parser for search syntax
   - Supports various search parameters (id, name_and_trip, oekaki, dates, etc.)
   - Extracts main text and parameters from user input

4. **Async Runtime**: Uses Tokio with multi-threaded runtime
   - Required for both Serenity and reqwest async operations

### Key Features

- Mention-based activation
- Multiple search criteria support
- Configurable default limit via environment variable
- Image embedding for oekaki posts
- Search result count display

### Search Syntax

The bot supports the following search syntax:
- `id:value` - Search by ID
- `name_and_trip:value` - Search by name and trip
- `oekaki:true/false` - Filter oekaki posts
- `since:YYYY-MM-DD` - Start date filter
- `until:YYYY-MM-DD` - End date filter
- `ascending:true/false` - Sort order
- `limit:number` - Result limit
- Any other text is treated as main text search

### Implementation Notes

- The bot parses mentions and extracts search queries
- API requests are made to the configured backend URL
- Results are formatted for Discord's message limits
- Images are embedded for posts with oekaki_id
- Error handling provides user-friendly messages