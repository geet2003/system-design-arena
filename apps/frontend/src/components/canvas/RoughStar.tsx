'use client';

import { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface Props {
  fill?: string;
  stroke?: string;
  size?: number;
  seed?: number;
}

// Crossing-lines hand-drawn star: draws two slightly offset star polygons
// on top of each other so rough.js wobble causes lines to cross naturally.
export function RoughStar({ fill = 'none', stroke = '#c9bfa8', size = 10, seed = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const rc = rough.canvas(canvas);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.46;
    const innerR = outerR * 0.38;

    // Build a standard 5-pointed star centered at (cx, cy)
    function starPts(rotationOffset = 0): [number, number][] {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2 + rotationOffset;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      return pts;
    }

    const col = fill === 'none' ? stroke : '#1a1a1a';
    const sw = size > 12 ? 1.3 : 0.9;

    // First pass — fills the shape (only on first pass to avoid double-fill darkening)
    rc.polygon(starPts(0), {
      roughness: 2.4,
      bowing: 2,
      stroke: col,
      strokeWidth: sw,
      fill: fill === 'none' ? 'transparent' : fill,
      fillStyle: 'solid',
      seed,
    });

    // Second pass — slightly rotated, outline only, no fill.
    // This creates the crossing-over lines effect.
    rc.polygon(starPts(0.08), {
      roughness: 2.4,
      bowing: 2,
      stroke: col,
      strokeWidth: sw * 0.8,
      fill: 'transparent',
      seed: seed + 50,
    });
  }, [fill, stroke, size, seed]);

  return <canvas ref={canvasRef} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
}
