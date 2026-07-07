'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactFlowProvider } from '@xyflow/react';
import { useQuery } from '@tanstack/react-query';
import { NodePalette } from '@/components/canvas/NodePalette';
import { EvaluationPanel } from '@/components/canvas/EvaluationPanel';
import { useCanvas } from '@/hooks/useCanvas';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useComplete } from '@/hooks/useComplete';
import { apiClient } from '@/lib/apiClient';
import type { Prompt } from '@sds/shared-types';

const InterviewCanvas = dynamic(
  () => import('@/components/canvas/InterviewCanvas').then((m) => m.InterviewCanvas),
  { ssr: false, loading: () => <div className="flex-1" /> },
);

const DIFF_COLOR: Record<string, string> = {
  EASY: '#166534',
  MEDIUM: '#b45309',
  HARD: '#991b1b',
};

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  const { isLoading, prompt: sessionPrompt, isSaving, isDirty, cancelAutosave } = useCanvas(params.sessionId);
  const { result, isEvaluating, error, evaluate } = useEvaluation(params.sessionId, cancelAutosave);
  const { submit, isCompleting, error: completeError } = useComplete(params.sessionId);

  const { data: fullPrompt } = useQuery({
    queryKey: ['prompt', sessionPrompt?.id],
    queryFn: () => apiClient.get<Prompt>(`/prompts/${sessionPrompt!.id}`),
    enabled: !!sessionPrompt?.id,
  });

  if (isLoading || !sessionPrompt) {
    return (
      <div className="flex h-full items-center justify-center text-[#1a1a1a]/30 text-xs font-mono tracking-widest animate-pulse">
        loading session…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-2 shrink-0"
        style={{ borderBottom: '1.5px solid #b00', backgroundColor: 'transparent' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#1a1a1a] text-sm font-mono font-bold truncate">{sessionPrompt.title}</span>
          <span
            className="text-[9px] font-mono tracking-widest px-1.5 py-0.5"
            style={{
              color: DIFF_COLOR[sessionPrompt.difficulty] ?? '#555',
              border: `1px solid ${DIFF_COLOR[sessionPrompt.difficulty] ?? '#555'}`,
            }}
          >
            {sessionPrompt.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[9px] font-mono tracking-widest text-[#1a1a1a]/30">
            {isSaving ? 'saving…' : isDirty ? 'unsaved' : 'saved'}
          </span>
          {completeError && (
            <span className="text-[9px] font-mono text-red-500">{completeError}</span>
          )}
          <button
            onClick={submit}
            disabled={isCompleting}
            className="text-[9px] font-mono tracking-widest px-3 py-0.5 transition"
            style={{
              border: '1px solid #1a1a1a',
              backgroundColor: isCompleting ? '#e5e7eb' : '#1a1a1a',
              color: isCompleting ? '#888' : '#faf7f2',
              cursor: isCompleting ? 'not-allowed' : 'pointer',
            }}
          >
            {isCompleting ? 'submitting…' : 'SUBMIT'}
          </button>
          <Link
            href="/dashboard"
            className="text-[9px] font-mono tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70 transition px-2 py-0.5"
            style={{ border: '1px solid #c9b99a' }}
          >
            EXIT
          </Link>
        </div>
      </div>

      {/* Canvas area */}
      <ReactFlowProvider>
        <div className="relative flex-1 overflow-hidden">
          <NodePalette />
          <EvaluationPanel
            result={result}
            isEvaluating={isEvaluating}
            error={error}
            onEvaluate={evaluate}
            prompt={fullPrompt}
          />
          <InterviewCanvas />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
