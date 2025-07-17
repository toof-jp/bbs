use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct RankingOptions {
    pub id: Option<String>,
    pub main_text: Option<String>,
    pub name_and_trip: Option<String>,
    pub oekaki: Option<bool>,
    pub date_range: Option<DateTimeRange>,
    pub ranking_type: RankingType,
    pub min_posts: i32,
}

#[derive(Debug, Clone)]
pub struct DateTimeRange {
    pub since: Option<DateTime<Utc>>,
    pub until: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub enum RankingType {
    PostCount,
    RecentActivity,
}

#[derive(Debug, Clone)]
pub struct RankingData {
    pub ranking: Vec<RankingEntry>,
    pub total_unique_ids: i64,
    pub total_res_count: i64,
    pub search_conditions: RankingSearchConditions,
}

#[derive(Debug, Clone)]
pub struct RankingEntry {
    pub rank: i64,
    pub id: String,
    pub post_count: i64,
    pub latest_post_no: i32,
    pub latest_post_datetime: DateTime<Utc>,
    pub first_post_no: i32,
    pub first_post_datetime: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct RankingSearchConditions {
    pub id: Option<String>,
    pub main_text: Option<String>,
    pub name_and_trip: Option<String>,
    pub oekaki: Option<bool>,
    pub since: Option<String>,
    pub until: Option<String>,
}

impl Default for RankingOptions {
    fn default() -> Self {
        Self {
            id: None,
            main_text: None,
            name_and_trip: None,
            oekaki: None,
            date_range: None,
            ranking_type: RankingType::PostCount,
            min_posts: 1,
        }
    }
}