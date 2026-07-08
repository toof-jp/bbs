const BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:3000";
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL ?? `${BASE_URL}/images`;

export type QueryParams = Record<string, string | number | boolean | undefined>;

export async function apiGet<T>(path: string, params: QueryParams): Promise<T> {
  const url = new URL(`/api/v1${path}`, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`search-backend returned ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function fetchOekakiImage(
  oekakiId: number,
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(`${IMAGE_BASE_URL}/${oekakiId}.png`);
  if (!res.ok) {
    throw new Error(
      `image server returned ${res.status} for oekaki_id=${oekakiId}`,
    );
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    data: buffer.toString("base64"),
    mimeType: res.headers.get("content-type") ?? "image/png",
  };
}

export interface Res {
  no: number;
  name_and_trip: string;
  datetime: string;
  datetime_text: string;
  id: string;
  main_text: string;
  main_text_html: string;
  oekaki_id: number | null;
  oekaki_title: string | null;
  original_oekaki_res_no: number | null;
}

export interface Count {
  total_res_count: number;
  unique_id_count: number;
}

export interface RankingResponse {
  ranking: RankingItem[];
  total_unique_ids: number;
  total_res_count: number;
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
