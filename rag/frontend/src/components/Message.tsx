import React from 'react';
import { Citations } from './Citation';

interface Citation {
  source_post_no: number;
  author: string;
  timestamp: string;
  content_excerpt: string;
}

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export const Message: React.FC<MessageProps> = ({ role, content, citations }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%]`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          <div className="text-sm font-semibold mb-1">
            {isUser ? 'あなた' : 'アシスタント'}
          </div>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {!isUser && citations && <Citations citations={citations} />}
      </div>
    </div>
  );
};