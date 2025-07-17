import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form } from '../components/Form';
import { Header } from '../components/Header';
import { getRanking } from '../utils/Fetch';
import { RankingItem, FormData } from '../types';

export default function Ranking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [totalUniqueIds, setTotalUniqueIds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(() => ({
    id: searchParams.get("id") || "",
    main_text: searchParams.get("main_text") || "",
    name_and_trip: searchParams.get("name_and_trip") || "",
    ascending: false,
    since: searchParams.get("since") || "",
    until: searchParams.get("until") || "",
  }));
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async (params: Partial<FormData> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRanking({
        id: params.id || formData.id || undefined,
        main_text: params.main_text || formData.main_text || undefined,
        name_and_trip: params.name_and_trip || formData.name_and_trip || undefined,
        since: params.since || formData.since || undefined,
        until: params.until || formData.until || undefined,
      });
      setRanking(response.ranking);
      setTotalUniqueIds(response.total_unique_ids);
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
      setError('ランキングの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setSearchParams({
      id: data.id,
      main_text: data.main_text,
      name_and_trip: data.name_and_trip,
      since: data.since,
      until: data.until,
    });
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
    <div className="container mx-auto px-4 py-8">
      <Header />
      
      <div ref={formRef} className="mb-8">
        <h1 className="text-2xl font-bold mb-4">IDランキング</h1>
        <Form onSubmit={handleFormSubmit} defaultValues={formData} isSearching={loading} />
      </div>
      
      {totalUniqueIds > 0 && (
        <div className="mb-4 text-gray-700">
          <p>ユニークID数: {totalUniqueIds.toLocaleString()}</p>
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
                  最新投稿
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
                    {item.post_count.toLocaleString()}
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
  );
}