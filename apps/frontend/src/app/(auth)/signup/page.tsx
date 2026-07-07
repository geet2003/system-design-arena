'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignup } from '@/hooks/useAuth';

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
