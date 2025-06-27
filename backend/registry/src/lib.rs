use std::sync::Arc;

use adapter::database::ConnectionPool;
use adapter::repository::search::SearchRepositoryImpl;
use kernel::repository::search::SearchRepository;

#[derive(Clone)]
pub struct AppRegistry {
    pub search_repository: Arc<dyn SearchRepository>,
}

impl AppRegistry {
    pub fn new(pool: ConnectionPool) -> Self {
        Self {
            search_repository: Arc::new(SearchRepositoryImpl::new(pool.clone())),
        }
    }

    pub fn search_repository(&self) -> Arc<dyn SearchRepository> {
        self.search_repository.clone()
    }
}
