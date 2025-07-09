use axum::extract::{Query, State};
use axum::Json;
use kernel::model::search::{Count, Res};
use registry::AppRegistry;
use shared::error::AppResult;

use crate::model::search::SearchRequest;

pub async fn search_handler(
    State(registry): State<AppRegistry>,
    Query(params): Query<SearchRequest>,
) -> AppResult<Json<Vec<Res>>> {
    registry
        .search_repository()
        .search(params.into())
        .await
        .map(Json)
}

pub async fn search_count_handler(
    State(registry): State<AppRegistry>,
    Query(params): Query<SearchRequest>,
) -> AppResult<Json<Count>> {
    registry
        .search_repository()
        .count(params.into())
        .await
        .map(Json)
}
