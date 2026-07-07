'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { login, error, loading } = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(email, password);
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 text-center text-4xl font-semibold text-white">Login</h1>
      <p className="mb-8 text-center text-sm text-gray-400">
        Enter your credentials to access your account
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg bg-[#1c1c1c] px-4 py-3 text-white placeholder-gray-500 outline-none ring-1 ring-transparent transition focus:ring-yellow-400/60"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-400 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border border-gray-600 bg-transparent accent-yellow-400"
          />
          Remember me
        </label>

        {error && (
          <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 py-3.5 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Not a member?{' '}
        <Link href="/signup" className="font-semibold text-yellow-400 hover:text-yellow-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
