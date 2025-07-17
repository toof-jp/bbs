use async_trait::async_trait;
use shared::error::AppResult;

use crate::model::ranking::{RankingData, RankingOptions};

#[async_trait]
pub trait RankingRepository: Send + Sync {
    async fn get_ranking(&self, options: RankingOptions) -> AppResult<RankingData>;
}