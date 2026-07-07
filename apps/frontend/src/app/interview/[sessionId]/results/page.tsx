'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { EvaluationWarning, EvaluationStrength } from '@sds/shared-types';

interface SessionResult {
  id: string;
  status: string;
  prompt: {
    id: string;
    title: string;
    difficulty: string;
  };
  evaluations: {
    id: string;
    score: number;
    warnings: EvaluationWarning[];
    strengths: EvaluationStrength[];
    generatedAt: string;
  }[];
}

const DIFF_COLOR: Record<string, string> = {
  EASY: '#166534',
  MEDIUM: '#b45309',
  HARD: '#991b1b',
};

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: '#991b1b',
  MEDIUM: '#b45309',
  LOW: '#555',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#166534';
  if (score >= 40) return '#b45309';
  return '#991b1b';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs work';
  return 'Keep practising';
}

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', params.sessionId],
    queryFn: () => apiClient.get<SessionResult>(`/sessions/${params.sessionId}`),
  });

  if (isLoading || !session) {
    return (
      <div className="flex h-full items-center justify-center text-[#1a1a1a]/30 text-xs font-mono tracking-widest animate-pulse">
        loading results…
      </div>
    );
  }

  const evaluation = session.evaluations[0] ?? null;
  const score = evaluation?.score ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Score card */}
      <div
        className="px-8 py-8 mb-6 text-center"
        style={{
          backgroundColor: '#faf7f2',
          border: '1.5px solid #c9bfa8',
          borderRadius: '2px',
          boxShadow: '3px 3px 0 #d4c9b0',
        }}
      >
        <div className="text-[9px] font-mono tracking-widest uppercase text-[#888] mb-2">
          {session.prompt.title}
          <span
            className="ml-2 px-1.5 py-0.5"
            style={{
              color: DIFF_COLOR[session.prompt.difficulty] ?? '#555',
              border: `1px solid ${DIFF_COLOR[session.prompt.difficulty] ?? '#555'}`,
            }}
          >
            {session.prompt.difficulty}
          </span>
        </div>

        <div
          className="text-7xl font-mono font-bold mt-4 mb-1"
          style={{ color: scoreColor(score) }}
        >
          {Math.round(score)}
        </div>
        <div className="text-xs font-mono text-[#888] tracking-widest">
          {scoreLabel(score)}
        </div>
      </div>

      {evaluation ? (
        <>
          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div
              className="px-6 py-5 mb-4"
              style={{
                backgroundColor: '#faf7f2',
                border: '1.5px solid #c9bfa8',
                borderRadius: '2px',
                boxShadow: '2px 2px 0 #d4c9b0',
              }}
            >
              <h2 className="text-[9px] font-bold font-mono tracking-widest text-[#166534] mb-3 uppercase">
                Strengths
              </h2>
              <ul className="space-y-1.5">
                {evaluation.strengths.map((s) => (
                  <li key={s.code} className="flex items-start gap-2 text-sm font-mono text-[#1a1a1a]">
                    <span className="text-[#166534] mt-0.5 shrink-0">✓</span>
                    {s.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {evaluation.warnings.length > 0 && (
            <div
              className="px-6 py-5 mb-4"
              style={{
                backgroundColor: '#faf7f2',
                border: '1.5px solid #c9bfa8',
                borderRadius: '2px',
                boxShadow: '2px 2px 0 #d4c9b0',
              }}
            >
              <h2 className="text-[9px] font-bold font-mono tracking-widest text-[#991b1b] mb-3 uppercase">
                Warnings
              </h2>
              <ul className="space-y-3">
                {evaluation.warnings.map((w) => (
                  <li key={w.code} className="flex items-start gap-3">
                    <span
                      className="text-[8px] font-mono tracking-widest mt-0.5 shrink-0 px-1 py-0.5"
                      style={{
                        color: SEVERITY_COLOR[w.severity] ?? '#555',
                        border: `1px solid ${SEVERITY_COLOR[w.severity] ?? '#555'}`,
                      }}
                    >
                      {w.severity}
                    </span>
                    <span className="text-sm font-mono text-[#1a1a1a] leading-relaxed">
                      {w.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.warnings.length === 0 && (
            <div
              className="px-6 py-4 mb-4 text-center text-sm font-mono"
              style={{ color: '#166534', border: '1px dashed #86efac', borderRadius: '2px' }}
            >
              No issues found. Clean design!
            </div>
          )}
        </>
      ) : (
        <div
          className="px-6 py-4 mb-4 text-center text-sm font-mono text-[#888]"
          style={{ border: '1px dashed #c9bfa8', borderRadius: '2px' }}
        >
          No evaluation on record. Go back and hit EVALUATE before submitting next time.
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-6">
        <Link
          href="/dashboard"
          className="w-full rounded-none py-3.5 font-bold font-mono text-sm text-center bg-yellow-400 text-black hover:bg-yellow-300 transition"
          style={{ border: '1.5px solid #1a1a1a', boxShadow: '2px 2px 0 #1a1a1a' }}
        >
          BACK TO DASHBOARD
        </Link>
        <Link
          href={`/dashboard/problems/${session.prompt.id}`}
          className="w-full rounded-none py-3 font-mono text-xs text-[#888] hover:text-[#1a1a1a] transition text-center"
          style={{ border: '1px dashed #c9bfa8' }}
        >
          try again
        </Link>
      </div>
    </div>
  );
}
