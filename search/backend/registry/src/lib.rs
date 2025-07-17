use std::sync::Arc;

use adapter::database::ConnectionPool;
use adapter::repository::ranking::RankingRepositoryImpl;
use adapter::repository::search::SearchRepositoryImpl;
use kernel::repository::ranking::RankingRepository;
use kernel::repository::search::SearchRepository;

#[derive(Clone)]
pub struct AppRegistry {
    pub search_repository: Arc<dyn SearchRepository>,
    pub ranking_repository: Arc<dyn RankingRepository>,
}

impl AppRegistry {
    pub fn new(pool: ConnectionPool) -> Self {
        Self {
            search_repository: Arc::new(SearchRepositoryImpl::new(pool.clone())),
            ranking_repository: Arc::new(RankingRepositoryImpl::new(pool.clone())),
        }
    }

    pub fn search_repository(&self) -> Arc<dyn SearchRepository> {
        self.search_repository.clone()
    }

    pub fn ranking_repository(&self) -> Arc<dyn RankingRepository> {
        self.ranking_repository.clone()
    }
}
