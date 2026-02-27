import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useTranslation } from '../../i18n';
import { inputCls, labelCls, sectionCls } from '../shared-styles';

export function DatabaseTab() {
  const { settings, updateSettings } = useProjectStore();
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
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
    </div>
  );
}
