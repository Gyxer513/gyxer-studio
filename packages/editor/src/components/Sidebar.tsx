import React from 'react';
import { useProjectStore, type FieldType, type RelationType } from '../store/project-store';
import { useTranslation } from '../i18n';

const FIELD_TYPES: FieldType[] = [
  'string', 'text', 'int', 'float', 'boolean', 'datetime', 'enum', 'json', 'uuid',
];

const RELATION_TYPES: RelationType[] = ['one-to-one', 'one-to-many', 'many-to-many'];
const ON_DELETE_OPTIONS = ['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION'] as const;

export function Sidebar() {
  const {
    entities, relations,
    selectedEntityId, selectedRelationId,
    settings, modules,
    updateEntity, updateField, removeField, addField,
    updateRelation, removeRelation,
    updateSettings, toggleModule,
  } = useProjectStore();
  const { t } = useTranslation();

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);
  const selectedRelation = relations.find((r) => r.id === selectedRelationId);

  // Find source/target entity names for relation display
  const sourceEntity = selectedRelation
    ? entities.find((e) => e.id === selectedRelation.sourceEntityId)
    : null;
  const targetEntity = selectedRelation
    ? entities.find((e) => e.id === selectedRelation.targetEntityId)
    : null;

  return (
    <div className="w-80 bg-white border-l border-gray-200/80 h-full overflow-y-auto flex flex-col">
      {/* ─── Project Settings ─── */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-3">
          {t('sidebar.project')}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-dark-400 font-medium mb-1 block">{t('sidebar.projectName')}</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 font-medium mb-1 block">{t('sidebar.port')}</label>
              <input
                type="number"
                value={settings.port}
                onChange={(e) => updateSettings({ port: parseInt(e.target.value) || 3000 })}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-dark-400 font-medium mb-1 block">{t('sidebar.database')}</label>
              <select
                value={settings.database}
                onChange={(e) => updateSettings({ database: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
            {[
              { key: 'enableSwagger', label: 'Swagger' },
              { key: 'enableHelmet', label: 'Helmet' },
              { key: 'enableRateLimit', label: 'Rate Limit' },
              { key: 'docker', label: 'Docker' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 text-xs text-dark-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings as any)[key]}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="rounded border-gray-300 text-gyxer-500 focus:ring-gyxer-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Modules ─── */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-3">
          {t('sidebar.modules')}
        </h2>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={modules.authJwt}
            onChange={(e) => toggleModule('authJwt', e.target.checked)}
            className="rounded border-gray-300 text-gyxer-500 focus:ring-gyxer-500"
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 rounded flex items-center justify-center text-xs">🔐</span>
            <span className="text-sm text-dark-600 group-hover:text-dark-800 transition-colors">
              {t('sidebar.authJwt')}
            </span>
          </div>
        </label>
      </div>

      {/* ─── Selected Relation ─── */}
      {selectedRelation ? (
        <div className="p-4 flex-1">
          <h2 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-3">
            {t('sidebar.relation')}
          </h2>

          {/* Source → Target */}
          <div className="mb-4 p-2.5 bg-dark-50/70 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-dark-700">{sourceEntity?.name || '?'}</span>
              <span className="text-dark-300">→</span>
              <span className="font-semibold text-dark-700">{targetEntity?.name || '?'}</span>
            </div>
          </div>

          {/* Relation Type */}
          <div className="mb-3">
            <label className="text-xs text-dark-400 font-medium mb-1 block">
              {t('sidebar.relationType')}
            </label>
            <select
              value={selectedRelation.type}
              onChange={(e) => updateRelation(selectedRelation.id, { type: e.target.value as RelationType })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50"
            >
              {RELATION_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {t(`relation.${rt === 'one-to-one' ? 'oneToOne' : rt === 'one-to-many' ? 'oneToMany' : 'manyToMany'}` as any)} — {rt}
                </option>
              ))}
            </select>
          </div>

          {/* onDelete */}
          <div className="mb-3">
            <label className="text-xs text-dark-400 font-medium mb-1 block">
              {t('sidebar.relationOnDelete')}
            </label>
            <select
              value={selectedRelation.onDelete}
              onChange={(e) => updateRelation(selectedRelation.id, { onDelete: e.target.value as any })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50 font-mono"
            >
              {ON_DELETE_OPTIONS.map((od) => (
                <option key={od} value={od}>
                  {t(`onDelete.${od}` as any)}
                </option>
              ))}
            </select>
          </div>

          {/* Foreign Key */}
          <div className="mb-4">
            <label className="text-xs text-dark-400 font-medium mb-1 block">
              {t('sidebar.relationForeignKey')}
            </label>
            <input
              type="text"
              value={selectedRelation.foreignKey || ''}
              onChange={(e) => updateRelation(selectedRelation.id, { foreignKey: e.target.value || undefined })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-dark-50/50 font-mono"
              placeholder={`${(targetEntity?.name || 'target').toLowerCase()}Id`}
            />
          </div>

          {/* Delete Relation */}
          <button
            onClick={() => removeRelation(selectedRelation.id)}
            className="w-full py-2 border border-gyxer-200 text-gyxer-600 rounded-lg text-xs font-medium hover:bg-gyxer-50 hover:border-gyxer-400 transition-all"
          >
            {t('sidebar.deleteRelation')}
          </button>
        </div>
      ) : selectedEntity ? (
        /* ─── Selected Entity ─── */
        <div className="p-4 flex-1">
          <h2 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-3">
            {t('sidebar.entity')}
          </h2>

          <div className="mb-4">
            <label className="text-xs text-dark-400 font-medium mb-1 block">{t('sidebar.entityName')}</label>
            <input
              type="text"
              value={selectedEntity.name}
              onChange={(e) => updateEntity(selectedEntity.id, { name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold bg-dark-50/50"
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
              {t('sidebar.fields')}
            </h3>
            <span className="text-xs text-dark-300 bg-dark-50 px-2 py-0.5 rounded-full">
              {selectedEntity.fields.length}
            </span>
          </div>

          <div className="space-y-2">
            {selectedEntity.fields.map((field, i) => (
              <div
                key={`${selectedEntity.id}-field-${i}`}
                className="p-2.5 bg-dark-50/70 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(selectedEntity.id, i, { name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded-md text-xs font-mono bg-white"
                    placeholder={t('sidebar.fieldPlaceholder')}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(selectedEntity.id, i, { type: e.target.value as FieldType })}
                    className="px-1.5 py-1 border border-gray-200 rounded-md text-xs bg-white font-mono"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(selectedEntity.id, i)}
                    className="w-5 h-5 flex items-center justify-center text-dark-300 hover:text-gyxer-500 hover:bg-gyxer-50 rounded transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Flags row */}
                <div className="flex gap-4 text-xs text-dark-400 pl-0.5">
                  {[
                    { key: 'required', label: t('sidebar.required') },
                    { key: 'unique', label: t('sidebar.unique') },
                    { key: 'index', label: t('sidebar.index') },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(field as any)[key]}
                        onChange={(e) => updateField(selectedEntity.id, i, { [key]: e.target.checked })}
                        className="rounded border-gray-300 text-gyxer-500 focus:ring-gyxer-500 w-3 h-3"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Default value (not for json type) */}
                {field.type !== 'json' && (
                  <div className="mt-1.5 pl-0.5">
                    <label className="text-[10px] text-dark-300 block mb-0.5">{t('sidebar.defaultValue')}</label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-1.5 text-xs text-dark-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.default === true || field.default === 'true'}
                          onChange={(e) => updateField(selectedEntity.id, i, { default: e.target.checked })}
                          className="rounded border-gray-300 text-gyxer-500 focus:ring-gyxer-500 w-3 h-3"
                        />
                        {field.default === true || field.default === 'true' ? 'true' : 'false'}
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={field.default != null ? String(field.default) : ''}
                        onChange={(e) => updateField(selectedEntity.id, i, { default: e.target.value || undefined })}
                        className="w-full px-2 py-0.5 border border-gray-200 rounded-md text-[11px] font-mono bg-white text-dark-500"
                        placeholder="—"
                      />
                    )}
                  </div>
                )}

                {/* Enum values (only for enum type) */}
                {field.type === 'enum' && (
                  <div className="mt-1.5 pl-0.5">
                    <label className="text-[10px] text-dark-300 block mb-0.5">{t('sidebar.enumValues')}</label>
                    <input
                      type="text"
                      value={(field.enumValues || []).join(', ')}
                      onChange={(e) => {
                        const values = e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean);
                        updateField(selectedEntity.id, i, { enumValues: values });
                      }}
                      className="w-full px-2 py-0.5 border border-gray-200 rounded-md text-[11px] font-mono bg-white text-dark-500"
                      placeholder="ACTIVE, INACTIVE, PENDING"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => addField(selectedEntity.id)}
            className="mt-3 w-full py-2 border border-dashed border-dark-200 rounded-lg text-xs text-dark-400 font-medium hover:border-gyxer-400 hover:text-gyxer-600 hover:bg-gyxer-50 transition-all"
          >
            {t('sidebar.addField')}
          </button>
        </div>
      ) : (
        /* ─── Nothing Selected ─── */
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-30">🎯</div>
            <div className="text-dark-300 text-sm">{t('sidebar.selectElement')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
