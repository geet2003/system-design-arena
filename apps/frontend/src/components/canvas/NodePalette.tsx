'use client';

import { useMemo } from 'react';
import { NodeType } from '@sds/shared-types';
import { useDiagramStore } from '@/store/diagramStore';

// Icon and label for every NodeType value
const NODE_META: Record<string, { label: string; icon: string }> = {
  CLIENT:                 { label: 'Client',                icon: '💻' },
  LOAD_BALANCER:          { label: 'Load Balancer',          icon: '⚖️'  },
  API_GATEWAY:            { label: 'API Gateway',            icon: '🔀' },
  SERVICE:                { label: 'Service',                icon: '⚙️'  },
  CACHE:                  { label: 'Cache',                  icon: '⚡' },
  DATABASE:               { label: 'Database',               icon: '🗄️'  },
  QUEUE:                  { label: 'Message Queue',          icon: '📬' },
  CDN:                    { label: 'CDN',                    icon: '🌐' },
  OBJECT_STORAGE:         { label: 'Object Storage',         icon: '🪣'  },
  AUTH_SERVICE:           { label: 'Auth Service',           icon: '🔐' },
  SEARCH_SERVICE:         { label: 'Search Service',         icon: '🔍' },
  RELATIONAL_DB:          { label: 'Relational DB',          icon: '🗃️'  },
  NON_RELATIONAL_DB:      { label: 'Non-Relational DB',      icon: '📦' },
  REDIS_CACHE:            { label: 'Redis Cache',            icon: '⚡' },
  URL_WRITE_SERVICE:      { label: 'URL Write Service',      icon: '✏️'  },
  URL_READ_SERVICE:       { label: 'URL Read Service',       icon: '📖' },
  ID_GENERATOR:           { label: 'ID Generator',           icon: '🔢' },
  ANALYTICS_SERVICE:      { label: 'Analytics Service',      icon: '📊' },
  RATE_LIMITER_SERVICE:   { label: 'Rate Limiter',           icon: '🚦' },
  APP_SERVICE:            { label: 'App Service',            icon: '⚙️'  },
  POST_SERVICE:           { label: 'Post Service',           icon: '📝' },
  FEED_SERVICE:           { label: 'Feed Service',           icon: '📰' },
  USER_SERVICE:           { label: 'User Service',           icon: '👤' },
  MEDIA_SERVICE:          { label: 'Media Service',          icon: '🖼️'  },
  TIMELINE_WORKER:        { label: 'Timeline Worker',        icon: '⏱️'  },
  UPLOAD_SERVICE:         { label: 'Upload Service',         icon: '⬆️'  },
  STREAMING_SERVICE:      { label: 'Streaming Service',      icon: '▶️'  },
  METADATA_SERVICE:       { label: 'Metadata Service',       icon: '🏷️'  },
  RECOMMENDATION_SERVICE: { label: 'Recommendation Service', icon: '✨' },
  TRANSCODING_SERVICE:    { label: 'Transcoding Service',    icon: '🎞️'  },
  THUMBNAIL_SERVICE:      { label: 'Thumbnail Service',      icon: '🖼️'  },
  LOCATION_SERVICE:       { label: 'Location Service',       icon: '📍' },
  MATCHING_SERVICE:       { label: 'Matching Service',       icon: '🔗' },
  TRIP_SERVICE:           { label: 'Trip Service',           icon: '🚗' },
  PAYMENT_SERVICE:        { label: 'Payment Service',        icon: '💳' },
  NOTIFICATION_SERVICE:   { label: 'Notification Service',   icon: '🔔' },
  CHAT_SERVICE:           { label: 'Chat Service',           icon: '💬' },
  PRESENCE_SERVICE:       { label: 'Presence Service',       icon: '🟢' },
};

function onDragStart(e: React.DragEvent, nodeType: string) {
  e.dataTransfer.setData('application/sds-node-type', nodeType);
  e.dataTransfer.effectAllowed = 'move';
}

interface NodePaletteProps {
  availableNodeTypes?: string[];
  distractorNodeTypes?: string[];
}

function PaletteRow({ type, onClick }: { type: string; onClick: () => void }) {
  const meta = NODE_META[type] ?? { label: type.replace(/_/g, ' '), icon: '◻️' };
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1 text-xs cursor-pointer select-none"
      style={{ fontFamily: 'monospace', color: '#2a2a2a' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ede8df')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span className="text-sm leading-none">{meta.icon}</span>
      <span>{meta.label}</span>
    </div>
  );
}

export function NodePalette({ availableNodeTypes, distractorNodeTypes }: NodePaletteProps) {
  const { addNode, nodes } = useDiagramStore();

  function handleClick(nodeType: string) {
    const offset = nodes.length * 20;
    addNode({
      id: `${nodeType}-${Date.now()}`,
      type: nodeType as NodeType,
      position: { x: 260 + offset, y: 100 + offset },
      data: { label: NODE_META[nodeType]?.label ?? nodeType.replace(/_/g, ' ') },
    });
  }

  const allTypes = useMemo(() => {
    const combined = [...(availableNodeTypes ?? []), ...(distractorNodeTypes ?? [])];
    // Fisher-Yates shuffle — stable per session mount (no re-shuffle on re-render)
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute left-4 top-4 z-10 flex flex-col rounded-sm overflow-hidden"
      style={{
        backgroundColor: '#faf7f2',
        border: '1px solid #c9b99a',
        boxShadow: '2px 2px 0 #c9b99a',
        width: 168,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
      }}
    >
      <div
        className="px-2.5 py-1.5 text-[9px] tracking-widest uppercase shrink-0"
        style={{ color: '#b00', borderBottom: '1px solid #d4c9b0', fontFamily: 'monospace' }}
      >
        Components
      </div>
      <div className="flex flex-col py-1">
        {allTypes.map((type) => (
          <PaletteRow key={type} type={type} onClick={() => handleClick(type)} />
        ))}
      </div>
    </div>
  );
}
