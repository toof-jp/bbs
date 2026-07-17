import type { CountJson } from "../types";

export function Count({ count }: { count: CountJson | null }) {
  if (!count) {
    return null;
  }

  return (
    <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
      検索結果:{" "}
      <span className="font-semibold text-gray-900 dark:text-gray-50">
        {count.total_res_count?.toLocaleString() || "0"}
      </span>
      件 (書き込みID数:{" "}
      <span className="font-semibold text-gray-900 dark:text-gray-50">
        {count.unique_id_count?.toLocaleString() || "0"}
      </span>
      件)
    </div>
  );
}
