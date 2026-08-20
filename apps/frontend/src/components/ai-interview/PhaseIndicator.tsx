'use client';

const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  OPENING:       { label: 'PHASE 1 · OPENING',    color: '#0369a1' },
  HLD_SUBMITTED: { label: 'PHASE 2 · HLD REVIEW', color: '#7c3aed' },
  DEEP_DIVE:     { label: 'PHASE 3 · DEEP DIVE',  color: '#b45309' },
  SCALING:       { label: 'PHASE 4 · SCALING',    color: '#991b1b' },
  CONCLUSION:    { label: 'PHASE 5 · DONE',       color: '#166534' },
};

interface Props {
  phase: string;
}

export function PhaseIndicator({ phase }: Props) {
  const config = PHASE_CONFIG[phase] ?? { label: phase, color: '#888' };

  return (
    <span
      className="text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 shrink-0"
      style={{
        color: config.color,
        border: `1px solid ${config.color}`,
        borderRadius: '2px',
      }}
    >
      {config.label}
    </span>
  );
}
