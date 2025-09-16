# syntax=docker/dockerfile:1
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /search/backend

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
COPY --from=planner /search/backend/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim 
WORKDIR /search/backend
COPY --from=builder ./search/backend/target/release/bbs-search-backend ./target/release/bbs-search-backend
USER 1000
ENTRYPOINT ["./target/release/bbs-search-backend"]
