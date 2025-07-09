use chrono::NaiveDateTime;
use kernel::model::search::{Count, Res};

#[derive(sqlx::FromRow)]
pub struct ResRow {
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

impl ResRow {
    pub fn into_res(self) -> Res {
        let ResRow {
            no,
            name_and_trip,
            datetime,
            datetime_text,
            id,
            main_text,
            main_text_html,
            oekaki_id,
            oekaki_title,
            original_oekaki_res_no,
        } = self;
        Res {
            no,
            name_and_trip,
            datetime,
            datetime_text,
            id,
            main_text,
            main_text_html,
            oekaki_id,
            oekaki_title,
            original_oekaki_res_no,
        }
    }
}

#[derive(sqlx::FromRow)]
pub struct CountRow {
    pub total_res_count: i64,
    pub unique_id_count: i64,
}

impl CountRow {
    pub fn into_count(self) -> Count {
        Count {
            total_res_count: self.total_res_count,
            unique_id_count: self.unique_id_count,
        }
    }
}
