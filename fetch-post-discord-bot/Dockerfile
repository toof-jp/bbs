# syntax=docker/dockerfile:1
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /fetch-post-discord-bot

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /fetch-post-discord-bot/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /fetch-post-discord-bot
COPY --from=builder /fetch-post-discord-bot/target/release/bbs-fetch-post-discord-bot ./target/release/bbs-fetch-post-discord-bot
USER 1000
ENTRYPOINT ["./target/release/bbs-fetch-post-discord-bot"]
