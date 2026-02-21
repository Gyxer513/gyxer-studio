import React from 'react';
import { useProjectStore, type FieldType } from '../store/project-store';
import { useTranslation } from '../i18n';

const FIELD_TYPES: FieldType[] = [
  'string', 'text', 'int', 'float', 'boolean', 'datetime', 'enum', 'json', 'uuid',
];

export function Sidebar() {
  const {
    entities, selectedEntityId, settings, modules,
    updateEntity, updateField, removeField, addField, updateSettings, toggleModule,
  } = useProjectStore();
  const { t } = useTranslation();
  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

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

      {/* ─── Selected Entity ─── */}
      {selectedEntity ? (
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
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-30">🎯</div>
            <div className="text-dark-300 text-sm">{t('sidebar.selectEntity')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
