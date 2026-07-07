'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

interface AuthResponse {
  userId: string;
  email: string;
}

export function useLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post<AuthResponse>('/auth/login', { email, password });
      // token is now in an httpOnly cookie — no localStorage needed
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return { login, error, loading };
}

export function useSignup() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signup(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post<AuthResponse>('/auth/signup', { email, password });
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return { signup, error, loading };
}

export function useLogout() {
  const router = useRouter();

  async function logout() {
    await apiClient.post('/auth/logout', {}).catch(() => null);
    // replace() removes dashboard from history stack so back button can't return to it
    router.replace('/login');
    router.refresh(); // invalidates the Next.js cache so the auth cookie is re-checked
  }

  return { logout };
}
