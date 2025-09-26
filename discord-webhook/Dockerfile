# syntax=docker/dockerfile:1
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /discord-webhook

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /discord-webhook/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /discord-webhook
COPY --from=builder /discord-webhook/target/release/bbs-discord-webhook ./target/release/bbs-discord-webhook
USER 1000
ENTRYPOINT ["./target/release/bbs-discord-webhook"]
