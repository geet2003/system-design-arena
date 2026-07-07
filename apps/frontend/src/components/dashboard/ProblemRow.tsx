'use client';

import Link from 'next/link';
import { PromptDifficulty, SessionStatus } from '@sds/shared-types';
import type { SessionSummary } from '@/hooks/useDashboard';

interface ProblemRowProps {
  promptId: string;
  title: string;
  difficulty: PromptDifficulty;
  session: SessionSummary | undefined;
}

const DIFF_STYLE: Record<PromptDifficulty, string> = {
  [PromptDifficulty.EASY]:   'text-[#4ade80]',
  [PromptDifficulty.MEDIUM]: 'text-[#fb923c]',
  [PromptDifficulty.HARD]:   'text-[#f87171]',
};

function StatusDot({ session }: { session: SessionSummary | undefined }) {
  if (!session) {
    // Not started — empty circle
    return (
      <span className="text-[#c9bfa8] text-base leading-none select-none" title="Not started">○</span>
    );
  }
  if (session.status === SessionStatus.COMPLETED) {
    return (
      <span className="text-[#4ade80] text-base leading-none select-none" title="Completed">●</span>
    );
  }
  // ACTIVE / in progress — half-filled approximation
  return (
    <span className="text-[#fb923c] text-base leading-none select-none" title="In progress">◑</span>
  );
}

function Score({ session }: { session: SessionSummary | undefined }) {
  if (!session || session.status !== SessionStatus.COMPLETED) {
    return <span className="text-[#c9bfa8]">—</span>;
  }
  const top = session.evaluations[0];
  if (!top) return <span className="text-[#c9bfa8]">—</span>;
  return (
    <span className="text-[#1a1a1a] font-bold">{Math.round(top.score)}</span>
  );
}

export function ProblemRow({ promptId, title, difficulty, session }: ProblemRowProps) {
  return (
    <Link
      href={`/dashboard/problems/${promptId}`}
      className="group flex items-center gap-4 px-3 py-3 border-b border-[#d4c9b0] hover:bg-yellow-50/60 transition-colors"
    >
      <StatusDot session={session} />

      <span className="flex-1 text-sm font-mono text-[#1a1a1a] group-hover:underline decoration-dotted">
        {title}
      </span>

      <span className={`text-[10px] font-bold font-mono tracking-widest w-14 text-right ${DIFF_STYLE[difficulty]}`}>
        {difficulty}
      </span>

      <span className="text-xs font-mono w-14 text-right">
        <Score session={session} />
        {session?.status === SessionStatus.COMPLETED && (
          <span className="text-[#aaa] text-[9px]"> pts</span>
        )}
      </span>

      <span className="text-[#aaa] text-sm group-hover:text-[#1a1a1a] transition-colors">→</span>
    </Link>
  );
}
