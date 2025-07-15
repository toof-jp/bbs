use std::collections::HashMap;

use anyhow::Result;
use chrono::NaiveDateTime;
use log::debug;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub main_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_and_trip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ascending: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub oekaki: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub since: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub until: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
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

#[derive(Debug, Serialize, Deserialize)]
pub struct CountResponse {
    pub total_res_count: i64,
    pub unique_id_count: i64,
}

pub struct SearchQuery {
    pub id: Option<String>,
    pub main_text: Option<String>,
    pub name_and_trip: Option<String>,
    pub oekaki: Option<bool>,
    pub since: Option<String>,
    pub until: Option<String>,
    pub ascending: Option<bool>,
    pub limit: Option<usize>,
    pub count: Option<bool>,
}

impl std::fmt::Display for SearchResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "### __{} {} {} ID: {}__\n{}\n",
            self.no, self.name_and_trip, self.datetime_text, self.id, self.main_text
        )
    }
}

pub fn parse_search_query(input: &str) -> SearchQuery {
    let mut query = SearchQuery {
        id: None,
        main_text: None,
        name_and_trip: None,
        oekaki: None,
        since: None,
        until: None,
        ascending: None,
        limit: None,
        count: None,
    };

    let mut remaining_text = Vec::new();
    let parts: Vec<&str> = input.split_whitespace().collect();
    let mut i = 0;

    while i < parts.len() {
        let part = parts[i];

        if let Some(colon_pos) = part.find(':') {
            let key = &part[..colon_pos];
            let value = &part[colon_pos + 1..];

            match key {
                "id" => {
                    query.id = Some(value.to_string());
                }
                "name_and_trip" => {
                    query.name_and_trip = Some(value.to_string());
                }
                "oekaki" => {
                    query.oekaki = value.parse::<bool>().ok();
                }
                "since" => {
                    query.since = Some(value.to_string());
                }
                "until" => {
                    query.until = Some(value.to_string());
                }
                "ascending" => {
                    query.ascending = value.parse::<bool>().ok();
                }
                "limit" => {
                    query.limit = value.parse::<usize>().ok();
                }
                "count" => {
                    query.count = value.parse::<bool>().ok();
                }
                _ => {
                    remaining_text.push(part);
                }
            }
        } else {
            remaining_text.push(part);
        }
        i += 1;
    }

    if !remaining_text.is_empty() {
        query.main_text = Some(remaining_text.join(" "));
    }

    debug!("Parsed search query: id={:?}, main_text={:?}, name_and_trip={:?}, oekaki={:?}, since={:?}, until={:?}, ascending={:?}, limit={:?}, count={:?}",
        query.id, query.main_text, query.name_and_trip, query.oekaki, query.since, query.until, query.ascending, query.limit, query.count);

    query
}

pub async fn search_posts(
    base_url: &str,
    query: SearchQuery,
    default_limit: usize,
) -> Result<Vec<SearchResponse>> {
    let client = reqwest::Client::new();
    let mut params = HashMap::new();

    if let Some(id) = query.id {
        params.insert("id", id);
    }
    if let Some(main_text) = query.main_text {
        params.insert("main_text", main_text);
    }
    if let Some(name_and_trip) = query.name_and_trip {
        params.insert("name_and_trip", name_and_trip);
    }
    if let Some(oekaki) = query.oekaki {
        params.insert("oekaki", oekaki.to_string());
    }
    if let Some(since) = query.since {
        params.insert("since", since);
    }
    if let Some(until) = query.until {
        params.insert("until", until);
    }
    if let Some(ascending) = query.ascending {
        params.insert("ascending", ascending.to_string());
    }

    let url = format!("{base_url}/api/v1/search");
    debug!("Searching with URL: {url} params: {params:?}");

    let response = client.get(&url).query(&params).send().await?;
    let mut results: Vec<SearchResponse> = response.json().await?;

    let limit = query.limit.unwrap_or(default_limit);
    results.truncate(limit);

    Ok(results)
}

pub async fn count_posts(base_url: &str, query: SearchQuery) -> Result<CountResponse> {
    let client = reqwest::Client::new();
    let mut params = HashMap::new();

    if let Some(id) = query.id {
        params.insert("id", id);
    }
    if let Some(main_text) = query.main_text {
        params.insert("main_text", main_text);
    }
    if let Some(name_and_trip) = query.name_and_trip {
        params.insert("name_and_trip", name_and_trip);
    }
    if let Some(oekaki) = query.oekaki {
        params.insert("oekaki", oekaki.to_string());
    }
    if let Some(since) = query.since {
        params.insert("since", since);
    }
    if let Some(until) = query.until {
        params.insert("until", until);
    }
    if let Some(ascending) = query.ascending {
        params.insert("ascending", ascending.to_string());
    }

    let url = format!("{base_url}/api/v1/search/count");
    debug!("Counting with URL: {url} params: {params:?}");

    let response = client.get(&url).query(&params).send().await?;
    let count: CountResponse = response.json().await?;

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_search_query_id() {
        let query = parse_search_query("id:abc123");
        assert_eq!(query.id, Some("abc123".to_string()));
        assert_eq!(query.main_text, None);
    }

    #[test]
    fn test_parse_search_query_with_text() {
        let query = parse_search_query("id:abc123 hello world");
        assert_eq!(query.id, Some("abc123".to_string()));
        assert_eq!(query.main_text, Some("hello world".to_string()));
    }

    #[test]
    fn test_parse_search_query_multiple_params() {
        let query = parse_search_query("id:abc123 name_and_trip:test oekaki:true hello");
        assert_eq!(query.id, Some("abc123".to_string()));
        assert_eq!(query.name_and_trip, Some("test".to_string()));
        assert_eq!(query.oekaki, Some(true));
        assert_eq!(query.main_text, Some("hello".to_string()));
    }

    #[test]
    fn test_parse_search_query_dates() {
        let query = parse_search_query("since:2024-01-01 until:2024-12-31");
        assert_eq!(query.since, Some("2024-01-01".to_string()));
        assert_eq!(query.until, Some("2024-12-31".to_string()));
    }

    #[test]
    fn test_parse_search_query_limit() {
        let query = parse_search_query("limit:10 test search");
        assert_eq!(query.limit, Some(10));
        assert_eq!(query.main_text, Some("test search".to_string()));
    }

    #[test]
    fn test_parse_search_query_only_text() {
        let query = parse_search_query("just some search text");
        assert_eq!(query.main_text, Some("just some search text".to_string()));
        assert_eq!(query.id, None);
        assert_eq!(query.limit, None);
    }

    #[test]
    fn test_parse_search_query_count() {
        let query = parse_search_query("count:true test search");
        assert_eq!(query.count, Some(true));
        assert_eq!(query.main_text, Some("test search".to_string()));

        let query = parse_search_query("count:false");
        assert_eq!(query.count, Some(false));
        assert_eq!(query.main_text, None);
    }
}
