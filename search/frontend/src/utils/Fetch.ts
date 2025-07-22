import { FormData, RankingParams, RankingResponse } from "../types";

export const BASE_URL = import.meta.env.VITE_BASE_URL;
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || `${BASE_URL}/images`;

export function getImageUrl(oekakiId: number): string {
  return `${IMAGE_BASE_URL}/${oekakiId}.png`;
}

export async function fetchData(
  endpoint: string,
  formData: FormData,
  cursor: number,
  oekaki: boolean = false,
) {
  const params = {
    id: formData.id,
    main_text: formData.main_text,
    name_and_trip: formData.name_and_trip,
    cursor: cursor.toString(),
    ascending: formData.ascending.toString(),
    since: formData.since,
    until: formData.until,
    oekaki: oekaki.toString(),
  };
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/v1/${endpoint}?${queryString}`;
  const response = await fetch(url, {
    method: "GET",
  });
  return await response.json();
}

export async function getRanking(params: RankingParams = {}): Promise<RankingResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.id) queryParams.append('id', params.id);
  if (params.main_text) queryParams.append('main_text', params.main_text);
  if (params.name_and_trip) queryParams.append('name_and_trip', params.name_and_trip);
  if (params.oekaki !== undefined) queryParams.append('oekaki', params.oekaki.toString());
  if (params.since) queryParams.append('since', params.since);
  if (params.until) queryParams.append('until', params.until);
  if (params.ranking_type) queryParams.append('ranking_type', params.ranking_type);
  if (params.min_posts !== undefined) queryParams.append('min_posts', params.min_posts.toString());
  
  const response = await fetch(`${BASE_URL}/api/v1/ranking?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ranking: ${response.statusText}`);
  }
  
  return response.json();
}
