'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { SessionStatus } from '@sds/shared-types';
import type { Prompt } from '@sds/shared-types';
import type { SessionSummary } from './useDashboard';

export function useProblemDetail(promptId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const promptQuery = useQuery({
    queryKey: ['prompt', promptId],
    queryFn: () => apiClient.get<Prompt>(`/prompts/${promptId}`),
  });

  // Reuse cached sessions list
  const sessions = queryClient.getQueryData<SessionSummary[]>(['sessions']) ?? [];
  const relevantSessions = sessions.filter(s => s.prompt.id === promptId);
  const activeSession  = relevantSessions.find(s => s.status === SessionStatus.ACTIVE);
  const completedSession = relevantSessions.find(s => s.status === SessionStatus.COMPLETED);

  const startMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ id: string }>('/sessions', { promptId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.push(`/interview/${data.id}`);
    },
  });

  return {
    prompt: promptQuery.data,
    isLoading: promptQuery.isLoading,
    activeSession,
    completedSession,
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    startError: startMutation.error instanceof Error ? startMutation.error.message : null,
  };
}
