'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ReactFlowProvider } from '@xyflow/react';
import { useAIInterview } from '@/hooks/useAIInterview';
import { AIChatPanel } from '@/components/ai-interview/AIChatPanel';
import { PhaseIndicator } from '@/components/ai-interview/PhaseIndicator';
import { AIFeedbackCard, type RubricScores } from '@/components/ai-interview/AIFeedbackCard';
import type { AICanvasHandle } from '@/components/ai-interview/AICanvas';
import { AICanvas } from '@/components/ai-interview/AICanvas';

export default function AIInterviewSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const canvasRef = useRef<AICanvasHandle | null>(null);

  const {
    session,
    messages,
    phase,
    isLoading,
    isSending,
    isSubmitting,
    isConcluding,
    lastBadge,
    error,
    loadSession,
    sendMessage,
    submitDiagram,
    concludeSession,
  } = useAIInterview(params.sessionId);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading || !session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        {isLoading ? (
          <p className="text-[#1a1a1a]/30 text-xs font-mono tracking-widest animate-pulse">
            loading interview…
          </p>
        ) : (
          <p className="text-[#cc0000] text-xs font-mono tracking-widest">
            {error ?? 'Failed to load session.'}
          </p>
        )}
        <Link
          href="/dashboard"
          className="text-[9px] font-mono tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70 transition px-2 py-0.5"
          style={{ border: '1px solid #c9b99a' }}
        >
          EXIT
        </Link>
      </div>
    );
  }

  const isConclusion = phase === 'CONCLUSION';
  const rubricScores = session.rubricScores as RubricScores | null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-2 shrink-0"
        style={{ borderBottom: '1.5px solid #b00', backgroundColor: 'transparent' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#888] shrink-0">
            {session.category.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-[#1a1a1a] truncate">
            {session.question}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <PhaseIndicator phase={phase} />
          <Link
            href="/dashboard"
            className="text-[9px] font-mono tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70 transition px-2 py-0.5"
            style={{ border: '1px solid #c9b99a' }}
          >
            EXIT
          </Link>
        </div>
      </div>

      {/* 60/40 split */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Canvas (60%) or Feedback (on CONCLUSION) */}
        <div className="relative flex-[3] min-w-0">
          {isConclusion && rubricScores ? (
            <AIFeedbackCard scores={rubricScores} />
          ) : (
            <ReactFlowProvider>
              <AICanvas ref={canvasRef} />
            </ReactFlowProvider>
          )}
        </div>

        {/* Right — Chat panel (40%) */}
        <div className="flex-[2] min-w-0 min-h-0">
          <AIChatPanel
            messages={messages}
            phase={phase}
            isSending={isSending}
            isSubmitting={isSubmitting}
            isConcluding={isConcluding}
            lastBadge={lastBadge}
            error={error}
            canvasRef={canvasRef}
            onSend={sendMessage}
            onSubmitDiagram={submitDiagram}
            onConclude={concludeSession}
          />
        </div>
      </div>
    </div>
  );
}
