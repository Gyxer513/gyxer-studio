import React, { useState } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import { useProjectStore, type RelationType } from '../store/project-store';
import { useThemeStore } from '../store/theme-store';

type RelationEdgeData = {
  relationType: RelationType;
  onDelete: string;
  relationId: string;
};

type RelationEdgeType = Edge<RelationEdgeData, 'relation'>;

const RELATION_LABELS: Record<RelationType, string> = {
  'one-to-one': '1 — 1',
  'one-to-many': '1 — N',
  'many-to-many': 'N — M',
};

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationEdgeType>) {
  const [hovered, setHovered] = useState(false);
  const removeRelation = useProjectStore((s) => s.removeRelation);
  const isDark = useThemeStore((s) => s.theme) === 'dark';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = selected || hovered;
  const relationType = data?.relationType || 'one-to-many';
  const label = RELATION_LABELS[relationType] || '1 — N';

  return (
    <>
      {/* Invisible wider path for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke={isActive ? '#C8232C' : isDark ? '#6b6b6b' : '#525252'}
        strokeWidth={isActive ? 2.5 : 2}
        className="react-flow__edge-path transition-colors"
        style={{ pointerEvents: 'none' }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono transition-all ${
              isActive
                ? 'bg-gyxer-50 dark:bg-gyxer-900/40 text-gyxer-700 dark:text-gyxer-300 border border-gyxer-200 dark:border-gyxer-800 shadow-sm'
                : 'bg-white/90 dark:bg-dark-800/90 text-dark-400 dark:text-dark-300 border border-gray-200 dark:border-dark-600'
            }`}
          >
            <span className="font-semibold tracking-wide">{label}</span>
            {hovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRelation(id);
                }}
                className="w-4 h-4 flex items-center justify-center text-dark-300 hover:text-gyxer-600 dark:hover:text-gyxer-400 hover:bg-gyxer-100 dark:hover:bg-gyxer-900/40 rounded transition-colors text-[10px] leading-none"
                title="Delete relation"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
