use async_trait::async_trait;
use derive_new::new;
use kernel::model::search::{Count, Res, SearchOptions};
use kernel::repository::search::SearchRepository;
use shared::error::{AppError, AppResult};

use crate::database::model::search::{CountRow, ResRow};
use crate::database::ConnectionPool;

#[derive(new)]
pub struct SearchRepositoryImpl {
    db: ConnectionPool,
}

#[async_trait]
impl SearchRepository for SearchRepositoryImpl {
    async fn search(&self, options: SearchOptions) -> AppResult<Vec<Res>> {
        let comparison_operator = if options.ascending { ">" } else { "<" };
        let order = if options.ascending { "ASC" } else { "DESC" };

        let query_str = format!(
            r#"
                SELECT
                    r.no,
                    r.name_and_trip,
                    r.datetime,
                    r.datetime_text,
                    r.id,
                    r.main_text,
                    r.main_text_html,
                    r.oekaki_id,
                    o.oekaki_title,
                    o.original_oekaki_res_no
                FROM res r
                LEFT OUTER JOIN oekaki o USING (oekaki_id)
                WHERE r.id LIKE $1 || '%'
                AND r.name_and_trip LIKE '%' || $2 || '%'
                AND r.main_text LIKE '%' || $3 || '%'
                AND r.no {} $4
                AND r.datetime BETWEEN $5 AND $6
                AND ($7 = false OR r.oekaki_id IS NOT NULL)
                ORDER BY r.no {}
                LIMIT 100;
            "#,
            comparison_operator, order
        );

        sqlx::query_as::<_, ResRow>(&query_str)
            .bind(options.id)
            .bind(options.name_and_trip)
            .bind(options.main_text)
            .bind(options.cursor)
            .bind(options.since)
            .bind(options.until)
            .bind(options.oekaki)
            .fetch_all(self.db.inner_ref())
            .await
            .map(|rows| rows.into_iter().map(|row| row.into_res()).collect())
            .map_err(AppError::SpecificOperationError)
    }

    async fn count(&self, options: SearchOptions) -> AppResult<Count> {
        sqlx::query_as!(
            CountRow,
            r#"
                SELECT
                COUNT(*) AS "total_res_count!",
                COUNT(DISTINCT r.id) AS "unique_id_count!"
                FROM res r
                LEFT OUTER JOIN oekaki USING (oekaki_id)
                WHERE r.id LIKE $1 || '%'
                AND r.name_and_trip LIKE '%' || $2 || '%'
                AND r.main_text LIKE '%' || $3 || '%'
                AND r.datetime BETWEEN $4 AND $5
                AND ($6 = false OR r.oekaki_id IS NOT NULL);
            "#,
            options.id,
            options.name_and_trip,
            options.main_text,
            options.since,
            options.until,
            options.oekaki
        )
        .fetch_one(self.db.inner_ref())
        .await
        .map(|row| row.into_count())
        .map_err(AppError::SpecificOperationError)
    }
}
