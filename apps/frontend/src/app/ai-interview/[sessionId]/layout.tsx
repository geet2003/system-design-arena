import Link from 'next/link';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import { UserBadge } from '@/components/dashboard/UserBadge';

export default function AIInterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col h-screen font-mono overflow-hidden"
      style={{
        backgroundColor: '#f5f0e8',
        backgroundImage:
          'linear-gradient(#d4c9b0 1px, transparent 1px),' +
          'linear-gradient(90deg, #d4c9b0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-3 bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] border border-yellow-400/40">
            <span className="text-xs font-bold text-yellow-400">s.</span>
          </div>
          <Link href="/dashboard" className="text-sm font-bold tracking-widest text-white/80 hover:text-white transition">
            SYSTEM DESIGN
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserBadge />
          <LogoutButton />
        </div>
      </nav>

      {/* Full-height content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
