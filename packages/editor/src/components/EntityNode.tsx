import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useProjectStore, type FieldData } from '../store/project-store';
import { useTranslation } from '../i18n';

const FIELD_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  string: { icon: 'Aa', color: '#C8232C' },
  text: { icon: 'Tx', color: '#C8232C' },
  int: { icon: '#', color: '#2563eb' },
  float: { icon: '#.', color: '#2563eb' },
  boolean: { icon: '?', color: '#16a34a' },
  datetime: { icon: 'Dt', color: '#9333ea' },
  enum: { icon: 'E', color: '#ea580c' },
  json: { icon: '{}', color: '#525252' },
  uuid: { icon: 'Id', color: '#0891b2' },
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
      className={`bg-white dark:bg-dark-800 rounded-xl min-w-[240px] cursor-pointer transition-all ${
        selected
          ? 'shadow-card-hover ring-2 ring-gyxer-500'
          : 'shadow-card hover:shadow-card-hover dark:shadow-none dark:border dark:border-dark-600 dark:hover:border-dark-500'
      }`}
      onClick={handleSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-dark-800 dark:bg-dark-700 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gyxer-500" />
          <span className="text-white font-semibold text-sm tracking-wide">{nodeData.label}</span>
        </div>
        <button
          onClick={handleRemove}
          className="text-dark-400 hover:text-white text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-dark-600 dark:hover:bg-dark-500 transition-colors"
          title={t('node.remove')}
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div className="px-1.5 py-1.5">
        {/* Auto id field */}
        <div className="flex items-center px-2 py-1.5 text-xs text-dark-300 dark:text-dark-400">
          <span className="w-7 text-center font-mono font-bold text-dark-200 dark:text-dark-500">Id</span>
          <span className="ml-1 font-mono">id</span>
          <span className="ml-auto text-dark-200 dark:text-dark-400 text-[10px] bg-dark-50 dark:bg-dark-700 px-1.5 py-0.5 rounded">PK auto</span>
        </div>

        {nodeData.fields.map((field: FieldData, i: number) => {
          const typeInfo = FIELD_TYPE_ICONS[field.type] || { icon: '?', color: '#666' };
          return (
            <div
              key={i}
              className="flex items-center px-2 py-1.5 text-xs hover:bg-dark-50 dark:hover:bg-dark-700 rounded-md transition-colors"
            >
              <span
                className="w-7 text-center font-mono font-bold text-[11px]"
                style={{ color: typeInfo.color }}
              >
                {typeInfo.icon}
              </span>
              <span className="ml-1 text-dark-700 dark:text-dark-200 font-mono">{field.name}</span>
              <div className="ml-auto flex gap-1.5 text-dark-300">
                {field.required && (
                  <span className="text-gyxer-400 font-bold" title="required">*</span>
                )}
                {field.unique && (
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 px-1 rounded text-[10px] font-medium" title="unique">U</span>
                )}
                {field.index && (
                  <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1 rounded text-[10px] font-medium" title="indexed">I</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add field button */}
        <button
          onClick={handleAddField}
          className="w-full text-xs text-dark-300 dark:text-dark-400 hover:text-gyxer-600 dark:hover:text-gyxer-400 hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 py-1.5 rounded-md mt-1 transition-all font-medium"
        >
          {t('node.addField')}
        </button>
      </div>

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gyxer-500 !w-3 !h-3 !border-2 !border-white dark:!border-dark-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-dark-700 dark:!bg-dark-400 !w-3 !h-3 !border-2 !border-white dark:!border-dark-800"
      />
    </div>
  );
}
