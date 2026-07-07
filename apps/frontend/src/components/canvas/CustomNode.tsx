'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeType } from '@sds/shared-types';

// Handles are invisible by default; they appear only when the node is selected.
// The opacity trick keeps them interactive (React Flow needs them in the DOM for
// connection hit-testing) while hiding them visually until needed.
function handleStyle(selected: boolean): React.CSSProperties {
  return {
    background: '#2563eb',
    border: '2px solid #fff',
    borderRadius: '50%',
    width: 10,
    height: 10,
    opacity: selected ? 1 : 0,
    transition: 'opacity 0.15s ease',
    zIndex: 10,
  };
}

const NODE_CONFIG: Record<NodeType, { icon: string; accent: string }> = {
  [NodeType.CLIENT]:         { icon: '💻', accent: '#2563eb' },
  [NodeType.API_GATEWAY]:    { icon: '🔀', accent: '#7c3aed' },
  [NodeType.LOAD_BALANCER]:  { icon: '⚖️',  accent: '#b45309' },
  [NodeType.SERVICE]:        { icon: '⚙️',  accent: '#065f46' },
  [NodeType.CACHE]:          { icon: '⚡',  accent: '#b45309' },
  [NodeType.DATABASE]:       { icon: '🗄️',  accent: '#991b1b' },
  [NodeType.QUEUE]:          { icon: '📬',  accent: '#c2410c' },
  [NodeType.CDN]:            { icon: '🌐',  accent: '#0369a1' },
  [NodeType.OBJECT_STORAGE]: { icon: '🪣',  accent: '#475569' },
  [NodeType.AUTH_SERVICE]:   { icon: '🔐',  accent: '#6d28d9' },
  [NodeType.SEARCH_SERVICE]: { icon: '🔍',  accent: '#166534' },
};

interface CustomNodeProps {
  data: { label: string; nodeType: NodeType };
  selected: boolean;
}

function CustomNodeComponent({ data, selected }: CustomNodeProps) {
  const config = NODE_CONFIG[data.nodeType] ?? { icon: '□', accent: '#555' };
  const hs = handleStyle(selected);

  return (
    <div
      style={{
        backgroundColor: '#faf7f2',
        border: `1.5px solid ${selected ? config.accent : '#c9b99a'}`,
        borderRadius: 3,
        padding: '6px 10px',
        minWidth: 100,
        fontFamily: 'monospace',
        boxShadow: selected
          ? `2px 2px 0 ${config.accent}`
          : '1px 1px 0 #c9b99a',
      }}
    >
      {/* Handles: hidden when not selected, shown as blue dots when selected */}
      <Handle id="top"    type="source" position={Position.Top}    style={hs} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hs} />
      <Handle id="left"   type="source" position={Position.Left}   style={hs} />
      <Handle id="right"  type="source" position={Position.Right}  style={hs} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>{config.icon}</span>
        <span style={{ fontSize: 11, color: '#1a1a1a', letterSpacing: '0.04em' }}>
          {data.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 9,
          marginTop: 2,
          letterSpacing: '0.08em',
          color: config.accent,
          textTransform: 'uppercase',
        }}
      >
        {data.nodeType.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
