'use client';

import { useState, useRef, useEffect } from 'react';
import type { AIMessage } from '@/hooks/useAIInterview';
import { AIMessageBubble } from './AIMessageBubble';
import type { AICanvasHandle } from './AICanvas';


interface Props {
  messages: AIMessage[];
  phase: string;
  isSending: boolean;
  isSubmitting: boolean;
  isConcluding: boolean;
  lastBadge: string | null;
  error: string | null;
  canvasRef: React.RefObject<AICanvasHandle | null>;
  onSend: (content: string) => void;
  onSubmitDiagram: (
    nodes: { id: string; label: string }[],
    edges: { source: string; target: string }[],
  ) => void;
  onConclude: () => void;
}

export function AIChatPanel({
  messages,
  phase,
  isSending,
  isSubmitting,
  isConcluding,
  lastBadge,
  error,
  canvasRef,
  onSend,
  onSubmitDiagram,
  onConclude,
}: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    setDraft('');
    onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSubmitDiagram() {
    if (isSubmitting) return;
    const snapshot = canvasRef.current?.getSnapshot() ?? { nodes: [], edges: [] };
    onSubmitDiagram(snapshot.nodes, snapshot.edges);
  }

  const isConclusion = phase === 'CONCLUSION';
  const busy = isSending || isSubmitting;
  const anythingBusy = busy || isConcluding;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        borderLeft: '1.5px solid #c9b99a',
        backgroundColor: '#f5f0e8',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-4 py-2 shrink-0"
        style={{ borderBottom: '1.5px solid #c9b99a' }}
      >
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#888]">
          AI INTERVIEWER
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {messages.map((m) => (
          <AIMessageBubble key={m.id} message={m} />
        ))}

        {/* Diff badge */}
        {lastBadge && (
          <div className="flex justify-center my-2">
            <span
              className="text-[9px] font-mono tracking-widest px-2 py-0.5"
              style={{
                color: '#166534',
                border: '1px solid #166534',
                backgroundColor: '#f0fdf4',
                borderRadius: '2px',
              }}
            >
              ✓ {lastBadge}
            </span>
          </div>
        )}

        {/* Sending indicator */}
        {isSending && (
          <div className="flex justify-start mb-2">
            <span
              className="text-[10px] font-mono text-[#888] animate-pulse px-3 py-2"
              style={{
                border: '1.5px solid #c9b99a',
                backgroundColor: '#faf7f2',
                borderRadius: '2px',
              }}
            >
              ···
            </span>
          </div>
        )}

        {/* Concluding indicator — shown separately so it doesn't look like an AI reply */}
        {isConcluding && (
          <div className="flex justify-center my-2">
            <span
              className="text-[9px] font-mono tracking-widest animate-pulse px-2 py-0.5"
              style={{
                color: '#888',
                border: '1px solid #c9b99a',
                backgroundColor: '#faf7f2',
                borderRadius: '2px',
              }}
            >
              evaluating session…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-1">
          <p className="text-[9px] font-mono text-red-500">
            {error.toLowerCase().includes('fetch') || error.toLowerCase().includes('http') || error.toLowerCase().includes('https')
              ? 'Something went wrong — please try again.'
              : error}
          </p>
        </div>
      )}

      {/* Bottom controls */}
      <div className="shrink-0" style={{ borderTop: '1.5px solid #c9b99a' }}>
        {/* Submit Design button */}
        {!isConclusion && (
          <div className="px-3 pt-2">
            <button
              onClick={handleSubmitDiagram}
              disabled={anythingBusy}
              className="w-full text-[9px] font-mono font-bold tracking-widest py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: '1.5px solid #b45309',
                color: '#b45309',
                backgroundColor: 'transparent',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                if (!busy) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b45309';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#b45309';
              }}
            >
              {isSubmitting ? 'submitting…' : 'SUBMIT DESIGN'}
            </button>
          </div>
        )}

        {/* Text input + Send */}
        <div className="px-3 pt-2 pb-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={anythingBusy || isConclusion}
            placeholder={isConclusion ? 'Interview complete.' : 'Type your answer… (Enter to send)'}
            rows={3}
            className="w-full resize-none text-[11px] font-mono text-[#1a1a1a] placeholder-[#aaa] bg-[#faf7f2] outline-none px-2 py-2 disabled:opacity-40"
            style={{
              border: '1.5px solid #c9b99a',
              borderRadius: '2px',
              lineHeight: '1.5',
            }}
          />
          <div className="flex items-center justify-between mt-1.5">
            {!isConclusion && (
              <button
                onClick={onConclude}
                disabled={anythingBusy}
                className="text-[9px] font-mono tracking-widest text-[#666] hover:text-[#1a1a1a] disabled:opacity-40 transition-colors"
                style={{ border: '1px solid #c9b99a', padding: '2px 8px', borderRadius: '2px' }}
              >
                end session
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={anythingBusy || !draft.trim() || isConclusion}
              className="ml-auto text-[9px] font-mono font-bold tracking-widest px-4 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: '1.5px solid #1a1a1a',
                backgroundColor: '#1a1a1a',
                color: '#faf7f2',
                borderRadius: '2px',
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
