'use client';

import { NodeType } from '@sds/shared-types';
import { useDiagramStore } from '@/store/diagramStore';

const PALETTE_ITEMS: { type: NodeType; label: string; icon: string }[] = [
  { type: NodeType.CLIENT,         label: 'Client',         icon: '💻' },
  { type: NodeType.API_GATEWAY,    label: 'API Gateway',    icon: '🔀' },
  { type: NodeType.LOAD_BALANCER,  label: 'Load Balancer',  icon: '⚖️'  },
  { type: NodeType.SERVICE,        label: 'Service',        icon: '⚙️'  },
  { type: NodeType.CACHE,          label: 'Cache',          icon: '⚡'  },
  { type: NodeType.DATABASE,       label: 'Database',       icon: '🗄️'  },
  { type: NodeType.QUEUE,          label: 'Queue',          icon: '📬'  },
  { type: NodeType.CDN,            label: 'CDN',            icon: '🌐'  },
  { type: NodeType.OBJECT_STORAGE, label: 'Object Storage', icon: '🪣'  },
  { type: NodeType.AUTH_SERVICE,   label: 'Auth Service',   icon: '🔐'  },
  { type: NodeType.SEARCH_SERVICE, label: 'Search',         icon: '🔍'  },
];

function onDragStart(e: React.DragEvent, nodeType: NodeType) {
  e.dataTransfer.setData('application/sds-node-type', nodeType);
  e.dataTransfer.effectAllowed = 'move';
}

export function NodePalette() {
  const { addNode, nodes } = useDiagramStore();

  function handleClick(nodeType: NodeType) {
    // Stagger new nodes so they don't stack on top of each other
    const offset = nodes.length * 20;
    addNode({
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 260 + offset, y: 100 + offset },
      data: { label: nodeType.replace(/_/g, ' ') },
    });
  }

  return (
    <div
      className="absolute left-4 top-4 z-10 flex flex-col rounded-sm overflow-hidden"
      style={{
        backgroundColor: '#faf7f2',
        border: '1px solid #c9b99a',
        boxShadow: '2px 2px 0 #c9b99a',
        width: 148,
      }}
    >
      <div
        className="px-2.5 py-1.5 text-[9px] tracking-widest uppercase"
        style={{ color: '#b00', borderBottom: '1px solid #d4c9b0', fontFamily: 'monospace' }}
      >
        Components
      </div>
      <div className="flex flex-col py-1">
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            onClick={() => handleClick(item.type)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs cursor-pointer select-none transition-colors"
            style={{ fontFamily: 'monospace', color: '#2a2a2a' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ede8df')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="text-sm leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
