'use client';

import { useLogout } from '@/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useLogout();
  return (
    <button
      onClick={logout}
      className="text-xs font-mono text-gray-400 hover:text-white transition tracking-widest"
    >
      LOGOUT
    </button>
  );
}
