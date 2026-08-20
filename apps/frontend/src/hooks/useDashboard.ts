'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Prompt } from '@sds/shared-types';
import { SessionStatus, PromptDifficulty } from '@sds/shared-types';

export interface SessionSummary {
  id: string;
  status: SessionStatus;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  prompt: { id: string; title: string; difficulty: PromptDifficulty };
  evaluations: { score: number; generatedAt: string }[];
}

interface AISessionSummary {
  id: string;
  status: string;
  rubricScores: {
    scalability: number;
    reliability: number;
    correctness: number;
    depth: number;
    overall: number;
  } | null;
}

export interface AIStats {
  count: number;
  avgScore: number | null;
  weakestDimension: string | null;
}

const DIMENSION_LABELS: Record<string, string> = {
  scalability: 'Scalability',
  reliability: 'Reliability',
  correctness: 'Correctness',
  depth: 'Depth',
};

function computeAIStats(sessions: AISessionSummary[]): AIStats {
  const completed = sessions.filter(
    (s) => s.status === 'COMPLETED' && s.rubricScores,
  );

  if (completed.length === 0) {
    return { count: sessions.length, avgScore: null, weakestDimension: null };
  }

  const totals = { scalability: 0, reliability: 0, correctness: 0, depth: 0, overall: 0 };
  for (const s of completed) {
    const r = s.rubricScores!;
    totals.scalability += r.scalability;
    totals.reliability += r.reliability;
    totals.correctness += r.correctness;
    totals.depth += r.depth;
    totals.overall += r.overall;
  }

  const n = completed.length;
  const avgs = {
    scalability: totals.scalability / n,
    reliability: totals.reliability / n,
    correctness: totals.correctness / n,
    depth: totals.depth / n,
  };

  const weakestKey = (Object.keys(avgs) as (keyof typeof avgs)[]).reduce((a, b) =>
    avgs[a] <= avgs[b] ? a : b,
  );

  return {
    count: sessions.length,
    avgScore: Math.round(totals.overall / n),
    weakestDimension: DIMENSION_LABELS[weakestKey] ?? weakestKey,
  };
}

export function useDashboard() {
  const promptsQuery = useQuery({
    queryKey: ['prompts'],
    queryFn: () => apiClient.get<Prompt[]>('/prompts'),
  });

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiClient.get<SessionSummary[]>('/sessions'),
  });

  const aiSessionsQuery = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => apiClient.get<AISessionSummary[]>('/ai-interview'),
  });

  const sessions = sessionsQuery.data ?? [];
  const prompts = promptsQuery.data ?? [];
  const aiSessions = aiSessionsQuery.data ?? [];

  // Count completed sessions per difficulty where score >= 70
  const solvedByDifficulty: Record<PromptDifficulty, number> = {
    [PromptDifficulty.EASY]: 0,
    [PromptDifficulty.MEDIUM]: 0,
    [PromptDifficulty.HARD]: 0,
  };
  for (const s of sessions) {
    if (s.status === SessionStatus.COMPLETED && (s.evaluations[0]?.score ?? 0) >= 70) {
      solvedByDifficulty[s.prompt.difficulty]++;
    }
  }

  // Set of local date strings (YYYY-MM-DD) with at least one completed session
  const completedDates = new Set<string>();
  for (const s of sessions) {
    if (s.status === SessionStatus.COMPLETED) {
      const d = new Date(s.updatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      completedDates.add(key);
    }
  }

  // Current streak: count consecutive days ending today (local time)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  // Map promptId → most recent session (for status icon + score on problem row)
  const sessionByPromptId = new Map<string, SessionSummary>();
  for (const s of sessions) {
    if (!sessionByPromptId.has(s.prompt.id)) {
      sessionByPromptId.set(s.prompt.id, s);
    }
  }

  const aiStats = computeAIStats(aiSessions);

  return {
    prompts,
    sessions,
    solvedByDifficulty,
    completedDates,
    streak,
    sessionByPromptId,
    aiStats,
    isLoading: promptsQuery.isLoading || sessionsQuery.isLoading,
  };
}

