export function AiInterviewBanner() {
  return (
    <div
      className="relative px-5 py-5 opacity-60"
      style={{
        backgroundColor: '#faf7f2',
        border: '1.5px dashed #c9bfa8',
        borderRadius: '2px',
      }}
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl mt-0.5">✦</span>
        <div>
          <h3 className="text-xs font-bold font-mono tracking-widest text-[#1a1a1a] mb-1">
            PRACTICE WITH AI INTERVIEWER
          </h3>
          <p className="text-xs font-mono text-[#888] leading-relaxed max-w-md">
            An interactive interview mode where an AI walks you through requirements,
            asks follow-up questions, and evaluates your design decisions in real-time.
          </p>
          <p className="mt-3 text-[10px] font-mono font-bold tracking-widest text-[#aaa]">
            — COMING IN PHASE 2 —
          </p>
        </div>
      </div>

      {/* Corner note */}
      <span
        className="absolute top-2 right-3 text-[9px] font-mono text-[#bbb] rotate-[-2deg]"
        style={{ fontStyle: 'italic' }}
      >
        not yet
      </span>
    </div>
  );
}
