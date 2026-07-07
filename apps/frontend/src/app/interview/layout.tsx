import { LogoutButton } from '@/components/dashboard/LogoutButton';
import Link from 'next/link';

// Full-viewport layout for the canvas — notebook background, no width constraint
export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-mono"
      style={{
        backgroundColor: '#f5f0e8',
        backgroundImage:
          'linear-gradient(#d4c9b0 1px, transparent 1px),' +
          'linear-gradient(90deg, #d4c9b0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Red margin rule */}
      <div className="absolute inset-y-0 left-[48px] w-[1.5px] bg-red-400/40 pointer-events-none z-10" />

      <nav className="relative z-20 flex items-center justify-between px-4 py-2 bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-yellow-400/40">
            <span className="text-xs font-bold text-yellow-400">s.</span>
          </div>
          <Link href="/dashboard" className="text-xs tracking-widest text-white/50 hover:text-white/80 transition">
            ← DASHBOARD
          </Link>
        </div>
        <LogoutButton />
      </nav>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
