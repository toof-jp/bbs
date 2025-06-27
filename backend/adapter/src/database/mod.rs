use anyhow::Result;
use shared::error::{AppError, AppResult};
use sqlx::PgPool;

pub mod model;

#[derive(Clone)]
pub struct ConnectionPool(PgPool);

impl ConnectionPool {
    pub fn new(pool: PgPool) -> Self {
        Self(pool)
    }

    pub fn inner_ref(&self) -> &PgPool {
        &self.0
    }

    pub async fn begin(&self) -> AppResult<sqlx::Transaction<'_, sqlx::Postgres>> {
        self.0.begin().await.map_err(AppError::TransactionError)
    }
}

pub fn connect_database(url: &str) -> Result<ConnectionPool> {
    Ok(ConnectionPool(PgPool::connect_lazy(url)?))
}
