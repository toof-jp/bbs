use chrono::{DateTime, NaiveDateTime, Utc};
use kernel::model::ranking::RankingEntry;

#[derive(sqlx::FromRow)]
pub struct RankingEntryRow {
    pub rank: i64,
    pub id: String,
    pub post_count: i64,
    pub latest_post_no: i32,
    pub latest_post_datetime: NaiveDateTime,
    pub first_post_no: i32,
    pub first_post_datetime: NaiveDateTime,
}

impl RankingEntryRow {
    pub fn into_ranking_entry(self) -> RankingEntry {
        RankingEntry {
            rank: self.rank,
            id: self.id,
            post_count: self.post_count,
            latest_post_no: self.latest_post_no,
            latest_post_datetime: DateTime::<Utc>::from_naive_utc_and_offset(self.latest_post_datetime, Utc),
            first_post_no: self.first_post_no,
            first_post_datetime: DateTime::<Utc>::from_naive_utc_and_offset(self.first_post_datetime, Utc),
        }
    }
}