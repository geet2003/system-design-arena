'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useDiagramStore } from '@/store/diagramStore';
import type { DiagramNode, DiagramEdge } from '@sds/shared-types';

interface SessionDetail {
  id: string;
  status: string;
  prompt: { id: string; title: string; difficulty: string; description: string };
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[]; version: number } | null;
}

export function useCanvas(sessionId: string) {
  const { setNodes, setEdges, markSaving, markSaved } = useDiagramStore();
  const initialised = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => apiClient.get<SessionDetail>(`/sessions/${sessionId}`),
  });

  // Reset store and hydration flag whenever the session changes
  useEffect(() => {
    initialised.current = false;
    useDiagramStore.setState({
      nodes: [],
      edges: [],
      isDirty: false,
      isSaving: false,
      hydrated: false,
    });
  }, [sessionId]);

  // Hydrate store once per session load
  useEffect(() => {
    if (session && !initialised.current) {
      initialised.current = true;
      useDiagramStore.setState({
        nodes: session.diagram?.nodes ?? [],
        edges: session.diagram?.edges ?? [],
        isDirty: false,
        isSaving: false,
        hydrated: true,
      });
    }
  }, [session, sessionId]);

  // Subscribe to diagram changes and debounce autosave
  useEffect(() => {
    const unsub = useDiagramStore.subscribe(
      (state) => ({ nodes: state.nodes, edges: state.edges, isDirty: state.isDirty }),
      ({ nodes, edges, isDirty }) => {
        if (!isDirty) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
          markSaving();
          try {
            await apiClient.patch(`/diagrams/${sessionId}`, { nodes, edges });
            markSaved();
          } catch {
            // Leave isDirty=true so next change retries
            useDiagramStore.setState({ isSaving: false });
          }
        }, 500);
      },
    );

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sessionId, markSaving, markSaved]);

  function cancelAutosave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }

  return {
    isLoading,
    prompt: session?.prompt ?? null,
    sessionStatus: session?.status ?? null,
    isSaving: useDiagramStore((s) => s.isSaving),
    isDirty: useDiagramStore((s) => s.isDirty),
    cancelAutosave,
  };
}
