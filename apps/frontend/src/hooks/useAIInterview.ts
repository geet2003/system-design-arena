'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export interface AIMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface AISessionDetail {
  id: string;
  question: string;
  category: string;
  phase: string;
  status: string;
  rubricScores: unknown;
  diagramSnapshot: string | null;
  createdAt: string;
  expiresAt: string;
  messages: AIMessage[];
}

interface SendMessageResponse {
  message: AIMessage;
  phase: string;
  rubricScores?: unknown;
}

interface SubmitDiagramResponse {
  badge: string;
  diff: unknown;
}

// ─── createSession hook (used on category picker page) ────────────────────────

export function useCreateSession() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createSession(category: string) {
    setIsCreating(true);
    setError(null);
    try {
      const data = await apiClient.post<{ session: { id: string } }>('/ai-interview', { category });
      router.push(`/ai-interview/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setIsCreating(false);
    }
  }

  return { createSession, isCreating, error };
}

// ─── useAIInterview hook (used on interview page) ─────────────────────────────

export function useAIInterview(sessionId: string) {
  const [session, setSession] = useState<AISessionDetail | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [phase, setPhase] = useState<string>('OPENING');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const [lastBadge, setLastBadge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<AISessionDetail>(`/ai-interview/${sessionId}`);
      setSession(data);
      setMessages(data.messages);
      setPhase(data.phase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Silent refresh — updates session/messages/phase without triggering the loading
  // spinner. Used for background syncs (e.g. after diagram submit) where we don't
  // want to unmount and remount the canvas.
  const refreshSession = useCallback(async () => {
    try {
      const data = await apiClient.get<AISessionDetail>(`/ai-interview/${sessionId}`);
      setSession(data);
      setMessages(data.messages);
      setPhase(data.phase);
    } catch {
      // Swallow — background refresh failure is not critical
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    setIsSending(true);
    setError(null);
    // Optimistically append user message
    const optimistic: AIMessage = {
      id: `opt-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const data = await apiClient.post<SendMessageResponse>(
        `/ai-interview/${sessionId}/message`,
        { content },
      );
      // Replace optimistic + append assistant reply
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        { ...optimistic, id: `user-${Date.now()}` },
        data.message,
      ]);
      setPhase(data.phase);
      if (data.rubricScores) {
        setSession((s) => s ? { ...s, rubricScores: data.rubricScores, phase: data.phase } : s);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [sessionId]);

  const submitDiagram = useCallback(async (
    nodes: { id: string; label: string }[],
    edges: { source: string; target: string }[],
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiClient.post<SubmitDiagramResponse>(
        `/ai-interview/${sessionId}/diagram`,
        { nodes, edges },
      );
      setLastBadge(data.badge);
      // Use silent refresh so the canvas (which holds local ReactFlow state) is not unmounted
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit diagram');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, refreshSession]);

  const concludeSession = useCallback(async () => {
    setIsConcluding(true);
    setError(null);
    try {
      await apiClient.post(`/ai-interview/${sessionId}/conclude`, {});
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to conclude session');
    } finally {
      setIsConcluding(false);
    }
  }, [sessionId, refreshSession]);

  return {
    session,
    messages,
    phase,
    isLoading,
    isSending,
    isSubmitting,
    isConcluding,
    lastBadge,
    error,
    loadSession,
    sendMessage,
    submitDiagram,
    concludeSession,
  };
}
