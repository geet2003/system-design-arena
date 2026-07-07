'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { EvaluationResult } from '@sds/shared-types';
import { useDiagramStore } from '@/store/diagramStore';

export function useEvaluation(sessionId: string, cancelAutosave: () => void) {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluate() {
    setIsEvaluating(true);
    setError(null);
    try {
      cancelAutosave();

      const { nodes, edges } = useDiagramStore.getState();
      await apiClient.patch(`/diagrams/${sessionId}`, { nodes, edges });
      useDiagramStore.getState().markSaved();

      const data = await apiClient.post<EvaluationResult>(`/evaluation/${sessionId}`, {});
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  }

  return { result, isEvaluating, error, evaluate };
}
