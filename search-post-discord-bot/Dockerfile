# syntax=docker/dockerfile:1
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /search-post-discord-bot

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /search-post-discord-bot/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /search-post-discord-bot
COPY --from=builder /search-post-discord-bot/target/release/search-post-discord-bot ./target/release/search-post-discord-bot
USER 1000
ENTRYPOINT ["./target/release/search-post-discord-bot"]
