import { CountJson } from "../types";

export function Count({ count }: { count: CountJson | null }) {
  if (!count) {
    return null;
  }

  return (
    <div className="text-gray-800 prose prose-sm max-w-none prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline">
      検索結果: {count.total_res_count?.toLocaleString() || '0'}件 (書き込みID数:{" "}
      {count.unique_id_count?.toLocaleString() || '0'}件)
    </div>
  );
}
