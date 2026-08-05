'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Set a cookie the middleware can read for route protection
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `sds_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
      // Clean token from URL immediately
      window.history.replaceState({}, '', '/auth/callback');
    }

    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111]">
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
}
