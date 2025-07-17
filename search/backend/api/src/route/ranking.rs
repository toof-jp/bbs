use axum::{routing::get, Router};
use registry::AppRegistry;

use crate::handler::ranking::get_ranking;

pub fn build_ranking_router() -> Router<AppRegistry> {
    Router::new()
        .route("/ranking", get(get_ranking))
}