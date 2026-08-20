'use client';

import Link from 'next/link';

export function AiInterviewBanner() {
  return (
    <div
      className="relative px-5 py-5"
      style={{
        backgroundColor: '#faf7f2',
        border: '1.5px dashed #c9bfa8',
        borderRadius: '2px',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">✦</span>
          <div>
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#1a1a1a] mb-1">
              PRACTICE WITH AI INTERVIEWER
            </h3>
            <p className="text-xs font-mono text-[#888] leading-relaxed max-w-md">
              An interactive interview mode where Gemini walks you through a real question,
              asks follow-up probes, and scores your design across 4 dimensions.
            </p>
          </div>
        </div>

        <Link
          href="/ai-interview"
          className="shrink-0 px-4 py-2 text-[10px] font-mono font-bold tracking-widest text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          style={{ border: '1.5px solid #1a1a1a', borderRadius: '2px' }}
        >
          START →
        </Link>
      </div>
    </div>
  );
}
