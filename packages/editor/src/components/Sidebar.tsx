import React from 'react';
import { useProjectStore, type FieldType, type RelationType } from '../store/project-store';
import { useTranslation } from '../i18n';
import { inputCls, labelCls, sectionCls, cardCls, checkboxCls, smallInputCls } from './shared-styles';
import { toPascalCase, toProjectKebab } from '../utils/naming';

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
    addUserEntity,
  } = useProjectStore();
  const { t } = useTranslation();

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);
  const selectedRelation = relations.find((r) => r.id === selectedRelationId);

  const sourceEntity = selectedRelation
    ? entities.find((e) => e.id === selectedRelation.sourceEntityId)
    : null;
  const targetEntity = selectedRelation
    ? entities.find((e) => e.id === selectedRelation.targetEntityId)
    : null;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* ─── Project Settings ─── */}
      <div className="p-4 border-b border-gray-100 dark:border-dark-700">
        <h2 className={sectionCls}>{t('sidebar.project')}</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{t('sidebar.projectName')}</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              onBlur={() => {
                const fixed = toProjectKebab(settings.name);
                if (fixed && fixed !== settings.name) updateSettings({ name: fixed });
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t('sidebar.port')}</label>
            <input
              type="number"
              value={settings.port}
              onChange={(e) => updateSettings({ port: parseInt(e.target.value) || 3000 })}
              className={`${inputCls} font-mono w-28`}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
            {[
              { key: 'enableSwagger', label: 'Swagger' },
              { key: 'enableHelmet', label: 'Helmet' },
              { key: 'enableRateLimit', label: 'Rate Limit' },
              { key: 'docker', label: 'Docker' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 text-xs text-dark-500 dark:text-dark-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings as any)[key]}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className={checkboxCls}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Database ─── */}
      <div className="p-4 border-b border-gray-100 dark:border-dark-700">
        <h2 className={sectionCls}>{t('sidebar.database')}</h2>
        <div className="space-y-3">
          <div>
            <select
              value={settings.database}
              onChange={(e) => updateSettings({ database: e.target.value as any })}
              className={inputCls.replace('px-3', 'px-2')}
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          {settings.database !== 'sqlite' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('sidebar.dbHost')}</label>
                <input
                  type="text"
                  value={settings.dbHost}
                  onChange={(e) => updateSettings({ dbHost: e.target.value })}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className={labelCls}>{t('sidebar.dbPort')}</label>
                <input
                  type="number"
                  value={settings.dbPort}
                  onChange={(e) => updateSettings({ dbPort: parseInt(e.target.value) || 0 })}
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>{t('sidebar.dbUser')}</label>
                <input
                  type="text"
                  value={settings.dbUser}
                  onChange={(e) => updateSettings({ dbUser: e.target.value })}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="postgres"
                />
              </div>
              <div>
                <label className={labelCls}>{t('sidebar.dbPassword')}</label>
                <input
                  type="text"
                  value={settings.dbPassword}
                  onChange={(e) => updateSettings({ dbPassword: e.target.value })}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="postgres"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modules ─── */}
      <div className="p-4 border-b border-gray-100 dark:border-dark-700">
        <h2 className={sectionCls}>{t('sidebar.modules')}</h2>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={modules.authJwt}
            onChange={(e) => toggleModule('authJwt', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">🔐</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.authJwt')}
            </span>
          </div>
        </label>

        {modules.authJwt && (
          <div className="mt-3 ml-7 space-y-2">
            {entities.some((e) => e.name === 'User') ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span>✅</span>
                <span>{t('sidebar.authUserExists')}</span>
              </div>
            ) : (
              <>
                <div className="text-xs text-dark-400 dark:text-dark-300 leading-relaxed">
                  <span className="mr-1">ℹ️</span>
                  {t('sidebar.authInfo')}
                </div>
                <button
                  onClick={addUserEntity}
                  className="px-3 py-1.5 border border-dashed border-gyxer-300 dark:border-gyxer-700 text-gyxer-600 dark:text-gyxer-400 rounded-lg text-xs font-medium hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 hover:border-gyxer-400 transition-all"
                >
                  {t('sidebar.authAddUser')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Selected Relation ─── */}
      {selectedRelation ? (
        <div className="p-4 flex-1">
          <h2 className={sectionCls}>{t('sidebar.relation')}</h2>

          <div className={`mb-4 ${cardCls}`}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-dark-700 dark:text-dark-100">{sourceEntity?.name || '?'}</span>
              <span className="text-dark-300">→</span>
              <span className="font-semibold text-dark-700 dark:text-dark-100">{targetEntity?.name || '?'}</span>
            </div>
          </div>

          <div className="mb-3">
            <label className={labelCls}>{t('sidebar.relationType')}</label>
            <select
              value={selectedRelation.type}
              onChange={(e) => updateRelation(selectedRelation.id, { type: e.target.value as RelationType })}
              className={inputCls}
            >
              {RELATION_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {t(`relation.${rt === 'one-to-one' ? 'oneToOne' : rt === 'one-to-many' ? 'oneToMany' : 'manyToMany'}` as any)} — {rt}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className={labelCls}>{t('sidebar.relationOnDelete')}</label>
            <select
              value={selectedRelation.onDelete}
              onChange={(e) => updateRelation(selectedRelation.id, { onDelete: e.target.value as any })}
              className={`${inputCls} font-mono`}
            >
              {ON_DELETE_OPTIONS.map((od) => (
                <option key={od} value={od}>{t(`onDelete.${od}` as any)}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className={labelCls}>{t('sidebar.relationForeignKey')}</label>
            <input
              type="text"
              value={selectedRelation.foreignKey || ''}
              onChange={(e) => updateRelation(selectedRelation.id, { foreignKey: e.target.value || undefined })}
              className={`${inputCls} font-mono`}
              placeholder={`${(targetEntity?.name || 'target').toLowerCase()}Id`}
            />
          </div>

          <button
            onClick={() => removeRelation(selectedRelation.id)}
            className="w-full py-2 border border-gyxer-200 dark:border-gyxer-800 text-gyxer-600 dark:text-gyxer-400 rounded-lg text-xs font-medium hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 hover:border-gyxer-400 transition-all"
          >
            {t('sidebar.deleteRelation')}
          </button>
        </div>
      ) : selectedEntity ? (
        /* ─── Selected Entity ─── */
        <div className="p-4 flex-1">
          <h2 className={sectionCls}>{t('sidebar.entity')}</h2>

          <div className="mb-4">
            <label className={labelCls}>{t('sidebar.entityName')}</label>
            <input
              type="text"
              value={selectedEntity.name}
              onChange={(e) => updateEntity(selectedEntity.id, { name: e.target.value })}
              onBlur={() => {
                const fixed = toPascalCase(selectedEntity.name);
                if (fixed && fixed !== selectedEntity.name) updateEntity(selectedEntity.id, { name: fixed });
              }}
              className={`${inputCls} font-semibold`}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-dark-300 dark:text-dark-400 uppercase tracking-wider">
              {t('sidebar.fields')}
            </h3>
            <span className="text-xs text-dark-300 bg-dark-50 dark:bg-dark-700 dark:text-dark-400 px-2 py-0.5 rounded-full">
              {selectedEntity.fields.length}
            </span>
          </div>

          <div className="space-y-2">
            {selectedEntity.fields.map((field, i) => (
              <div key={`${selectedEntity.id}-field-${i}`} className={cardCls}>
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(selectedEntity.id, i, { name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-200 dark:border-dark-600 rounded-md text-xs font-mono bg-white dark:bg-dark-700 dark:text-dark-100"
                    placeholder={t('sidebar.fieldPlaceholder')}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(selectedEntity.id, i, { type: e.target.value as FieldType })}
                    className="px-1.5 py-1 border border-gray-200 dark:border-dark-600 rounded-md text-xs bg-white dark:bg-dark-700 dark:text-dark-100 font-mono"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(selectedEntity.id, i)}
                    className="w-5 h-5 flex items-center justify-center text-dark-300 hover:text-gyxer-500 hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 rounded transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-4 text-xs text-dark-400 dark:text-dark-300 pl-0.5">
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
                        className={`${checkboxCls} w-3 h-3`}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {field.type !== 'json' && (
                  <div className="mt-1.5 pl-0.5">
                    <label className="text-[10px] text-dark-300 dark:text-dark-400 block mb-0.5">{t('sidebar.defaultValue')}</label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-1.5 text-xs text-dark-400 dark:text-dark-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.default === true || field.default === 'true'}
                          onChange={(e) => updateField(selectedEntity.id, i, { default: e.target.checked })}
                          className={`${checkboxCls} w-3 h-3`}
                        />
                        {field.default === true || field.default === 'true' ? 'true' : 'false'}
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={field.default != null ? String(field.default) : ''}
                        onChange={(e) => updateField(selectedEntity.id, i, { default: e.target.value || undefined })}
                        className={smallInputCls}
                        placeholder="—"
                      />
                    )}
                  </div>
                )}

                {field.type === 'enum' && (
                  <div className="mt-1.5 pl-0.5">
                    <label className="text-[10px] text-dark-300 dark:text-dark-400 block mb-0.5">{t('sidebar.enumValues')}</label>
                    <input
                      type="text"
                      value={(field.enumValues || []).join(', ')}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                        updateField(selectedEntity.id, i, { enumValues: values });
                      }}
                      className={smallInputCls}
                      placeholder="ACTIVE, INACTIVE, PENDING"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => addField(selectedEntity.id)}
            className="mt-3 w-full py-2 border border-dashed border-dark-200 dark:border-dark-600 rounded-lg text-xs text-dark-400 dark:text-dark-400 font-medium hover:border-gyxer-400 hover:text-gyxer-600 hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 transition-all"
          >
            {t('sidebar.addField')}
          </button>
        </div>
      ) : (
        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-30">🎯</div>
            <div className="text-dark-300 dark:text-dark-400 text-sm">{t('sidebar.selectElement')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
