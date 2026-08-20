'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface MeResponse {
  userId: string;
  email: string;
}

export function UserBadge() {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get<MeResponse>('/auth/me'),
    staleTime: Infinity,
  });

  if (!data?.email) return null;

  return (
    <span className="text-xs font-mono text-gray-400 tracking-wide truncate max-w-[180px]">
      {data.email}
    </span>
  );
}
