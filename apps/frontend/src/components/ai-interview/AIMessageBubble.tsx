'use client';

import type { AIMessage } from '@/hooks/useAIInterview';

interface Props {
  message: AIMessage;
}

export function AIMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: 11,
          lineHeight: '1.6',
          letterSpacing: '0.02em',
          borderRadius: '2px',
          ...(isUser
            ? {
                backgroundColor: '#1a1a1a',
                color: '#faf7f2',
                border: '1.5px solid #1a1a1a',
              }
            : {
                backgroundColor: '#faf7f2',
                color: '#1a1a1a',
                border: '1.5px solid #c9b99a',
              }),
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
