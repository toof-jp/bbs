use chrono::NaiveDate;
use kernel::model::search::SearchOptions;
use serde::{Deserialize, Deserializer};

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub main_text: String,
    #[serde(default)]
    pub name_and_trip: String,
    pub cursor: Option<i32>,
    #[serde(default)]
    pub ascending: bool,
    #[serde(default)]
    pub oekaki: bool,
    #[serde(default, deserialize_with = "deserialize_date")]
    pub since: Option<NaiveDate>,
    #[serde(default, deserialize_with = "deserialize_date")]
    pub until: Option<NaiveDate>,
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

impl From<SearchRequest> for SearchOptions {
    fn from(params: SearchRequest) -> Self {
        let cursor =
            params
                .cursor
                .unwrap_or(if params.ascending { i32::MIN } else { i32::MAX });

        let since = params
            .since
            .unwrap_or_else(|| NaiveDate::from_ymd_opt(-4712, 1, 1).unwrap());
        let until = params.until.unwrap_or(NaiveDate::MAX);

        SearchOptions {
            id: params.id,
            main_text: params.main_text,
            name_and_trip: params.name_and_trip,
            cursor,
            ascending: params.ascending,
            oekaki: params.oekaki,
            since: since.and_hms_opt(0, 0, 0).unwrap(),
            until: until.and_hms_opt(23, 59, 59).unwrap(),
        }
    }
}
