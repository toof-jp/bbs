import { FormData } from "../types";

export const BASE_URL = import.meta.env.VITE_BASE_URL;

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
