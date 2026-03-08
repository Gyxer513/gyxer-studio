import React from 'react';
import { useProjectStore } from '../../store/project-store';
import { useTranslation } from '../../i18n';
import { sectionCls, checkboxCls, cardCls, smallInputCls } from '../shared-styles';

export function ModulesTab() {
  const {
    entities, modules, toggleModule, updateModuleOption,
    addSeedUser, updateSeedUser, removeSeedUser, updateSeedUserExtra,
  } = useProjectStore();
  const { t } = useTranslation();

  // Find auth entity by ID first, fallback to name 'User' for backward compat
  const authEntity = modules.authEntityId
    ? entities.find((e) => e.id === modules.authEntityId)
    : entities.find((e) => e.name === 'User');
  const hasUser = !!authEntity;

  // Get extra required fields from auth entity (for seed user extra fields)
  const userEntity = authEntity;
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

                      {/* Extra fields: from seed user data + required User entity fields */}
                      {(() => {
                        const keys = new Set([
                          ...Object.keys(user.extraFields),
                          ...extraRequiredFields.map((f) => f.name),
                        ]);
                        return [...keys].map((fieldName) => {
                          const entityField = extraRequiredFields.find((f) => f.name === fieldName);
                          const isNumeric = entityField?.type === 'int' || entityField?.type === 'float';
                          return (
                            <input
                              key={fieldName}
                              type={isNumeric ? 'number' : 'text'}
                              value={user.extraFields[fieldName] !== undefined ? String(user.extraFields[fieldName]) : ''}
                              onChange={(e) => {
                                const val = entityField?.type === 'int' ? parseInt(e.target.value) || 0
                                  : entityField?.type === 'float' ? parseFloat(e.target.value) || 0
                                  : e.target.value;
                                updateSeedUserExtra(i, fieldName, val);
                              }}
                              className={smallInputCls}
                              placeholder={fieldName}
                            />
                          );
                        });
                      })()}
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

        {/* ─── OAuth (Google, GitHub) ─── */}
        {modules.authJwt && (
          <>
            <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
              <input
                type="checkbox"
                checked={modules.authOAuth}
                onChange={(e) => toggleModule('authOAuth', e.target.checked)}
                className={checkboxCls}
              />
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">🌐</span>
                <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
                  {t('sidebar.authOAuth')}
                </span>
              </div>
            </label>

            {modules.authOAuth && (
              <div className="mt-3 ml-7 space-y-2.5">
                <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
                  <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                    {t('sidebar.authOAuthGenerates')}
                  </div>
                  <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                    <li>Passport OAuth strategies</li>
                    <li>OAuth login + callback endpoints</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400">
                    {t('sidebar.authOAuthProviders')}
                  </label>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-300">
                      <input
                        type="checkbox"
                        checked={modules.authOAuthProviders.includes('google')}
                        onChange={(e) => {
                          const providers = e.target.checked
                            ? [...modules.authOAuthProviders, 'google' as const]
                            : modules.authOAuthProviders.filter((p) => p !== 'google');
                          updateModuleOption('authOAuthProviders', providers.length ? providers : ['google']);
                        }}
                        className={checkboxCls}
                      />
                      Google
                    </label>
                    <label className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-300">
                      <input
                        type="checkbox"
                        checked={modules.authOAuthProviders.includes('github')}
                        onChange={(e) => {
                          const providers = e.target.checked
                            ? [...modules.authOAuthProviders, 'github' as const]
                            : modules.authOAuthProviders.filter((p) => p !== 'github');
                          updateModuleOption('authOAuthProviders', providers.length ? providers : ['google']);
                        }}
                        className={checkboxCls}
                      />
                      GitHub
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Redis Cache ─── */}
        <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
          <input
            type="checkbox"
            checked={modules.cache}
            onChange={(e) => toggleModule('cache', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">⚡</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.cache')}
            </span>
          </div>
        </label>

        {modules.cache && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.cacheGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>CacheService (get/set/del/reset)</li>
                <li>Redis + in-memory fallback</li>
                <li>REDIS_URL env var</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.cacheTtl')}
              </label>
              <input
                type="number"
                value={modules.cacheTtl}
                onChange={(e) => updateModuleOption('cacheTtl', parseInt(e.target.value) || 300)}
                className={smallInputCls}
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.cacheMaxItems')}
              </label>
              <input
                type="number"
                value={modules.cacheMaxItems}
                onChange={(e) => updateModuleOption('cacheMaxItems', parseInt(e.target.value) || 100)}
                className={smallInputCls}
                min={1}
              />
            </div>
          </div>
        )}

        {/* ─── File Storage ─── */}
        <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
          <input
            type="checkbox"
            checked={modules.fileStorage}
            onChange={(e) => toggleModule('fileStorage', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">📁</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.fileStorage')}
            </span>
          </div>
        </label>

        {modules.fileStorage && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.fileStorageGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>S3/MinIO StorageService</li>
                <li>Upload / Download / Delete endpoints</li>
                <li>Multer file validation</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.fileStorageProvider')}
              </label>
              <select
                value={modules.fileStorageProvider}
                onChange={(e) => updateModuleOption('fileStorageProvider', e.target.value)}
                className={smallInputCls}
              >
                <option value="minio">MinIO</option>
                <option value="s3">AWS S3</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.fileStorageBucket')}
              </label>
              <input
                type="text"
                value={modules.fileStorageBucket}
                onChange={(e) => updateModuleOption('fileStorageBucket', e.target.value || 'uploads')}
                className={smallInputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.fileStorageMaxSize')}
              </label>
              <input
                type="number"
                value={modules.fileStorageMaxSize}
                onChange={(e) => updateModuleOption('fileStorageMaxSize', parseInt(e.target.value) || 5)}
                className={smallInputCls}
                min={1}
                max={100}
              />
            </div>
          </div>
        )}

        {/* ─── Job Queues ─── */}
        <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
          <input
            type="checkbox"
            checked={modules.queues}
            onChange={(e) => toggleModule('queues', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">📋</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.queues')}
            </span>
          </div>
        </label>

        {modules.queues && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.queuesGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>BullMQ queue + processor</li>
                <li>QueuesService.addJob()</li>
                <li>Redis connection</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.queuesName')}
              </label>
              <input
                type="text"
                value={modules.queuesName}
                onChange={(e) => updateModuleOption('queuesName', e.target.value || 'default')}
                className={smallInputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.queuesConcurrency')}
              </label>
              <input
                type="number"
                value={modules.queuesConcurrency}
                onChange={(e) => updateModuleOption('queuesConcurrency', parseInt(e.target.value) || 5)}
                className={smallInputCls}
                min={1}
                max={50}
              />
            </div>
          </div>
        )}

        {/* ─── WebSockets ─── */}
        <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
          <input
            type="checkbox"
            checked={modules.websockets}
            onChange={(e) => toggleModule('websockets', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">🔌</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.websockets')}
            </span>
          </div>
        </label>

        {modules.websockets && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.websocketsGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>Socket.IO Gateway</li>
                <li>Connect / Disconnect handlers</li>
                <li>Broadcast service</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-400">
                {t('sidebar.websocketsNamespace')}
              </label>
              <input
                type="text"
                value={modules.websocketsNamespace}
                onChange={(e) => updateModuleOption('websocketsNamespace', e.target.value || '/')}
                className={smallInputCls}
              />
            </div>
          </div>
        )}

        {/* ─── Keycloak SSO (alternative to JWT) ─── */}
        {!modules.authJwt && (
          <>
            <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
              <input
                type="checkbox"
                checked={modules.authKeycloak}
                onChange={(e) => toggleModule('authKeycloak', e.target.checked)}
                className={checkboxCls}
              />
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">🛡️</span>
                <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
                  {t('sidebar.authKeycloak')}
                </span>
              </div>
            </label>

            {modules.authKeycloak && (
              <div className="mt-3 ml-7 space-y-2.5">
                <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
                  <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                    {t('sidebar.authKeycloakGenerates')}
                  </div>
                  <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                    <li>Keycloak Passport strategy (JWKS)</li>
                    <li>KeycloakAuthGuard + @Public()</li>
                    <li>AuthKeycloakModule</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400">
                    {t('sidebar.authKeycloakRealm')}
                  </label>
                  <input
                    type="text"
                    value={modules.authKeycloakRealm}
                    onChange={(e) => updateModuleOption('authKeycloakRealm', e.target.value || 'master')}
                    className={smallInputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400">
                    {t('sidebar.authKeycloakServerUrl')}
                  </label>
                  <input
                    type="text"
                    value={modules.authKeycloakServerUrl}
                    onChange={(e) => updateModuleOption('authKeycloakServerUrl', e.target.value || 'http://localhost:8080')}
                    className={smallInputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-400">
                    {t('sidebar.authKeycloakClientId')}
                  </label>
                  <input
                    type="text"
                    value={modules.authKeycloakClientId}
                    onChange={(e) => updateModuleOption('authKeycloakClientId', e.target.value || 'nestjs-app')}
                    className={smallInputCls}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Search ─── */}
        <label className="flex items-center gap-2.5 cursor-pointer group mt-4">
          <input
            type="checkbox"
            checked={modules.search}
            onChange={(e) => toggleModule('search', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">🔍</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.search')}
            </span>
          </div>
        </label>

        {modules.search && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.searchGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>MeiliSearch SearchService</li>
                <li>GET /search?q=... endpoint</li>
                <li>POST /search/:index/reindex</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── Frontend ─── */}
        <div className="mt-6 pt-4 border-t border-dark-200 dark:border-dark-600">
          <span className="text-xs font-medium text-dark-400 dark:text-dark-500 uppercase tracking-wider">
            {t('sidebar.frontendSection')}
          </span>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer group mt-3">
          <input
            type="checkbox"
            checked={modules.adminPanel}
            onChange={(e) => toggleModule('adminPanel', e.target.checked)}
            className={checkboxCls}
          />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gyxer-50 dark:bg-gyxer-900/40 rounded flex items-center justify-center text-xs">📊</span>
            <span className="text-sm text-dark-600 dark:text-dark-200 group-hover:text-dark-800 dark:group-hover:text-white transition-colors">
              {t('sidebar.adminPanel')}
            </span>
          </div>
        </label>

        {modules.adminPanel && (
          <div className="mt-3 ml-7 space-y-2.5">
            <div className="p-2.5 bg-gyxer-50/50 dark:bg-gyxer-900/20 rounded-lg border border-gyxer-200 dark:border-gyxer-800 space-y-1.5">
              <div className="text-xs font-medium text-gyxer-700 dark:text-gyxer-300">
                {t('sidebar.adminPanelGenerates')}
              </div>
              <ul className="text-[11px] text-dark-500 dark:text-dark-300 space-y-1 ml-3 list-disc">
                <li>React + Vite + Tailwind CSS</li>
                <li>CRUD pages for all entities</li>
                <li>Dashboard with entity counts</li>
                {modules.authJwt && <li>Login page + JWT auth</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
