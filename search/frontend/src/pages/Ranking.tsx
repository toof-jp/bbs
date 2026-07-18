import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RankingForm, type RankingFormData } from "../components/RankingForm";
import { Header } from "../components/Header";
import { getRanking } from "../utils/Fetch";
import type { RankingItem } from "../types";

export default function Ranking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [totalUniqueIds, setTotalUniqueIds] = useState(0);
  const [totalResCount, setTotalResCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RankingFormData>(() => ({
    id: searchParams.get("id") || "",
    main_text: searchParams.get("main_text") || "",
    name_and_trip: searchParams.get("name_and_trip") || "",
    since: searchParams.get("since") || "",
    until: searchParams.get("until") || "",
  }));
  const formRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial ranking is loaded once on page entry.
  useEffect(() => {
    fetchRanking(formData);
  }, []);

  const fetchRanking = async (params: Partial<RankingFormData> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRanking({
        id: params.id || undefined,
        main_text: params.main_text || undefined,
        name_and_trip: params.name_and_trip || undefined,
        since: params.since || undefined,
        until: params.until || undefined,
      });
      setRanking(response.ranking || []);
      setTotalUniqueIds(response.total_unique_ids || 0);
      setTotalResCount(response.total_res_count || 0);
    } catch (error) {
      console.error("Failed to fetch ranking:", error);
      setError("ランキングの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: RankingFormData) => {
    setFormData(data);
    // 空文字列の値を除外してURLパラメータを設定
    const params: Record<string, string> = {};
    if (data.id) params.id = data.id;
    if (data.main_text) params.main_text = data.main_text;
    if (data.name_and_trip) params.name_and_trip = data.name_and_trip;
    if (data.since) params.since = data.since;
    if (data.until) params.until = data.until;
    setSearchParams(params);
    await fetchRanking(data);
  };

  const handleIdClick = (id: string) => {
    // IDをクリックしたら検索ページに遷移
    window.location.href = `/?id=${encodeURIComponent(id)}`;
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      // Backend timestamps are serialized as if they were UTC, so format
      // them in UTC to avoid the browser adding the local offset (JST+9h).
      return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="page-title">IDランキング</h1>

          <div ref={formRef} className="mb-8">
            <RankingForm
              onSubmit={handleFormSubmit}
              defaultValues={formData}
              isSearching={loading}
            />
          </div>

          {(totalUniqueIds > 0 || totalResCount > 0) && (
            <div className="mb-4 text-sm text-label-secondary">
              <p>
                検索結果:{" "}
                <span className="font-semibold text-label">
                  {totalResCount?.toLocaleString() || "0"}
                </span>
                件 (書き込みID数:{" "}
                <span className="font-semibold text-label">
                  {totalUniqueIds?.toLocaleString() || "0"}
                </span>
                件)
              </p>
            </div>
          )}

          {error && <div className="banner-error mb-4">{error}</div>}

          {loading ? (
            <div className="py-8 text-center text-label-secondary">
              <div className="spinner inline-block h-8 w-8" />
              <p className="mt-2">読み込み中...</p>
            </div>
          ) : ranking.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-label-secondary">
                      順位
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-label-secondary">
                      ID
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-medium text-label-secondary">
                      投稿数
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-label-secondary">
                      最後の投稿
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-medium text-label-secondary">
                      最初の投稿
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {ranking.map((item) => (
                    <tr
                      key={item.rank}
                      className="transition-colors hover:bg-fill"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.rank <= 3 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                            {item.rank}
                          </span>
                        ) : (
                          <span className="text-label">{item.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleIdClick(item.id)}
                          className="text-link font-mono text-sm font-medium"
                        >
                          {item.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums text-label">
                        {item.post_count?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-label">
                            No.{item.latest_post_no}
                          </div>
                          <div className="text-xs text-label-tertiary">
                            {formatDateTime(item.latest_post_datetime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-label">
                            No.{item.first_post_no}
                          </div>
                          <div className="text-xs text-label-tertiary">
                            {formatDateTime(item.first_post_datetime)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && (
              <div className="py-8 text-center text-label-tertiary">
                ランキングデータがありません
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
