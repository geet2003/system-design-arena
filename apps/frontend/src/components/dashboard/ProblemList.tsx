'use client';

import { useState } from 'react';
import { PromptDifficulty } from '@sds/shared-types';
import type { Prompt } from '@sds/shared-types';
import type { SessionSummary } from '@/hooks/useDashboard';
import { ProblemRow } from './ProblemRow';

interface ProblemListProps {
  prompts: Prompt[];
  sessionByPromptId: Map<string, SessionSummary>;
}

const FILTERS = ['ALL', 'EASY', 'MEDIUM', 'HARD'] as const;
type Filter = typeof FILTERS[number];

export function ProblemList({ prompts, sessionByPromptId }: ProblemListProps) {
  const [filter, setFilter] = useState<Filter>('ALL');

  const visible = filter === 'ALL'
    ? prompts
    : prompts.filter(p => p.difficulty === (filter as PromptDifficulty));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold font-mono tracking-widest text-[#1a1a1a]">PROBLEMS</h2>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded transition ${
                filter === f
                  ? 'bg-[#1a1a1a] text-yellow-400'
                  : 'text-[#888] hover:text-[#1a1a1a]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-b-2 border-[#1a1a1a]">
        <span className="w-4" />
        <span className="flex-1 text-[9px] font-mono tracking-widest text-[#888]">PROBLEM</span>
        <span className="text-[9px] font-mono tracking-widest text-[#888] w-14 text-right">DIFF</span>
        <span className="text-[9px] font-mono tracking-widest text-[#888] w-14 text-right">SCORE</span>
        <span className="w-4" />
      </div>

      <div
        style={{
          backgroundColor: '#faf7f2',
          border: '1.5px solid #c9bfa8',
          borderTop: 'none',
          borderRadius: '0 0 2px 2px',
          boxShadow: '2px 2px 0 #d4c9b0',
        }}
      >
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs font-mono text-[#aaa]">no problems found</p>
        ) : (
          visible.map(p => (
            <ProblemRow
              key={p.id}
              promptId={p.id}
              title={p.title}
              difficulty={p.difficulty}
              session={sessionByPromptId.get(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
