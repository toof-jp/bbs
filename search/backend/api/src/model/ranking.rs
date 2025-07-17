use chrono::{DateTime, NaiveDate, Utc};
use kernel::model::ranking::{
    DateTimeRange, RankingData, RankingEntry, RankingOptions,
    RankingType as KernelRankingType,
};
use serde::{Deserialize, Deserializer, Serialize};
use shared::error::{AppError, AppResult};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RankingType {
    PostCount,
    RecentActivity,
}

impl From<RankingType> for KernelRankingType {
    fn from(ranking_type: RankingType) -> Self {
        match ranking_type {
            RankingType::PostCount => KernelRankingType::PostCount,
            RankingType::RecentActivity => KernelRankingType::RecentActivity,
        }
    }
}

impl From<KernelRankingType> for RankingType {
    fn from(ranking_type: KernelRankingType) -> Self {
        match ranking_type {
            KernelRankingType::PostCount => RankingType::PostCount,
            KernelRankingType::RecentActivity => RankingType::RecentActivity,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RankingRequest {
    pub id: Option<String>,
    pub main_text: Option<String>,
    pub name_and_trip: Option<String>,
    pub oekaki: Option<bool>,
    #[serde(default, deserialize_with = "deserialize_date")]
    pub since: Option<NaiveDate>,
    #[serde(default, deserialize_with = "deserialize_date")]
    pub until: Option<NaiveDate>,
    #[serde(default = "default_ranking_type")]
    pub ranking_type: RankingType,
    #[serde(default = "default_min_posts")]
    pub min_posts: i32,
}

fn default_ranking_type() -> RankingType {
    RankingType::PostCount
}

fn default_min_posts() -> i32 {
    1
}

fn deserialize_date<'de, D>(de: D) -> Result<Option<NaiveDate>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(de)?;
    const FORMAT: &str = "%Y-%m-%d";
    match opt.as_deref() {
        None | Some("") => Ok(None),
        Some(s) => NaiveDate::parse_from_str(s, FORMAT)
            .map(Some)
            .map_err(serde::de::Error::custom),
    }
}


impl TryFrom<RankingRequest> for RankingOptions {
    type Error = AppError;

    fn try_from(req: RankingRequest) -> AppResult<Self> {
        let date_range = match (req.since, req.until) {
            (None, None) => None,
            (since, until) => {
                let since_dt = since.map(|d| {
                    DateTime::<Utc>::from_naive_utc_and_offset(
                        d.and_hms_opt(0, 0, 0).unwrap(),
                        Utc,
                    )
                });
                let until_dt = until.map(|d| {
                    DateTime::<Utc>::from_naive_utc_and_offset(
                        d.and_hms_opt(23, 59, 59).unwrap(),
                        Utc,
                    )
                });
                Some(DateTimeRange {
                    since: since_dt,
                    until: until_dt,
                })
            }
        };

        Ok(RankingOptions {
            id: req.id,
            main_text: req.main_text,
            name_and_trip: req.name_and_trip,
            oekaki: req.oekaki,
            date_range,
            ranking_type: req.ranking_type.into(),
            min_posts: req.min_posts,
        })
    }
}

#[derive(Debug, Serialize)]
pub struct RankingResponse {
    pub ranking: Vec<RankingItem>,
    pub total_unique_ids: i64,
    pub search_conditions: SearchConditions,
}

#[derive(Debug, Serialize)]
pub struct RankingItem {
    pub rank: i64,
    pub id: String,
    pub post_count: i64,
    pub latest_post_no: i32,
    pub latest_post_datetime: String,
    pub first_post_no: i32,
    pub first_post_datetime: String,
}

#[derive(Debug, Serialize)]
pub struct SearchConditions {
    pub id: Option<String>,
    pub main_text: Option<String>,
    pub name_and_trip: Option<String>,
    pub oekaki: Option<bool>,
    pub since: Option<String>,
    pub until: Option<String>,
}

impl From<RankingData> for RankingResponse {
    fn from(data: RankingData) -> Self {
        let ranking = data
            .ranking
            .into_iter()
            .map(|entry| RankingItem::from(entry))
            .collect();

        let search_conditions = SearchConditions {
            id: data.search_conditions.id,
            main_text: data.search_conditions.main_text,
            name_and_trip: data.search_conditions.name_and_trip,
            oekaki: data.search_conditions.oekaki,
            since: data.search_conditions.since,
            until: data.search_conditions.until,
        };

        RankingResponse {
            ranking,
            total_unique_ids: data.total_unique_ids,
            search_conditions,
        }
    }
}

impl From<RankingEntry> for RankingItem {
    fn from(entry: RankingEntry) -> Self {
        RankingItem {
            rank: entry.rank,
            id: entry.id,
            post_count: entry.post_count,
            latest_post_no: entry.latest_post_no,
            latest_post_datetime: entry.latest_post_datetime.to_rfc3339(),
            first_post_no: entry.first_post_no,
            first_post_datetime: entry.first_post_datetime.to_rfc3339(),
        }
    }
}