'use client';

import dynamic from 'next/dynamic';
import { PromptDifficulty } from '@sds/shared-types';
import { useDashboard } from '@/hooks/useDashboard';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { ProblemList } from '@/components/dashboard/ProblemList';
import { AiInterviewBanner } from '@/components/dashboard/AiInterviewBanner';

// Canvas-based streak calendar — disable SSR (uses browser Canvas API)
const StreakCalendar = dynamic(
  () => import('@/components/dashboard/StreakCalendar').then(m => m.StreakCalendar),
  { ssr: false, loading: () => <div className="h-20 mb-6" /> },
);

export default function DashboardPage() {
  const { prompts, solvedByDifficulty, completedDates, streak, sessionByPromptId, aiStats, isLoading } =
    useDashboard();

  // Total problems per difficulty (for the X/Y display)
  const totalByDifficulty: Record<PromptDifficulty, number> = {
    [PromptDifficulty.EASY]:   prompts.filter(p => p.difficulty === PromptDifficulty.EASY).length,
    [PromptDifficulty.MEDIUM]: prompts.filter(p => p.difficulty === PromptDifficulty.MEDIUM).length,
    [PromptDifficulty.HARD]:   prompts.filter(p => p.difficulty === PromptDifficulty.HARD).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-xs font-mono tracking-widest text-[#aaa] animate-pulse">loading…</p>
      </div>
    );
  }

  return (
    <>
      <StatsBar
        solvedByDifficulty={solvedByDifficulty}
        totalByDifficulty={totalByDifficulty}
        streak={streak}
        aiStats={aiStats}
      />

      <StreakCalendar completedDates={completedDates} />

      <ProblemList prompts={prompts} sessionByPromptId={sessionByPromptId} />

      <AiInterviewBanner />
    </>
  );
}
