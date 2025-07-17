use async_trait::async_trait;
use derive_new::new;
use kernel::{
    model::ranking::{RankingData, RankingEntry, RankingOptions, RankingSearchConditions, RankingType},
    repository::ranking::RankingRepository,
};
use shared::error::{AppError, AppResult};

use crate::database::model::ranking::RankingEntryRow;
use crate::database::ConnectionPool;

#[derive(new)]
pub struct RankingRepositoryImpl {
    db: ConnectionPool,
}

#[async_trait]
impl RankingRepository for RankingRepositoryImpl {
    async fn get_ranking(&self, options: RankingOptions) -> AppResult<RankingData> {
        let mut query = r#"
            WITH ranked_ids AS (
                SELECT 
                    id,
                    COUNT(*) as post_count,
                    MAX(no) as latest_post_no,
                    MAX(datetime) as latest_post_datetime,
                    MIN(no) as first_post_no,
                    MIN(datetime) as first_post_datetime
                FROM res
                WHERE id IS NOT NULL AND id != ''
        "#.to_string();

        // Build dynamic WHERE conditions
        let mut where_conditions = vec![];
        let mut bind_values: Vec<String> = vec![];
        let mut bind_index = 1;

        if let Some(id) = &options.id {
            where_conditions.push(format!("id LIKE ${}::text", bind_index));
            bind_values.push(format!("%{}%", id));
            bind_index += 1;
        }
        
        if let Some(main_text) = &options.main_text {
            where_conditions.push(format!("main_text LIKE ${}::text", bind_index));
            bind_values.push(format!("%{}%", main_text));
            bind_index += 1;
        }
        
        if let Some(name_and_trip) = &options.name_and_trip {
            where_conditions.push(format!("name_and_trip LIKE ${}::text", bind_index));
            bind_values.push(format!("%{}%", name_and_trip));
            bind_index += 1;
        }
        
        if let Some(true) = options.oekaki {
            where_conditions.push("oekaki_id IS NOT NULL".to_string());
        }
        
        if let Some(date_range) = &options.date_range {
            if let Some(since) = &date_range.since {
                where_conditions.push(format!("datetime >= ${}::timestamp", bind_index));
                bind_values.push(since.naive_utc().to_string());
                bind_index += 1;
            }
            if let Some(until) = &date_range.until {
                where_conditions.push(format!("datetime <= ${}::timestamp", bind_index));
                bind_values.push(until.naive_utc().to_string());
                bind_index += 1;
            }
        }
        
        if !where_conditions.is_empty() {
            query.push_str(&format!(" AND {}", where_conditions.join(" AND ")));
        }
        
        query.push_str(&format!(
            r#"
                GROUP BY id
                HAVING COUNT(*) >= ${}
            )
            SELECT 
                ROW_NUMBER() OVER (ORDER BY {} DESC) as rank,
                id,
                post_count,
                latest_post_no,
                latest_post_datetime,
                first_post_no,
                first_post_datetime
            FROM ranked_ids
            ORDER BY {} DESC
            "#,
            bind_index,
            match &options.ranking_type {
                RankingType::PostCount => "post_count",
                RankingType::RecentActivity => "latest_post_datetime",
            },
            match &options.ranking_type {
                RankingType::PostCount => "post_count",
                RankingType::RecentActivity => "latest_post_datetime",
            }
        ));

        // Build the query dynamically
        let mut sql_query = sqlx::query_as::<_, RankingEntryRow>(&query);
        
        // Bind values in order
        for value in &bind_values {
            sql_query = sql_query.bind(value);
        }
        
        // Bind min_posts last
        sql_query = sql_query.bind(options.min_posts);

        let rows = sql_query.fetch_all(self.db.inner_ref()).await
            .map_err(AppError::SpecificOperationError)?;
        
        let total_unique_ids = rows.len() as i64;
        let ranking: Vec<RankingEntry> = rows.into_iter()
            .map(|row| row.into_ranking_entry())
            .collect();

        let search_conditions = RankingSearchConditions {
            id: options.id.clone(),
            main_text: options.main_text.clone(),
            name_and_trip: options.name_and_trip.clone(),
            oekaki: options.oekaki,
            since: options.date_range.as_ref().and_then(|dr| dr.since.map(|dt| dt.to_rfc3339())),
            until: options.date_range.as_ref().and_then(|dr| dr.until.map(|dt| dt.to_rfc3339())),
        };

        Ok(RankingData {
            ranking,
            total_unique_ids,
            search_conditions,
        })
    }
}