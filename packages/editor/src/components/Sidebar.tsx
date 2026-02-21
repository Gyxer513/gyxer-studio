import React from 'react';
import { useProjectStore, type FieldType } from '../store/project-store';
import { useTranslation } from '../i18n';

const FIELD_TYPES: FieldType[] = [
  'string',
  'text',
  'int',
  'float',
  'boolean',
  'datetime',
  'enum',
  'json',
  'uuid',
];

export function Sidebar() {
  const {
    entities,
    selectedEntityId,
    settings,
    modules,
    updateEntity,
    updateField,
    removeField,
    addField,
    updateSettings,
    toggleModule,
  } = useProjectStore();

  const { t } = useTranslation();

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto flex flex-col">
      {/* Project Settings */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('sidebar.project')}</h2>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">{t('sidebar.projectName')}</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">{t('sidebar.port')}</label>
            <input
              type="number"
              value={settings.port}
              onChange={(e) => updateSettings({ port: parseInt(e.target.value) || 3000 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">{t('sidebar.database')}</label>
            <select
              value={settings.database}
              onChange={(e) =>
                updateSettings({
                  database: e.target.value as 'postgresql' | 'mysql' | 'sqlite',
                })
              }
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableSwagger}
                onChange={(e) => updateSettings({ enableSwagger: e.target.checked })}
              />
              Swagger
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableHelmet}
                onChange={(e) => updateSettings({ enableHelmet: e.target.checked })}
              />
              Helmet
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableRateLimit}
                onChange={(e) => updateSettings({ enableRateLimit: e.target.checked })}
              />
              Rate Limit
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.docker}
                onChange={(e) => updateSettings({ docker: e.target.checked })}
              />
              Docker
            </label>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('sidebar.modules')}</h2>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={modules.authJwt}
              onChange={(e) => toggleModule('authJwt', e.target.checked)}
            />
            <span className="text-gray-700">🔐 {t('sidebar.authJwt')}</span>
          </label>
        </div>
      </div>

      {/* Selected Entity */}
      {selectedEntity ? (
        <div className="p-4 flex-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('sidebar.entity')}</h2>

          {/* Entity name */}
          <div className="mb-4">
            <label className="text-xs text-gray-500">{t('sidebar.entityName')}</label>
            <input
              type="text"
              value={selectedEntity.name}
              onChange={(e) => updateEntity(selectedEntity.id, { name: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>

          {/* Fields */}
          <h3 className="text-xs font-semibold text-gray-500 mb-2">{t('sidebar.fields')}</h3>
          <div className="space-y-3">
            {selectedEntity.fields.map((field, i) => (
              <div key={`${selectedEntity.id}-field-${i}`} className="p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) =>
                      updateField(selectedEntity.id, i, { name: e.target.value })
                    }
                    className="flex-1 px-2 py-1 border rounded text-xs"
                    placeholder={t('sidebar.fieldPlaceholder')}
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(selectedEntity.id, i, { type: e.target.value as FieldType })
                    }
                    className="px-1 py-1 border rounded text-xs"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(selectedEntity.id, i)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(selectedEntity.id, i, { required: e.target.checked })
                      }
                    />
                    {t('sidebar.required')}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={field.unique}
                      onChange={(e) =>
                        updateField(selectedEntity.id, i, { unique: e.target.checked })
                      }
                    />
                    {t('sidebar.unique')}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={field.index}
                      onChange={(e) =>
                        updateField(selectedEntity.id, i, { index: e.target.checked })
                      }
                    />
                    {t('sidebar.index')}
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addField(selectedEntity.id)}
            className="mt-3 w-full py-1 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-gyxer-500 hover:text-gyxer-600 transition-colors"
          >
            {t('sidebar.addField')}
          </button>
        </div>
      ) : (
        <div className="p-4 flex-1 flex items-center justify-center text-gray-400 text-sm text-center">
          {t('sidebar.selectEntity')}
        </div>
      )}
    </div>
  );
}
