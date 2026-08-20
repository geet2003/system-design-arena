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
  async function logout() {
    await apiClient.post('/auth/logout', {}).catch(() => null);
    // Full page navigation clears bfcache so back button can't restore the dashboard state
    window.location.replace('/login');
  }

  return { logout };
}
