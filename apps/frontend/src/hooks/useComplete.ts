'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useDiagramStore } from '@/store/diagramStore';

export function useComplete(sessionId: string) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit() {
    setIsCompleting(true);
    setError(null);
    try {
      // Flush any unsaved diagram state first
      const { nodes, edges, isDirty, isSaving } = useDiagramStore.getState();
      if (isDirty || isSaving) {
        await apiClient.patch(`/diagrams/${sessionId}`, { nodes, edges });
        useDiagramStore.getState().markSaved();
      }

      await apiClient.post(`/sessions/${sessionId}/complete`, {});
      router.push(`/interview/${sessionId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit session');
      setIsCompleting(false);
    }
  }

  return { submit, isCompleting, error };
}


