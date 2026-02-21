import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type NodeChange,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '../store/project-store';
import { EntityNode } from './EntityNode';

const nodeTypes = { entity: EntityNode };

export function Canvas() {
  const { entities, relations, addRelation, updateEntity, selectEntity } = useProjectStore();

  // Convert store entities → React Flow nodes (single source of truth)
  const nodes: Node[] = useMemo(
    () =>
      entities.map((entity) => ({
        id: entity.id,
        type: 'entity',
        position: entity.position,
        data: {
          entityId: entity.id,
          label: entity.name,
          fields: entity.fields,
        },
      })),
    [entities],
  );

  // Convert store relations → React Flow edges
  const edges: Edge[] = useMemo(
    () =>
      relations.map((rel) => ({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        label: `${rel.type}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#525252', strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: '#737373', fontFamily: 'Inter, sans-serif' },
        labelBgStyle: { fill: '#f8f9fa', fillOpacity: 0.9 },
      })),
    [relations],
  );

  // Handle React Flow node changes (drag, select, etc.) — apply directly to Zustand store
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // For position changes during drag, update Zustand store
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Drag ended — persist position
          updateEntity(change.id, { position: change.position });
        }
        if (change.type === 'select' && change.selected) {
          selectEntity(change.id);
        }
      }

      // For smooth dragging, apply intermediate position changes locally
      // We compute and let React Flow handle it through the controlled nodes
      const hasDragging = changes.some(
        (c) => c.type === 'position' && c.dragging,
      );
      if (hasDragging) {
        // Apply drag changes via the store for real-time feedback
        for (const change of changes) {
          if (change.type === 'position' && change.position && change.dragging) {
            updateEntity(change.id, { position: change.position });
          }
        }
      }
    },
    [updateEntity, selectEntity],
  );

  // Handle new connection (create relation)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        addRelation(connection.source, connection.target);
      }
    },
    [addRelation],
  );

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d4d4d4" />
        <Controls />
        <MiniMap
          nodeColor="#C8232C"
          maskColor="rgba(0, 0, 0, 0.06)"
          className="!bg-white"
        />
      </ReactFlow>
    </div>
  );
}
