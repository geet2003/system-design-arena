'use client';

import { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface Props {
  size?: number;
}

export function RoughFlame({ size = 16 }: Props) {
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
    const s = size;

    const opts = {
      roughness: 1.6,
      bowing: 0.8,
      stroke: '#1a1a1a',
      strokeWidth: s / 14,
      seed: 11,
    };

    // Outer flame: round base, rises to a pointed tip at top,
    // with a left-side inner notch (the "wing" curl seen in reference)
    // Scaled to fit in an s×s box with a little padding
    const pad = s * 0.04;
    const w = s - pad * 2;
    const h = s - pad * 2;
    const ox = pad; // origin x
    const oy = pad; // origin y

    // Outer body path (clockwise from tip):
    // tip → right shoulder → lower-right curve → base-right → base-left → lower-left curve → left-wing notch → back to tip
    const outerPath =
      `M ${ox + w * 0.5},${oy}` +                                    // tip
      ` C ${ox + w * 0.78},${oy + h * 0.18}` +
        ` ${ox + w * 0.92},${oy + h * 0.42}` +
        ` ${ox + w * 0.88},${oy + h * 0.6}` +                        // right shoulder → mid-right
      ` C ${ox + w * 0.84},${oy + h * 0.75}` +
        ` ${ox + w * 0.76},${oy + h * 0.84}` +
        ` ${ox + w * 0.65},${oy + h * 0.9}` +                        // lower-right bowl
      ` C ${ox + w * 0.58},${oy + h * 0.96}` +
        ` ${ox + w * 0.42},${oy + h * 0.96}` +
        ` ${ox + w * 0.35},${oy + h * 0.9}` +                        // base arc
      ` C ${ox + w * 0.24},${oy + h * 0.84}` +
        ` ${ox + w * 0.16},${oy + h * 0.75}` +
        ` ${ox + w * 0.14},${oy + h * 0.62}` +                       // lower-left bowl
      ` C ${ox + w * 0.1},${oy + h * 0.52}` +
        ` ${ox + w * 0.14},${oy + h * 0.44}` +
        ` ${ox + w * 0.24},${oy + h * 0.46}` +                       // left wing: dips in then back out
      ` C ${ox + w * 0.3},${oy + h * 0.47}` +
        ` ${ox + w * 0.26},${oy + h * 0.36}` +
        ` ${ox + w * 0.32},${oy + h * 0.26}` +                       // left side up toward tip
      ` C ${ox + w * 0.38},${oy + h * 0.16}` +
        ` ${ox + w * 0.44},${oy + h * 0.06}` +
        ` ${ox + w * 0.5},${oy} Z`;                                   // close at tip

    rc.path(outerPath, {
      ...opts,
      fill: '#fb923c',
      fillStyle: 'solid',
    });

    // Inner flame curl: smaller shape sitting inside, suggests the hot inner core
    const innerPath =
      `M ${ox + w * 0.5},${oy + h * 0.22}` +
      ` C ${ox + w * 0.62},${oy + h * 0.34}` +
        ` ${ox + w * 0.66},${oy + h * 0.5}` +
        ` ${ox + w * 0.62},${oy + h * 0.62}` +
      ` C ${ox + w * 0.58},${oy + h * 0.72}` +
        ` ${ox + w * 0.5},${oy + h * 0.78}` +
        ` ${ox + w * 0.5},${oy + h * 0.78}` +
      ` C ${ox + w * 0.5},${oy + h * 0.78}` +
        ` ${ox + w * 0.42},${oy + h * 0.72}` +
        ` ${ox + w * 0.4},${oy + h * 0.62}` +
      ` C ${ox + w * 0.37},${oy + h * 0.5}` +
        ` ${ox + w * 0.4},${oy + h * 0.36}` +
        ` ${ox + w * 0.5},${oy + h * 0.22} Z`;

    rc.path(innerPath, {
      ...opts,
      strokeWidth: opts.strokeWidth * 0.7,
      stroke: '#1a1a1a',
      fill: '#fde68a',
      fillStyle: 'solid',
      seed: 17,
    });
  }, [size]);

  return <canvas ref={canvasRef} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
}
