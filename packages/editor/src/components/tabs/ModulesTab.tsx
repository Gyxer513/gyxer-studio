import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useTranslation } from '../../i18n';
import { sectionCls, checkboxCls, cardCls, smallInputCls } from '../shared-styles';

export function ModulesTab() {
  const {
    entities, modules, toggleModule,
    addSeedUser, updateSeedUser, removeSeedUser, updateSeedUserExtra,
  } = useProjectStore();
  const { t } = useTranslation();

  const hasUser = entities.some((e) => e.name === 'User');

  // Get extra required fields from User entity (for seed user extra fields)
  const userEntity = entities.find((e) => e.name === 'User');
  const extraRequiredFields = (userEntity?.fields ?? []).filter(
    (f) => f.required && f.name !== 'email' && !f.default,
  );

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
              </ul>
            </div>

            {/* ─── Seed Users ─── */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-dark-300 dark:text-dark-400 uppercase tracking-wider mb-2">
                {t('sidebar.seedUsers')}
              </h3>

              <div className="space-y-2">
                {modules.seedUsers.map((user, i) => (
                  <div key={i} className={cardCls}>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={user.email}
                        onChange={(e) => updateSeedUser(i, { email: e.target.value })}
                        className={smallInputCls}
                        placeholder="email"
                      />
                      <input
                        type="text"
                        value={user.password}
                        onChange={(e) => updateSeedUser(i, { password: e.target.value })}
                        className={smallInputCls}
                        placeholder="password"
                      />

                      {extraRequiredFields.map((f) => (
                        <input
                          key={f.name}
                          type={f.type === 'int' || f.type === 'float' ? 'number' : 'text'}
                          value={user.extraFields[f.name] !== undefined ? String(user.extraFields[f.name]) : ''}
                          onChange={(e) => {
                            const val = f.type === 'int' ? parseInt(e.target.value) || 0
                              : f.type === 'float' ? parseFloat(e.target.value) || 0
                              : e.target.value;
                            updateSeedUserExtra(i, f.name, val);
                          }}
                          className={smallInputCls}
                          placeholder={f.name}
                        />
                      ))}
                    </div>

                    {modules.seedUsers.length > 1 && (
                      <button
                        onClick={() => removeSeedUser(i)}
                        className="mt-1.5 text-[10px] text-dark-300 hover:text-gyxer-500 transition-colors"
                      >
                        {t('sidebar.removeSeedUser')}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addSeedUser}
                className="mt-2 w-full py-1.5 border border-dashed border-dark-200 dark:border-dark-600 rounded-lg text-xs text-dark-400 font-medium hover:border-gyxer-400 hover:text-gyxer-600 hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 transition-all"
              >
                {t('sidebar.addSeedUser')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
