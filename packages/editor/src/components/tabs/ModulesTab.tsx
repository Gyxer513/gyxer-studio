import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useTranslation } from '../../i18n';
import { sectionCls, checkboxCls } from '../shared-styles';

export function ModulesTab() {
  const { entities, modules, toggleModule } = useProjectStore();
  const { t } = useTranslation();

  const hasUser = entities.some((e) => e.name === 'User');

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className={sectionCls}>{t('sidebar.modules')}</h2>

        {/* ─── JWT Auth ─── */}
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
          <div className="mt-3 ml-7 space-y-2.5">
            {/* User entity status */}
            {hasUser && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span>✅</span>
                <span>{t('sidebar.authUserExists')}</span>
              </div>
            )}

            {/* What auth generates */}
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.authGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>JWT auth guard + strategy</li>
                <li>Register / Login / Refresh endpoints</li>
                <li>bcrypt password hashing</li>
                <li>{t('sidebar.authPasswordField')}</li>
                <li>{t('sidebar.authSeedInfo')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
