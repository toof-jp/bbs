# syntax=docker/dockerfile:1
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /search/crawler

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
COPY --from=planner /search/crawler/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim 
WORKDIR /search/crawler
COPY --from=builder ./search/crawler/target/release/bbs-search-crawler ./target/release/bbs-search-crawler
USER 1000
ENTRYPOINT ["./target/release/bbs-search-crawler"]
