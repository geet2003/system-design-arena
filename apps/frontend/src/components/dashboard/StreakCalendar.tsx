'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import rough from 'roughjs';

const RoughStar = dynamic(
  () => import('@/components/canvas/RoughStar').then(m => m.RoughStar),
  { ssr: false, loading: () => <span style={{ width: 10, display: 'inline-block' }} /> },
);

interface StreakCalendarProps {
  completedDates: Set<string>;
}

const DAYS = 30;
const DOT_R = 6;       // radius
const GAP = 20;        // spacing between dot centers
const COLS = 10;
const ROWS = Math.ceil(DAYS / COLS);

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function StreakCalendar({ completedDates }: StreakCalendarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = COLS * GAP + DOT_R * 2;
    const H = ROWS * GAP + DOT_R * 2;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const rc = rough.canvas(canvas);
    const today = new Date();
    const todayKey = toKey(today);

    // Standard 5-pointed star centered at (cx, cy) with optional rotation offset
    function starPts(cx: number, cy: number, outerR: number, innerR: number, rotOffset = 0): [number, number][] {
      const pts: [number, number][] = [];
      for (let p = 0; p < 10; p++) {
        const angle = (Math.PI / 5) * p - Math.PI / 2 + rotOffset;
        const r = p % 2 === 0 ? outerR : innerR;
        pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      return pts;
    }

    for (let i = 0; i < DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (DAYS - 1 - i));
      const key = toKey(d);

      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = col * GAP + DOT_R + GAP / 2;
      const cy = row * GAP + DOT_R + GAP / 2;

      const done    = completedDates.has(key);
      const isToday = key === todayKey;

      const outerR = DOT_R;
      const innerR = DOT_R * 0.38;
      const strokeCol = done ? '#1a1a1a' : (isToday ? '#facc15' : '#c9bfa8');
      const fillCol   = done ? (isToday ? '#facc15' : '#4ade80') : 'transparent';

      // First pass: filled shape
      rc.polygon(starPts(cx, cy, outerR, innerR, 0), {
        roughness: 2.4,
        bowing: 2,
        stroke: strokeCol,
        strokeWidth: 1.1,
        fill: fillCol,
        fillStyle: 'solid',
        seed: i + 1,
      });
      // Second pass: slightly rotated outline — creates the crossing-lines look
      rc.polygon(starPts(cx, cy, outerR, innerR, 0.08), {
        roughness: 2.4,
        bowing: 2,
        stroke: strokeCol,
        strokeWidth: 0.8,
        fill: 'transparent',
        seed: i + 51,
      });
    }
  }, [completedDates]);

  return (
    <div
      className="flex flex-col gap-2 px-5 py-4 mb-6"
      style={{
        backgroundColor: '#faf7f2',
        border: '1.5px solid #c9bfa8',
        borderRadius: '2px',
        boxShadow: '2px 2px 0 #d4c9b0',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-widest text-[#888]">LAST 30 DAYS</span>
        <div className="flex items-center gap-3 text-[9px] font-mono text-[#aaa]">
          <span className="flex items-center gap-1"><RoughStar fill="#4ade80" size={10} seed={2} />completed</span>
          <span className="flex items-center gap-1"><RoughStar fill="none" stroke="#c9bfa8" size={10} seed={4} />none</span>
          <span className="flex items-center gap-1"><RoughStar fill="#facc15" size={10} seed={6} />today</span>
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
