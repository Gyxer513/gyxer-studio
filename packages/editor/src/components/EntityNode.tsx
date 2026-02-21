import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useProjectStore, type FieldData } from '../store/project-store';
import { useTranslation } from '../i18n';

const FIELD_TYPE_ICONS: Record<string, string> = {
  string: 'Aa',
  text: 'Tx',
  int: '#',
  float: '#.',
  boolean: '?',
  datetime: 'Dt',
  enum: 'E',
  json: '{}',
  uuid: 'Id',
};

interface EntityNodeData {
  entityId: string;
  label: string;
  fields: FieldData[];
}

export function EntityNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EntityNodeData;
  const { selectEntity, removeEntity, addField } = useProjectStore();
  const { t } = useTranslation();

  const handleSelect = useCallback(() => {
    selectEntity(nodeData.entityId);
  }, [nodeData.entityId, selectEntity]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeEntity(nodeData.entityId);
    },
    [nodeData.entityId, removeEntity],
  );

  const handleAddField = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addField(nodeData.entityId);
    },
    [nodeData.entityId, addField],
  );

  return (
    <div
      className={`bg-white border-2 rounded-lg min-w-[220px] cursor-pointer transition-shadow ${
        selected ? 'border-gyxer-600 shadow-lg' : 'border-gray-200 shadow-md'
      }`}
      onClick={handleSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gyxer-600 rounded-t-md">
        <span className="text-white font-semibold text-sm">{nodeData.label}</span>
        <button
          onClick={handleRemove}
          className="text-white/70 hover:text-white text-xs ml-2"
          title={t('node.remove')}
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div className="px-1 py-1">
        {/* Auto id field */}
        <div className="flex items-center px-2 py-1 text-xs text-gray-400">
          <span className="w-6 text-center font-mono">Id</span>
          <span className="ml-1">id</span>
          <span className="ml-auto text-gray-300">PK auto</span>
        </div>

        {nodeData.fields.map((field: FieldData, i: number) => (
          <div
            key={i}
            className="flex items-center px-2 py-1 text-xs hover:bg-gray-50 rounded"
          >
            <span className="w-6 text-center font-mono text-gyxer-600 font-bold">
              {FIELD_TYPE_ICONS[field.type] || '?'}
            </span>
            <span className="ml-1 text-gray-800">{field.name}</span>
            <div className="ml-auto flex gap-1 text-gray-400">
              {field.required && <span title="required">*</span>}
              {field.unique && <span title="unique">U</span>}
              {field.index && <span title="indexed">I</span>}
            </div>
          </div>
        ))}

        {/* Add field button */}
        <button
          onClick={handleAddField}
          className="w-full text-xs text-gray-400 hover:text-gyxer-600 hover:bg-gray-50 py-1 rounded mt-1 transition-colors"
        >
          {t('node.addField')}
        </button>
      </div>

      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!bg-gyxer-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-gyxer-500 !w-3 !h-3" />
    </div>
  );
}
