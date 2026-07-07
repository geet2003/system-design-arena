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

export function useDashboard() {
  const promptsQuery = useQuery({
    queryKey: ['prompts'],
    queryFn: () => apiClient.get<Prompt[]>('/prompts'),
  });

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiClient.get<SessionSummary[]>('/sessions'),
  });

  const sessions = sessionsQuery.data ?? [];
  const prompts = promptsQuery.data ?? [];

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
  // Sessions are ordered by updatedAt desc, so first encountered = most recent
  for (const s of sessions) {
    if (!sessionByPromptId.has(s.prompt.id)) {
      sessionByPromptId.set(s.prompt.id, s);
    }
  }

  return {
    prompts,
    sessions,
    solvedByDifficulty,
    completedDates,
    streak,
    sessionByPromptId,
    isLoading: promptsQuery.isLoading || sessionsQuery.isLoading,
  };
}
