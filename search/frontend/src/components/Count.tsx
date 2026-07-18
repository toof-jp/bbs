import type { CountJson } from "../types";

export function Count({ count }: { count: CountJson | null }) {
  if (!count) {
    return null;
  }

  return (
    <div className="mb-2 text-sm text-label-secondary">
      検索結果:{" "}
      <span className="font-semibold text-label">
        {count.total_res_count?.toLocaleString() || "0"}
      </span>
      件 (書き込みID数:{" "}
      <span className="font-semibold text-label">
        {count.unique_id_count?.toLocaleString() || "0"}
      </span>
      件)
    </div>
  );
}
