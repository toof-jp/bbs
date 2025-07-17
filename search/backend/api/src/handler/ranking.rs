use axum::extract::{Query, State};
use axum::Json;
use registry::AppRegistry;
use shared::error::AppResult;

use crate::model::ranking::{RankingRequest, RankingResponse};

pub async fn get_ranking(
    State(registry): State<AppRegistry>,
    Query(req): Query<RankingRequest>,
) -> AppResult<Json<RankingResponse>> {
    let ranking_options = req.try_into()?;
    let ranking_data = registry
        .ranking_repository()
        .get_ranking(ranking_options)
        .await?;
    
    Ok(Json(ranking_data.into()))
}