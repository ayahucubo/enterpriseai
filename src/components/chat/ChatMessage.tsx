'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/api/chat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const content = (
    <div className="overflow-x-auto">
      <div className="prose prose-sm prose-gray dark:prose-invert max-w-none chat-message">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );

  if (message.role === 'ai') {
    return (
      <div className="w-full bg-white dark:bg-gray-900">
        <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed p-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f6fe] dark:bg-gray-800 p-4 rounded-2xl max-w-[70%]">
      <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
        {content}
      </div>
    </div>
  );
}
