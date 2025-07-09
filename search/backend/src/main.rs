use std::net::{Ipv4Addr, SocketAddr};

use adapter::database::connect_database;
//use adapter::redis::RedisClient;
use anyhow::{Context, Result};
use api::route::v1;
use axum::http::Method;
use axum::Router;
use registry::AppRegistry;
// use shared::config::AppConfig;
use shared::env::{which, Environment};
use tokio::net::TcpListener;
use tower_http::cors::{self, CorsLayer};
use tower_http::trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer};
use tower_http::LatencyUnit;
use tracing::Level;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    init_logger()?;
    bootstrap().await
}

fn init_logger() -> Result<()> {
    let log_level = match which() {
        Environment::Development => "debug",
        Environment::Produciton => "info",
    };

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| log_level.into());

    let subscriber = tracing_subscriber::fmt::layer()
        .with_file(true)
        .with_line_number(true)
        .with_target(false);

    tracing_subscriber::registry()
        .with(subscriber)
        .with(env_filter)
        .try_init()?;

    Ok(())
}

fn cors() -> CorsLayer {
    CorsLayer::new()
        .allow_headers(cors::Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_origin(cors::Any)
}

async fn bootstrap() -> Result<()> {
    //let app_config = AppConfig::new()?;
    dotenvy::dotenv()?;
    let database_url = std::env::var("DATABASE_URL").context("DATABASE_URL is not set")?;
    let pool = connect_database(&database_url)?;

    // TODO let kv = Arc::new(RedisClient::new(&app_config.redis).await?);

    // TODO let registry = AppRegistry::new(pool, kv, app_config);
    let registry = AppRegistry::new(pool);

    let app = Router::new()
        .merge(v1::route())
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_request(DefaultOnRequest::new().level(Level::INFO))
                .on_response(
                    DefaultOnResponse::new()
                        .level(Level::INFO)
                        .latency_unit(LatencyUnit::Millis),
                ),
        )
        .layer(cors())
        .with_state(registry);

    let addr = SocketAddr::new(Ipv4Addr::LOCALHOST.into(), 3000);
    let listener = TcpListener::bind(addr).await?;

    tracing::info!("Listening on {}", addr);

    axum::serve(listener, app)
        .await
        .context("Unexpected error happend in server")
        .inspect_err(|e| {
            tracing::error!(
                error.cause_chain = ?e,
                error.message = %e,
                "Unexpected error"
            )
        })
}
