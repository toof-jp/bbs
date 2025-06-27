use axum::{routing::get, Router};
use registry::AppRegistry;

use crate::handler::search::{search_handler, search_count_handler};

pub fn build_search_router() -> Router<AppRegistry> {
    Router::new()
        .route("/search", get(search_handler))
        .route("/search/count", get(search_count_handler))
}
