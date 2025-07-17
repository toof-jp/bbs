export interface ResJson {
  no: number;
  name_and_trip: string;
  datetime: Date;
  datetime_text: string;
  id: string;
  main_text: string;
  main_text_html: string;
  oekaki_id: number;
  oekaki_title: string;
  original_oekaki_res_no: number;
}

export interface CountJson {
  total_res_count: number;
  unique_id_count: number;
}

export interface FormData {
  id: string;
  main_text: string;
  name_and_trip: string;
  ascending: boolean;
  since: string;
  until: string;
}

export interface RankingItem {
  rank: number;
  id: string;
  post_count: number;
  latest_post_no: number;
  latest_post_datetime: string;
  first_post_no: number;
  first_post_datetime: string;
}

export interface RankingResponse {
  ranking: RankingItem[];
  total_unique_ids: number;
  total_res_count: number;
  search_conditions: {
    id?: string;
    main_text?: string;
    name_and_trip?: string;
    oekaki?: boolean;
    since?: string;
    until?: string;
  };
}

export interface RankingParams {
  id?: string;
  main_text?: string;
  name_and_trip?: string;
  oekaki?: boolean;
  since?: string;
  until?: string;
  ranking_type?: 'post_count' | 'recent_activity';
  min_posts?: number;
}
