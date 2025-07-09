use chrono::NaiveDateTime;
use serde::Serialize;

#[derive(Debug)]
pub struct SearchOptions {
    pub id: String,
    pub main_text: String,
    pub name_and_trip: String,
    pub cursor: i32,
    pub ascending: bool,
    pub oekaki: bool,
    pub since: NaiveDateTime,
    pub until: NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct Res {
    pub no: i32,
    pub name_and_trip: String,
    pub datetime: NaiveDateTime,
    pub datetime_text: String,
    pub id: String,
    pub main_text: String,
    pub main_text_html: String,
    pub oekaki_id: Option<i32>,
    pub oekaki_title: Option<String>,
    pub original_oekaki_res_no: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct Count {
    pub total_res_count: i64,
    pub unique_id_count: i64,
}
