import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RankingForm, RankingFormData } from '../components/RankingForm';
import { Header } from '../components/Header';
import { getRanking } from '../utils/Fetch';
import { RankingItem } from '../types';

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
      console.error('Failed to fetch ranking:', error);
      setError('ランキングの取得に失敗しました');
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
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            IDランキング
          </h1>
          
          <div ref={formRef} className="mb-8">
            <RankingForm onSubmit={handleFormSubmit} defaultValues={formData} isSearching={loading} />
          </div>
          
          {(totalUniqueIds > 0 || totalResCount > 0) && (
            <div className="mb-4 text-gray-700">
              <p>検索結果: {totalResCount?.toLocaleString() || '0'}件 (書き込みID数: {totalUniqueIds?.toLocaleString() || '0'}件)</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">読み込み中...</p>
            </div>
          ) : ranking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 shadow-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      順位
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      投稿数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      最後の投稿
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      最初の投稿
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ranking.map((item) => (
                    <tr key={item.rank} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleIdClick(item.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          {item.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.post_count?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">No.{item.latest_post_no}</div>
                          <div className="text-gray-500 text-xs">
                            {formatDateTime(item.latest_post_datetime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">No.{item.first_post_no}</div>
                          <div className="text-gray-500 text-xs">
                            {formatDateTime(item.first_post_datetime)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && (
            <div className="text-center py-8 text-gray-500">
              ランキングデータがありません
            </div>
          )}
        </div>
      </div>
    </>
  );
}
