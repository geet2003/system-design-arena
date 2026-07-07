'use client';

import { PromptDifficulty } from '@sds/shared-types';

interface StatsBarProps {
  solvedByDifficulty: Record<PromptDifficulty, number>;
  totalByDifficulty: Record<PromptDifficulty, number>;
  streak: number;
}

const DIFF_STYLE: Record<PromptDifficulty, { label: string; color: string }> = {
  [PromptDifficulty.EASY]:   { label: 'EASY',   color: '#4ade80' },
  [PromptDifficulty.MEDIUM]: { label: 'MEDIUM', color: '#fb923c' },
  [PromptDifficulty.HARD]:   { label: 'HARD',   color: '#f87171' },
};

export function StatsBar({ solvedByDifficulty, totalByDifficulty, streak }: StatsBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-6 px-5 py-3 mb-6"
      style={{
        backgroundColor: '#faf7f2',
        border: '1.5px solid #c9bfa8',
        borderRadius: '2px',
        boxShadow: '2px 2px 0 #d4c9b0',
      }}
    >
      {([PromptDifficulty.EASY, PromptDifficulty.MEDIUM, PromptDifficulty.HARD] as PromptDifficulty[]).map(d => (
        <div key={d} className="flex items-baseline gap-1.5">
          <span className="text-xs font-bold font-mono" style={{ color: DIFF_STYLE[d].color }}>
            {DIFF_STYLE[d].label}
          </span>
          <span className="text-base font-bold font-mono text-[#1a1a1a]">
            {solvedByDifficulty[d]}
          </span>
          <span className="text-xs font-mono text-[#888]">/ {totalByDifficulty[d]}</span>
        </div>
      ))}

      <div className="ml-auto flex items-baseline gap-1.5">
        <span className="text-xs font-bold font-mono text-[#fb923c]">STREAK</span>
        <span className="text-base font-bold font-mono text-[#1a1a1a]">{streak}</span>
        <span className="text-xs font-mono text-[#888]">day</span>
      </div>
    </div>
  );
}

