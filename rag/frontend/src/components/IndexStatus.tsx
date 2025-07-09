import React, { useEffect, useState } from 'react';

interface IndexStatusData {
  status: string;
  index: {
    total_posts: number;
    min_post_no: number;
    max_post_no: number;
    last_sync: string | null;
  };
}

export const IndexStatus: React.FC = () => {
  const [status, setStatus] = useState<IndexStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/v1/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        インデックス状態を読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        エラー: {error}
      </div>
    );
  }

  if (!status || status.index.total_posts === 0) {
    return (
      <div className="text-sm text-gray-500">
        インデックスが構築されていません
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '不明';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
      <div className="font-semibold text-blue-800 mb-1">インデックス状態</div>
      <div className="text-blue-700">
        <div>
          インデックス済み: No.{status.index.min_post_no} - No.{status.index.max_post_no}
          （{status.index.total_posts.toLocaleString()}件）
        </div>
        <div className="text-xs mt-1">
          最終更新: {formatDate(status.index.last_sync)}
        </div>
      </div>
    </div>
  );
};