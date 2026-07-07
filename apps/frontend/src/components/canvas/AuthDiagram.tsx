'use client';

import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

// ── Logical canvas dimensions ────────────────────────────────────
const LW = 420;
const LH = 680;

// ── Node definitions ─────────────────────────────────────────────
// Shapes: rect | hexagon | cloud | double | diamond | pentagon | cylinder | scroll
const NODES = [
  { id: 'client',   label: 'CLIENT',      sub: 'Browser',      cx: 210, cy: 58,  w: 140, h: 40, shape: 'hexagon',  tooltip: '10k+ req / sec'   },
  { id: 'cdn',      label: 'CDN',         sub: 'Edge Cache',   cx: 210, cy: 152, w: 140, h: 40, shape: 'cloud',    tooltip: 'Global PoPs'      },
  { id: 'gateway',  label: 'API GATEWAY', sub: 'Rate limit',   cx: 210, cy: 248, w: 160, h: 40, shape: 'double',   tooltip: 'Auth + routing'   },
  { id: 'redirect', label: 'REDIRECT',    sub: 'Read svc',     cx: 100, cy: 350, w: 124, h: 40, shape: 'pentagon', tooltip: '~1ms p99 latency' },
  { id: 'write',    label: 'WRITE SVC',   sub: 'Shorten URL',  cx: 320, cy: 350, w: 124, h: 40, shape: 'diamond',  tooltip: 'Nanoid generation'},
  { id: 'redis',    label: 'REDIS',       sub: 'Cache',        cx: 100, cy: 450, w: 124, h: 40, shape: 'cylinder', tooltip: '99.9% hit rate'   },
  { id: 'postgres', label: 'POSTGRES',    sub: 'Primary DB',   cx: 320, cy: 450, w: 124, h: 40, shape: 'cylinder', tooltip: 'Source of truth'  },
  { id: 'queue',    label: 'MSG QUEUE',   sub: 'Analytics',    cx: 320, cy: 555, w: 124, h: 40, shape: 'scroll',   tooltip: 'Async fan-out'    },
] as const;

type NodeId = typeof NODES[number]['id'];

const EDGES: { from: NodeId; to: NodeId; dashed?: boolean; label?: string }[] = [
  { from: 'client',   to: 'cdn'                              },
  { from: 'cdn',      to: 'gateway'                          },
  { from: 'gateway',  to: 'redirect', label: 'GET /:slug'   },
  { from: 'gateway',  to: 'write',    label: 'POST /shorten' },
  { from: 'redirect', to: 'redis'                            },
  { from: 'redirect', to: 'postgres', dashed: true           },
  { from: 'write',    to: 'postgres'                         },
  { from: 'write',    to: 'queue',    label: 'async'         },
];

// ── Drawing helpers ───────────────────────────────────────────────
function getNode(id: NodeId) { return NODES.find(n => n.id === id)!; }

// Cream fill drawn with plain canvas before Rough.js strokes so text is never obscured
function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hov: boolean) {
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fillRect(x, y, w, h);
}

function drawArrowhead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 10;
  const spread = 0.42;
  ctx.beginPath();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.3;
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(angle - spread), y2 - len * Math.sin(angle - spread));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(angle + spread), y2 - len * Math.sin(angle + spread));
  ctx.stroke();
}

function edgeEndpoints(from: NodeId, to: NodeId): [number, number, number, number] {
  const a = getNode(from);
  const b = getNode(to);
  const acx = a.cx as number, acy = a.cy as number, ah = a.h as number, aw = a.w as number;
  const bcx = b.cx as number, bcy = b.cy as number, bh = b.h as number, bw = b.w as number;
  const dx = bcx - acx;
  const dy = bcy - acy;
  let x1 = acx, y1 = acy, x2 = bcx, y2 = bcy;
  if (Math.abs(dy) >= Math.abs(dx)) {
    y1 = dy > 0 ? acy + ah / 2 + 4 : acy - ah / 2 - 4;
    y2 = dy > 0 ? bcy - bh / 2 - 4 : bcy + bh / 2 + 4;
  } else {
    x1 = dx > 0 ? acx + aw / 2 + 4 : acx - aw / 2 - 4;
    x2 = dx > 0 ? bcx - bw / 2 - 4 : bcx + bw / 2 + 4;
  }
  return [x1, y1, x2, y2];
}

// Draw label text on top of whatever shape is beneath — always white-cleared first
function drawLabel(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  label: string, sub: string,
  hov: boolean,
) {
  // White pill behind text so it's readable against any fill/stroke
  const tw  = ctx.measureText(label).width;
  const pad = 6;
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fillRect(cx - tw / 2 - pad, cy - 10, tw + pad * 2, 22);

  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = hov ? '#b03a2e' : '#1a1a1a';
  ctx.fillText(label, cx, cy + 1);

  ctx.font = '9px monospace';
  ctx.fillStyle = hov ? '#c0392b' : '#5a5a5a';
  ctx.fillText(sub, cx, cy + 13);
}

// ── Shape drawers (fill first via plain canvas, then rough strokes, then label) ──
type RC = ReturnType<typeof rough.canvas>;

function drawHexagon(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const rx = w / 2, ry = h / 2, notch = 12;
  // Fill with plain canvas polygon first
  ctx.beginPath();
  ctx.moveTo(cx - rx + notch, cy - ry);
  ctx.lineTo(cx + rx - notch, cy - ry);
  ctx.lineTo(cx + rx,         cy);
  ctx.lineTo(cx + rx - notch, cy + ry);
  ctx.lineTo(cx - rx + notch, cy + ry);
  ctx.lineTo(cx - rx,         cy);
  ctx.closePath();
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fill();
  // Rough strokes
  const opts = shapeOpts(hov);
  rc.polygon([
    [cx - rx + notch, cy - ry],
    [cx + rx - notch, cy - ry],
    [cx + rx,         cy],
    [cx + rx - notch, cy + ry],
    [cx - rx + notch, cy + ry],
    [cx - rx,         cy],
  ], opts);
}

function drawCloud(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  // Approximate a cloud with overlapping ellipses — fill area first
  ctx.beginPath();
  ctx.ellipse(cx,        cy,        w / 2 - 4, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fill();
  // Rough cloud using 3 overlapping ellipses
  const opts = shapeOpts(hov);
  rc.ellipse(cx - 22,  cy + 4,  50, 28, opts);
  rc.ellipse(cx + 22,  cy + 4,  50, 28, opts);
  rc.ellipse(cx,       cy - 4,  60, 30, opts);
}

function drawDouble(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const x = cx - w / 2, y = cy - h / 2;
  fillRect(ctx, x, y, w, h, hov);
  const opts = shapeOpts(hov);
  rc.rectangle(x, y, w, h, opts);
  rc.rectangle(x + 5, y + 5, w - 10, h - 10, { ...opts, strokeWidth: 0.8 });
}

function drawPentagon(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const rx = w / 2, ry = h / 2, peak = 10;
  ctx.beginPath();
  ctx.moveTo(cx,          cy - ry - peak);
  ctx.lineTo(cx + rx,     cy - ry + 4);
  ctx.lineTo(cx + rx,     cy + ry);
  ctx.lineTo(cx - rx,     cy + ry);
  ctx.lineTo(cx - rx,     cy - ry + 4);
  ctx.closePath();
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fill();
  const opts = shapeOpts(hov);
  rc.polygon([
    [cx,       cy - ry - peak],
    [cx + rx,  cy - ry + 4],
    [cx + rx,  cy + ry],
    [cx - rx,  cy + ry],
    [cx - rx,  cy - ry + 4],
  ], opts);
}

function drawDiamond(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const rx = w / 2 + 6, ry = h / 2 + 6;
  ctx.beginPath();
  ctx.moveTo(cx,      cy - ry);
  ctx.lineTo(cx + rx, cy);
  ctx.lineTo(cx,      cy + ry);
  ctx.lineTo(cx - rx, cy);
  ctx.closePath();
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fill();
  const opts = shapeOpts(hov);
  rc.polygon([
    [cx,      cy - ry],
    [cx + rx, cy],
    [cx,      cy + ry],
    [cx - rx, cy],
  ], opts);
}

function drawCylinder(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const x = cx - w / 2, y = cy - h / 2, ey = 10;
  // Fill body
  ctx.fillStyle = hov ? '#fff3cd' : '#faf7f2';
  ctx.fillRect(x, y + ey, w, h - ey);
  const opts = shapeOpts(hov);
  rc.rectangle(x, y + ey, w, h - ey, opts);
  rc.ellipse(cx, y + ey, w, ey * 2, opts);
  rc.ellipse(cx, y + ey, w, ey * 2, { ...opts, stroke: opts.stroke, strokeWidth: 0.5, roughness: 0.8 });
}

function drawScroll(ctx: CanvasRenderingContext2D, rc: RC, cx: number, cy: number, w: number, h: number, hov: boolean) {
  const x = cx - w / 2, y = cy - h / 2, curl = 8;
  fillRect(ctx, x + curl, y, w - curl, h, hov);
  const opts = shapeOpts(hov);
  rc.rectangle(x + curl, y, w - curl, h, opts);
  // Left curl arc
  rc.arc(x + curl, cy, curl * 2, h, Math.PI / 2, -Math.PI / 2, false, opts);
  rc.arc(x + curl, cy, curl * 2, h, Math.PI / 2, -Math.PI / 2, false, { ...opts, strokeWidth: 0.5 });
}

function shapeOpts(hov: boolean) {
  return {
    roughness: 1.4,
    stroke: hov ? '#b03a2e' : '#1a1a1a',
    strokeWidth: hov ? 2.2 : 1.5,
    fill: 'none' as const,
    seed: 42,
  };
}

// ── Main draw function ────────────────────────────────────────────
function drawCanvas(canvas: HTMLCanvasElement, hovered: NodeId | null, scale: number) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);

  const rc = rough.canvas(canvas);

  // ── Header ───────────────────────────────────────────────────
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#2c2c2c';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM  DESIGN', LW / 2, 22);
  ctx.letterSpacing = '0px';

  // ── Edges (drawn under nodes) ─────────────────────────────────
  EDGES.forEach(e => {
    const [x1, y1, x2, y2] = edgeEndpoints(e.from, e.to);
    const opts = {
      roughness: 1.3, stroke: '#555', strokeWidth: 1.2, fill: 'none' as const, seed: 42,
      strokeLineDash: e.dashed ? [6, 4] : undefined,
    };
    rc.line(x1, y1, x2, y2, opts);
    drawArrowhead(ctx, x1, y1, x2, y2);
    if (e.label) {
      ctx.font = '9px monospace';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 6);
    }
  });

  // ── Nodes: shape → then label on top ─────────────────────────
  NODES.forEach(n => {
    const hov = hovered === n.id;
    const { cx, cy, w, h } = n;

    if      (n.shape === 'hexagon')  drawHexagon (ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'cloud')    drawCloud   (ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'double')   drawDouble  (ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'pentagon') drawPentagon(ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'diamond')  drawDiamond (ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'cylinder') drawCylinder(ctx, rc, cx, cy, w, h, hov);
    else if (n.shape === 'scroll')   drawScroll  (ctx, rc, cx, cy, w, h, hov);

    // Label drawn last — always on top
    drawLabel(ctx, cx, cy, n.label, n.sub, hov);
  });

  // ── Margin doodles ────────────────────────────────────────────
  const D = { roughness: 1.6, stroke: '#aaa', strokeWidth: 0.9, fill: 'none' as const, seed: 7 };

  // Entry point annotation
  ctx.font = '8px monospace';
  ctx.fillStyle = '#c0392b';
  ctx.textAlign = 'left';
  ctx.fillText('↓ entry point', 62, 62);

  // WiFi arcs near CDN
  [7, 11, 15].forEach((r, i) => {
    rc.arc(38, 142, r, r, Math.PI * 1.25, Math.PI * 1.75, false,
      { ...D, strokeWidth: 1.1 - i * 0.15, roughness: 0.9 });
  });
  ctx.font = '7px monospace';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('CDN', 38, 154);

  // Lightning bolt near gateway
  ctx.font = '13px monospace';
  ctx.fillStyle = '#e67e22';
  ctx.textAlign = 'left';
  ctx.fillText('⚡', 24, 255);

  // Microservices label
  ctx.font = '8px monospace';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('[ microservices ]', LW / 2, 308);

  // Gear near write service
  rc.circle(375, 318, 13, { ...D, roughness: 1.8 });
  [[375,311],[375,325],[368,318],[382,318]].forEach(([x,y]) =>
    rc.line(x-2, y, x+2, y, { ...D, strokeWidth: 0.7 })
  );

  // Cache miss note
  ctx.font = '8px monospace';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'right';
  ctx.fillText('cache miss →', 88, 404);

  // Pie chart near redis
  const pc = { ...D, roughness: 0.8 };
  rc.arc(52, 450, 20, 20, -Math.PI / 2, Math.PI * 0.85, true, { ...pc, fill: '#ddd', fillStyle: 'solid' as const });
  rc.arc(52, 450, 20, 20, Math.PI * 0.85, -Math.PI / 2, true, { ...pc, fill: '#faf7f2', fillStyle: 'solid' as const });
  rc.circle(52, 450, 20, pc);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  ctx.fillText('99%', 52, 453);

  // Clock near queue
  rc.circle(52, 555, 16, D);
  rc.line(52, 555, 52, 547, { ...D, strokeWidth: 1 });
  rc.line(52, 555, 58, 555, { ...D, strokeWidth: 1 });
  ctx.font = '7px monospace';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('async', 52, 574);

  // Bottom note
  ctx.font = '8px monospace';
  ctx.fillStyle = '#ccc';
  ctx.textAlign = 'center';
  ctx.fillText('— sketch your own on the canvas →', LW / 2, LH - 10);

  ctx.restore();
}

// ── Component ────────────────────────────────────────────────────
export default function AuthDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const scaleRef  = useRef(1);
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [scale, setScale]     = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const s = Math.min(rect.width / LW, rect.height / LH);
    setScale(s);
    scaleRef.current = s;

    canvas.width  = LW * s * dpr;
    canvas.height = LH * s * dpr;
    canvas.style.width  = `${LW * s}px`;
    canvas.style.height = `${LH * s}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    drawCanvas(canvas, hovered, s);
  }, [hovered]);

  useEffect(() => {
    const obs = new ResizeObserver(() => setHovered(p => p));
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const s = scaleRef.current;
    const rect = wrap.getBoundingClientRect();
    const offsetX = (rect.width  - LW * s) / 2;
    const offsetY = (rect.height - LH * s) / 2;
    const mx = (e.clientX - rect.left - offsetX) / s;
    const my = (e.clientY - rect.top  - offsetY) / s;
    const hit = NODES.find(n =>
      mx >= n.cx - n.w / 2 - 10 && mx <= n.cx + n.w / 2 + 10 &&
      my >= n.cy - n.h / 2 - 10 && my <= n.cy + n.h / 2 + 10
    );
    setHovered((hit?.id ?? null) as NodeId | null);
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: '#f5f0e8',
        backgroundImage:
          'linear-gradient(#d4c9b0 1px, transparent 1px),' +
          'linear-gradient(90deg, #d4c9b0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Red margin rule */}
      <div className="absolute inset-y-0 left-[48px] w-[1.5px] bg-red-400/40" />

      <div
        ref={wrapRef}
        className="absolute inset-0 flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <canvas ref={canvasRef} />

        {/* Invisible hover zones for CSS scale effect */}
        {NODES.map(n => (
          <div
            key={n.id}
            className="absolute pointer-events-none transition-transform duration-150 ease-out"
            style={{
              left:      `calc(50% + ${(n.cx - LW / 2 - n.w / 2) * scale}px)`,
              top:       `calc(50% + ${(n.cy - LH / 2 - n.h / 2) * scale}px)`,
              width:     `${n.w * scale}px`,
              height:    `${n.h * scale}px`,
              transform: hovered === n.id ? 'scale(1.07)' : 'scale(1)',
            }}
          />
        ))}

        {/* Sticky-note tooltip */}
        {hovered && (() => {
          const n = getNode(hovered);
          return (
            <div
              className="pointer-events-none absolute z-20 rounded border border-yellow-300 bg-yellow-100 px-3 py-1.5 shadow-md"
              style={{
                left:       `calc(50% + ${(n.cx - LW / 2) * scale}px)`,
                top:        `calc(50% + ${(n.cy - LH / 2 - n.h / 2 - 44) * scale}px)`,
                transform:  'translateX(-50%) rotate(-2deg)',
                fontFamily: 'monospace',
                fontSize:   '10px',
                color:      '#5a3e1b',
                whiteSpace: 'nowrap',
              }}
            >
              {n.tooltip}
            </div>
          );
        })()}
      </div>

      {/* Logo */}
      <div className="absolute left-16 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a]">
        <span className="text-xs font-bold text-yellow-400">s.</span>
      </div>

      {/* Tagline */}
      <p className="absolute bottom-6 left-16 z-10 text-2xl font-light leading-tight text-[#1a1a1a]">
        Design Systems.
        <br />
        <span className="font-bold">Master Interviews.</span>
      </p>
    </div>
  );
}
