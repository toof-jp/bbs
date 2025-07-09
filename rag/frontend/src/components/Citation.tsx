import React from 'react';

interface CitationData {
  source_post_no: number;
  author: string;
  timestamp: string;
  content_excerpt: string;
}

interface CitationProps {
  citation: CitationData;
}

export const Citation: React.FC<CitationProps> = ({ citation }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="border border-gray-300 rounded-lg p-3 mb-2 bg-gray-50">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-semibold text-blue-600">No.{citation.source_post_no}</div>
        <div className="text-xs text-gray-500">{formatTimestamp(citation.timestamp)}</div>
      </div>
      <div className="text-sm text-gray-600 mb-2">名前：{citation.author}</div>
      <div className="text-sm text-gray-700">{citation.content_excerpt}</div>
    </div>
  );
};

interface CitationsProps {
  citations: CitationData[];
}

export const Citations: React.FC<CitationsProps> = ({ citations }) => {
  if (citations.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">参照した投稿</h3>
      <div className="max-h-60 overflow-y-auto">
        {citations.map((citation, index) => (
          <Citation key={index} citation={citation} />
        ))}
      </div>
    </div>
  );
};