'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

export interface RubricScores {
  scalability: number;
  reliability: number;
  correctness: number;
  depth: number;
  overall: number;
  evidence: string[];
  missed: string[];
}

interface Props {
  scores: RubricScores;
}

const DIMENSION_LABELS: Record<string, string> = {
  scalability: 'SCALABILITY',
  reliability: 'RELIABILITY',
  correctness: 'CORRECTNESS',
  depth: 'DEPTH',
};

function scoreColor(score: number): string {
  if (score >= 75) return '#166534';
  if (score >= 50) return '#b45309';
  return '#991b1b';
}

export function AIFeedbackCard({ scores }: Props) {
  const radarData = [
    { dimension: 'SCALE', value: scores.scalability },
    { dimension: 'RELIABILITY', value: scores.reliability },
    { dimension: 'CORRECTNESS', value: scores.correctness },
    { dimension: 'DEPTH', value: scores.depth },
  ];

  const dimensionScores = [
    { key: 'scalability', score: scores.scalability },
    { key: 'reliability', score: scores.reliability },
    { key: 'correctness', score: scores.correctness },
    { key: 'depth', score: scores.depth },
  ];

  return (
    <div
      className="flex flex-col gap-4 p-4 overflow-y-auto h-full"
      style={{ fontFamily: 'monospace' }}
    >
      {/* Overall score */}
      <div className="text-center">
        <p className="text-[9px] tracking-widest text-[#888] mb-1">OVERALL SCORE</p>
        <p
          className="text-4xl font-bold"
          style={{ color: scoreColor(scores.overall) }}
        >
          {scores.overall}
        </p>
        <p className="text-[9px] text-[#aaa]">/ 100</p>
      </div>

      {/* Radar chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#d4c9b0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.06em',
                fill: '#888',
              }}
            />
            <Radar
              dataKey="value"
              stroke="#1a1a1a"
              fill="#1a1a1a"
              fillOpacity={0.12}
              dot={{ fill: '#1a1a1a', r: 3 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-dimension scores */}
      <div className="grid grid-cols-2 gap-2">
        {dimensionScores.map(({ key, score }) => (
          <div
            key={key}
            className="px-3 py-2"
            style={{
              border: '1.5px solid #c9b99a',
              backgroundColor: '#faf7f2',
              borderRadius: '2px',
            }}
          >
            <p className="text-[8px] tracking-widest text-[#888] mb-0.5">
              {DIMENSION_LABELS[key]}
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: scoreColor(score) }}
            >
              {score}
            </p>
          </div>
        ))}
      </div>

      {/* Evidence / Strengths */}
      <div>
        <p className="text-[9px] font-bold tracking-widest text-[#166534] mb-2">
          ✓ STRENGTHS
        </p>
        {scores.evidence.length > 0 ? (
          <ul className="space-y-1">
            {scores.evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#166534] mt-0.5 shrink-0">·</span>
                <span className="text-[10px] text-[#1a1a1a] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-[#aaa] font-mono">None identified.</p>
        )}
      </div>

      {/* Missed */}
      {scores.missed.length > 0 && (
        <div>
          <p className="text-[9px] font-bold tracking-widest text-[#991b1b] mb-2">
            ✗ GAPS
          </p>
          <ul className="space-y-1">
            {scores.missed.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#991b1b] mt-0.5 shrink-0">·</span>
                <span className="text-[10px] text-[#1a1a1a] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
