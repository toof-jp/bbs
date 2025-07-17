use axum::Router;
use registry::AppRegistry;

use crate::route::ranking::build_ranking_router;
use crate::route::search::build_search_router;

pub fn route() -> Router<AppRegistry> {
    let router = Router::new()
        .merge(build_search_router())
        .merge(build_ranking_router());

    Router::new().nest("/api/v1", router)
}
