'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

interface FreeNodeData {
  label: string;
  isNew?: boolean; // true on first render → auto-focus the input
}

interface FreeNodeProps {
  id: string;
  data: FreeNodeData;
  selected: boolean;
}

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

function FreeNodeComponent({ id, data, selected }: FreeNodeProps) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(data.isNew ?? false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) {
      updateNodeData(id, { label: trimmed, isNew: false });
    } else {
      // revert if empty
      setDraft(data.label);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(data.label);
      setEditing(false);
    }
    // Prevent ReactFlow from capturing delete key while typing
    e.stopPropagation();
  }

  const hs = handleStyle(selected);

  return (
    <div
      onDoubleClick={() => { setDraft(data.label); setEditing(true); }}
      style={{
        backgroundColor: '#faf7f2',
        border: `1.5px solid ${selected ? '#1a1a1a' : '#c9b99a'}`,
        borderRadius: 3,
        padding: '6px 10px',
        minWidth: 110,
        fontFamily: 'monospace',
        cursor: editing ? 'text' : 'grab',
        boxShadow: selected ? '2px 2px 0 #1a1a1a' : '1px 1px 0 #c9b99a',
        userSelect: 'none',
      }}
    >
      <Handle id="top"    type="source" position={Position.Top}    style={hs} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hs} />
      <Handle id="left"   type="source" position={Position.Left}   style={hs} />
      <Handle id="right"  type="source" position={Position.Right}  style={hs} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: '#1a1a1a',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: Math.max(80, draft.length * 7),
            padding: 0,
          }}
        />
      ) : (
        <span style={{ fontSize: 11, color: '#1a1a1a', letterSpacing: '0.04em' }}>
          {data.label || <span style={{ color: '#aaa' }}>untitled</span>}
        </span>
      )}
    </div>
  );
}

export const FreeNode = memo(FreeNodeComponent);
