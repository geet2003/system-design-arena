'use client';

import Link from 'next/link';
import { PromptDifficulty, SessionStatus } from '@sds/shared-types';
import { useProblemDetail } from '@/hooks/useProblemDetail';

const DIFF_STYLE: Record<PromptDifficulty, string> = {
  [PromptDifficulty.EASY]:   'text-[#4ade80]',
  [PromptDifficulty.MEDIUM]: 'text-[#fb923c]',
  [PromptDifficulty.HARD]:   'text-[#f87171]',
};

export default function ProblemDetailPage({ params }: { params: { promptId: string } }) {
  const {
    prompt,
    isLoading,
    activeSession,
    completedSession,
    start,
    isStarting,
    startError,
  } = useProblemDetail(params.promptId);

  if (isLoading || !prompt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-xs font-mono tracking-widest text-[#aaa] animate-pulse">loading…</p>
      </div>
    );
  }

  const score = completedSession?.evaluations[0]?.score;

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-block mb-6 text-xs font-mono text-[#888] hover:text-[#1a1a1a] transition"
      >
        ← back to problems
      </Link>

      {/* Header */}
      <div
        className="px-6 py-5 mb-6"
        style={{
          backgroundColor: '#faf7f2',
          border: '1.5px solid #c9bfa8',
          borderRadius: '2px',
          boxShadow: '2px 2px 0 #d4c9b0',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold font-mono text-[#1a1a1a] leading-tight">
            {prompt.title}
          </h1>
          <span className={`text-[10px] font-bold font-mono tracking-widest mt-1 shrink-0 ${DIFF_STYLE[prompt.difficulty]}`}>
            {prompt.difficulty}
          </span>
        </div>

        {completedSession && score !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[#4ade80] text-sm">●</span>
            <span className="text-xs font-mono text-[#888]">
              last score: <span className="font-bold text-[#1a1a1a]">{Math.round(score)} pts</span>
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div
        className="px-6 py-5 mb-6"
        style={{
          backgroundColor: '#faf7f2',
          border: '1.5px solid #c9bfa8',
          borderRadius: '2px',
          boxShadow: '2px 2px 0 #d4c9b0',
        }}
      >
        <h2 className="text-[9px] font-bold font-mono tracking-widest text-[#888] mb-3">PROBLEM</h2>
        <p className="text-sm font-mono text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
          {prompt.description}
        </p>
      </div>

      {/* Expected concepts */}
      {prompt.expectedPatterns.length > 0 && (
        <div
          className="px-6 py-5 mb-6"
          style={{
            backgroundColor: '#faf7f2',
            border: '1.5px solid #c9bfa8',
            borderRadius: '2px',
            boxShadow: '2px 2px 0 #d4c9b0',
          }}
        >
          <h2 className="text-[9px] font-bold font-mono tracking-widest text-[#888] mb-3">
            CONCEPTS TO COVER
          </h2>
          <ul className="space-y-1">
            {prompt.expectedPatterns.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm font-mono text-[#1a1a1a]">
                <span className="text-[#c9bfa8]">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col gap-3">
        {startError && (
          <p className="text-xs font-mono text-red-500 px-1">{startError}</p>
        )}

        {activeSession ? (
          <Link
            href={`/interview/${activeSession.id}`}
            className="w-full rounded-none py-3.5 font-bold font-mono text-sm text-center bg-yellow-400 text-black hover:bg-yellow-300 transition"
            style={{ border: '1.5px solid #1a1a1a', boxShadow: '2px 2px 0 #1a1a1a' }}
          >
            RESUME SESSION →
          </Link>
        ) : (
          <button
            onClick={() => start()}
            disabled={isStarting}
            className="w-full rounded-none py-3.5 font-bold font-mono text-sm bg-yellow-400 text-black hover:bg-yellow-300 transition disabled:opacity-60"
            style={{ border: '1.5px solid #1a1a1a', boxShadow: '2px 2px 0 #1a1a1a' }}
          >
            {isStarting ? 'starting…' : 'START PRACTICE →'}
          </button>
        )}

        {completedSession && (
          <button
            onClick={() => start()}
            disabled={isStarting}
            className="w-full rounded-none py-3 font-mono text-xs text-[#888] hover:text-[#1a1a1a] transition disabled:opacity-60 text-center"
            style={{ border: '1px dashed #c9bfa8' }}
          >
            restart from scratch
          </button>
        )}
      </div>
    </div>
  );
}
