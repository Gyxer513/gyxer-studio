import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
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
  const { entities, relations, addRelation, updateEntity } = useProjectStore();

  // Convert store entities → React Flow nodes
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
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: '#6b7280' },
      })),
    [relations],
  );

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Sync nodes from store when entities change
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // Handle new connection (create relation)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        addRelation(connection.source, connection.target);
      }
    },
    [addRelation],
  );

  // Handle node drag end (update position in store)
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateEntity(node.id, { position: node.position });
    },
    [updateEntity],
  );

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <Controls />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white"
        />
      </ReactFlow>
    </div>
  );
}
