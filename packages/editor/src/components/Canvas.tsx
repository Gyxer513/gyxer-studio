import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '../store/project-store';
import { useThemeStore } from '../store/theme-store';
import { EntityNode } from './EntityNode';
import { RelationEdge } from './RelationEdge';

const nodeTypes = { entity: EntityNode };
const edgeTypes = { relation: RelationEdge };

export function Canvas() {
  const {
    entities, relations,
    addRelation, updateEntity, selectEntity,
    selectRelation, clearSelection, removeRelation,
    selectedRelationId,
  } = useProjectStore();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

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
        type: 'relation',
        selected: rel.id === selectedRelationId,
        data: {
          relationType: rel.type,
          onDelete: rel.onDelete,
          relationId: rel.id,
        },
      })),
    [relations, selectedRelationId],
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
      const hasDragging = changes.some(
        (c) => c.type === 'position' && c.dragging,
      );
      if (hasDragging) {
        for (const change of changes) {
          if (change.type === 'position' && change.position && change.dragging) {
            updateEntity(change.id, { position: change.position });
          }
        }
      }
    },
    [updateEntity, selectEntity],
  );

  // Handle edge changes (selection)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'select' && change.selected) {
          selectRelation(change.id);
        }
      }
    },
    [selectRelation],
  );

  // Handle edge click — select relation
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      selectRelation(edge.id);
    },
    [selectRelation],
  );

  // Handle pane click — clear all selection
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle edge deletion via keyboard (Backspace/Delete)
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        removeRelation(edge.id);
      }
    },
    [removeRelation],
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
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50 dark:bg-dark-900"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color={isDark ? '#2a2a2a' : '#d4d4d4'} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
