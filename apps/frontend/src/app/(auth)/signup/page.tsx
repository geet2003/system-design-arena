'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignup } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [matchError, setMatchError] = useState<string | null>(null);
  const { signup, error, loading } = useSignup();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMatchError('Passwords do not match');
      return;
    }
    setMatchError(null);
    signup(email, password);
  }

  const anyError = matchError ?? error;

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 text-center text-4xl font-semibold text-white">Create account</h1>
      <p className="mb-8 text-center text-sm text-gray-400">
        Start mastering system design interviews
      </p>

      <a
        href={`${API_URL}/auth/google`}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-600 bg-[#1c1c1c] py-3 text-sm font-medium text-white transition hover:bg-[#252525] mb-5"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="relative mb-5 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-700" />
        <span className="text-xs text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-700" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg bg-[#1c1c1c] px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-transparent transition focus:ring-yellow-400/60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg bg-[#1c1c1c] px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-transparent transition focus:ring-yellow-400/60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg bg-[#1c1c1c] px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-transparent transition focus:ring-yellow-400/60"
          />
        </div>

        {anyError && (
          <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">{anyError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 py-3.5 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-yellow-400 hover:text-yellow-300">
          Log in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
