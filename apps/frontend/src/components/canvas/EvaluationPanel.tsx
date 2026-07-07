'use client';

import type { EvaluationResult, EvaluationWarning, Prompt } from '@sds/shared-types';
import { NodeType } from '@sds/shared-types';

interface Props {
  result: EvaluationResult | null;
  isEvaluating: boolean;
  error: string | null;
  onEvaluate: () => void;
  prompt: Prompt | undefined;
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: '#991b1b',
  MEDIUM: '#b45309',
  LOW: '#555',
};

const NODE_ICON: Partial<Record<NodeType, string>> = {
  [NodeType.CLIENT]: '💻',
  [NodeType.API_GATEWAY]: '🔀',
  [NodeType.LOAD_BALANCER]: '⚖️',
  [NodeType.SERVICE]: '⚙️',
  [NodeType.CACHE]: '⚡',
  [NodeType.DATABASE]: '🗄️',
  [NodeType.QUEUE]: '📬',
  [NodeType.CDN]: '🌐',
  [NodeType.OBJECT_STORAGE]: '🪣',
  [NodeType.AUTH_SERVICE]: '🔐',
  [NodeType.SEARCH_SERVICE]: '🔍',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#166534';
  if (score >= 40) return '#b45309';
  return '#991b1b';
}

function WarningItem({ w }: { w: EvaluationWarning }) {
  return (
    <li className="flex gap-2 items-start py-1" style={{ borderBottom: '1px solid #ede8df' }}>
      <span
        className="text-[8px] font-mono tracking-widest mt-0.5 shrink-0"
        style={{ color: SEVERITY_COLOR[w.severity] ?? '#555' }}
      >
        {w.severity}
      </span>
      <span className="text-[10px] font-mono leading-relaxed" style={{ color: '#2a2a2a' }}>
        {w.message}
      </span>
    </li>
  );
}

function ComponentBreakdown({
  prompt,
  result,
}: {
  prompt: Prompt;
  result: EvaluationResult;
}) {
  const componentRoles = prompt.evaluationTemplate.componentRoles as Record<string, string> | undefined;
  if (!componentRoles) return null;

  // Collect the node types the user placed (from strengths codes like "HAS_CACHE")
  const placedTypes = new Set(
    result.strengths
      .map((s) => s.code.replace(/^HAS_/, ''))
  );

  const entries = Object.entries(componentRoles);
  if (entries.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid #d4c9b0' }}>
      <div
        className="px-3 py-1 text-[8px] font-mono tracking-widest uppercase"
        style={{ color: '#b00' }}
      >
        Component Roles
      </div>
      <div className="flex flex-col gap-0 pb-2">
        {entries.map(([nodeType, role]) => {
          const placed = placedTypes.has(nodeType);
          return (
            <div
              key={nodeType}
              className="mx-2 mb-1 px-2 py-1.5 rounded-sm"
              style={{
                backgroundColor: placed ? '#f0ece4' : '#f5f2ed',
                border: `1px solid ${placed ? '#c9b99a' : '#ddd8cc'}`,
                opacity: placed ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs leading-none">
                  {NODE_ICON[nodeType as NodeType] ?? '▪'}
                </span>
                <span
                  className="text-[9px] font-mono tracking-widest uppercase"
                  style={{ color: placed ? '#1a1a1a' : '#888' }}
                >
                  {nodeType.replace(/_/g, ' ')}
                </span>
                {!placed && (
                  <span
                    className="ml-auto text-[7px] font-mono tracking-widest px-1 py-px"
                    style={{ color: '#b45309', border: '1px solid #b45309' }}
                  >
                    MISSING
                  </span>
                )}
              </div>
              <p
                className="text-[9px] font-mono leading-relaxed"
                style={{ color: placed ? '#444' : '#999' }}
              >
                {role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EvaluationPanel({ result, isEvaluating, error, onEvaluate, prompt }: Props) {
  return (
    <div
      className="absolute right-4 top-4 z-10 flex flex-col rounded-sm overflow-hidden"
      style={{
        backgroundColor: '#faf7f2',
        border: '1px solid #c9b99a',
        boxShadow: '2px 2px 0 #c9b99a',
        width: 220,
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Header + evaluate button */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{ borderBottom: '1px solid #d4c9b0' }}
      >
        <span
          className="text-[9px] tracking-widest uppercase"
          style={{ color: '#b00', fontFamily: 'monospace' }}
        >
          Evaluation
        </span>
        <button
          onClick={onEvaluate}
          disabled={isEvaluating}
          className="text-[9px] font-mono tracking-widest px-2 py-0.5 transition"
          style={{
            border: '1px solid #c9b99a',
            color: isEvaluating ? '#aaa' : '#1a1a1a',
            backgroundColor: 'transparent',
            cursor: isEvaluating ? 'not-allowed' : 'pointer',
          }}
        >
          {isEvaluating ? 'evaluating…' : 'EVALUATE'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-3 py-2 text-[10px] font-mono" style={{ color: '#991b1b' }}>
          {error}
        </div>
      )}

      {/* No result yet */}
      {!result && !error && !isEvaluating && (
        <div
          className="px-3 py-3 text-[9px] font-mono tracking-wide text-center"
          style={{ color: '#1a1a1a55' }}
        >
          Click EVALUATE to analyse your diagram.
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="overflow-y-auto flex flex-col" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {/* Score */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid #d4c9b0' }}
          >
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: '#777' }}>
              Score
            </span>
            <span
              className="text-xl font-mono font-bold"
              style={{ color: scoreColor(result.score) }}
            >
              {Math.round(result.score)}
            </span>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div style={{ borderBottom: '1px solid #d4c9b0' }}>
              <div
                className="px-3 py-1 text-[8px] font-mono tracking-widest uppercase"
                style={{ color: '#166534' }}
              >
                Strengths
              </div>
              <ul className="px-3 pb-1">
                {result.strengths.map((s) => (
                  <li
                    key={s.code}
                    className="text-[10px] font-mono py-0.5 leading-relaxed"
                    style={{ color: '#166534' }}
                  >
                    ✓ {s.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div style={{ borderBottom: '1px solid #d4c9b0' }}>
              <div
                className="px-3 py-1 text-[8px] font-mono tracking-widest uppercase"
                style={{ color: '#991b1b' }}
              >
                Warnings
              </div>
              <ul className="px-3 pb-2">
                {result.warnings.map((w) => (
                  <WarningItem key={w.code} w={w} />
                ))}
              </ul>
            </div>
          )}

          {/* All clear */}
          {result.warnings.length === 0 && (
            <div
              className="px-3 py-2 text-[10px] font-mono text-center"
              style={{ color: '#166534', borderBottom: '1px solid #d4c9b0' }}
            >
              No issues found. Well designed!
            </div>
          )}

          {/* Component Breakdown */}
          {prompt && <ComponentBreakdown prompt={prompt} result={result} />}
        </div>
      )}
    </div>
  );
}
