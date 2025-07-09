use async_trait::async_trait;
use shared::error::AppResult;

use crate::model::search::{Count, Res, SearchOptions};

#[async_trait]
pub trait SearchRepository: Send + Sync {
    async fn search(&self, options: SearchOptions) -> AppResult<Vec<Res>>;
    async fn count(&self, options: SearchOptions) -> AppResult<Count>;
}
