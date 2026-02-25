import React, { useState } from 'react';
import { useHttpStore, type HttpMethod } from '../../store/http-store';
import { useProjectStore } from '../../store/project-store';
import { useTranslation } from '../../i18n';
import { inputCls, labelCls } from '../shared-styles';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-600 dark:text-green-400',
  POST: 'text-blue-600 dark:text-blue-400',
  PATCH: 'text-orange-500 dark:text-orange-400',
  PUT: 'text-purple-600 dark:text-purple-400',
  DELETE: 'text-red-600 dark:text-red-400',
};

export function RequestBuilder({ onSend }: { onSend: () => void }) {
  const {
    baseUrl, setBaseUrl,
    bearerToken, setToken, clearToken,
    activeRequest,
    setMethod, setPath, setBody,
    addHeader, removeHeader, toggleHeader, updateHeader,
    isLoading,
  } = useHttpStore();
  const { modules } = useProjectStore();
  const { t } = useTranslation();

  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const hasBody = ['POST', 'PATCH', 'PUT'].includes(activeRequest.method);
  const hasToken = bearerToken.length > 0;

  return (
    <div className="px-3 py-2.5 space-y-2.5 border-b border-gray-100 dark:border-dark-700">
      {/* Base URL */}
      <div>
        <label className={labelCls}>{t('http.baseUrl')}</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="http://localhost:3000"
          className={`${inputCls} font-mono text-xs`}
        />
      </div>

      {/* Auth / Bearer Token */}
      <div>
        <button
          onClick={() => setShowAuth(!showAuth)}
          className="flex items-center gap-1 text-xs font-medium text-dark-400 dark:text-dark-300 hover:text-dark-600 dark:hover:text-dark-100 transition-colors"
        >
          <span className={`transition-transform ${showAuth ? 'rotate-90' : ''}`}>▸</span>
          {t('http.auth')}
          <span className={`ml-1 text-[10px] ${hasToken ? 'text-green-500' : 'text-dark-300 dark:text-dark-500'}`}>
            {hasToken ? '🔒' : '🔓'}
          </span>
        </button>

        {showAuth && (
          <div className="mt-1.5 space-y-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-dark-400 dark:text-dark-300 shrink-0">Bearer</span>
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token or login to /auth/login"
                className={`flex-1 px-1.5 py-0.5 border border-gray-200 dark:border-dark-600 rounded text-[11px] font-mono bg-white dark:bg-dark-700 dark:text-dark-200 ${inputCls}`}
              />
              {hasToken && (
                <button
                  onClick={clearToken}
                  className="w-4 h-4 flex items-center justify-center text-dark-300 hover:text-gyxer-500 rounded text-[10px] shrink-0"
                  title={t('http.clearToken')}
                >
                  ✕
                </button>
              )}
            </div>
            {!hasToken && modules.authJwt && (
              <p className="text-[10px] text-dark-300 dark:text-dark-500">
                {t('http.tokenHint')}
              </p>
            )}
            {hasToken && (
              <p className="text-[10px] text-green-500 dark:text-green-400">
                ✓ {t('http.tokenSaved')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Method + Path + Send */}
      <div className="flex gap-1.5">
        <select
          value={activeRequest.method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs font-bold bg-white dark:bg-dark-700 ${METHOD_COLORS[activeRequest.method]} w-[85px] shrink-0`}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={activeRequest.path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/api/..."
          className="flex-1 px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs font-mono bg-white dark:bg-dark-700 dark:text-dark-100"
        />
        <button
          onClick={onSend}
          disabled={isLoading}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shrink-0 ${
            isLoading
              ? 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-dark-400 cursor-not-allowed'
              : 'bg-gyxer-500 text-white hover:bg-gyxer-600 shadow-sm'
          }`}
        >
          {isLoading ? t('http.sending') : t('http.send')}
        </button>
      </div>

      {/* Headers section (collapsible) */}
      <div>
        <button
          onClick={() => setShowHeaders(!showHeaders)}
          className="flex items-center gap-1 text-xs font-medium text-dark-400 dark:text-dark-300 hover:text-dark-600 dark:hover:text-dark-100 transition-colors"
        >
          <span className={`transition-transform ${showHeaders ? 'rotate-90' : ''}`}>▸</span>
          {t('http.headers')} ({activeRequest.headers.filter((h) => h.enabled).length})
        </button>

        {showHeaders && (
          <div className="mt-1.5 space-y-1">
            {activeRequest.headers.map((header, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={() => toggleHeader(i)}
                  className="rounded border-gray-300 dark:border-dark-500 text-gyxer-500 w-3 h-3"
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(i, 'key', e.target.value)}
                  placeholder="Key"
                  className={`flex-1 px-1.5 py-0.5 border border-gray-200 dark:border-dark-600 rounded text-[11px] font-mono bg-white dark:bg-dark-700 dark:text-dark-200 ${
                    !header.enabled ? 'opacity-40' : ''
                  }`}
                />
                <span className="text-dark-300 text-[10px]">:</span>
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(i, 'value', e.target.value)}
                  placeholder="Value"
                  className={`flex-1 px-1.5 py-0.5 border border-gray-200 dark:border-dark-600 rounded text-[11px] font-mono bg-white dark:bg-dark-700 dark:text-dark-200 ${
                    !header.enabled ? 'opacity-40' : ''
                  }`}
                />
                <button
                  onClick={() => removeHeader(i)}
                  className="w-4 h-4 flex items-center justify-center text-dark-300 hover:text-gyxer-500 rounded text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addHeader}
              className="text-[11px] text-dark-300 dark:text-dark-400 hover:text-gyxer-500 dark:hover:text-gyxer-400 font-medium transition-colors"
            >
              {t('http.addHeader')}
            </button>
          </div>
        )}
      </div>

      {/* Body section (collapsible, only for POST/PATCH/PUT) */}
      {hasBody && (
        <div>
          <button
            onClick={() => setShowBody(!showBody)}
            className="flex items-center gap-1 text-xs font-medium text-dark-400 dark:text-dark-300 hover:text-dark-600 dark:hover:text-dark-100 transition-colors"
          >
            <span className={`transition-transform ${showBody ? 'rotate-90' : ''}`}>▸</span>
            {t('http.body')}
          </button>

          {showBody && (
            <textarea
              value={activeRequest.body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="{}"
              rows={8}
              className="mt-1.5 w-full px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-[11px] font-mono bg-white dark:bg-dark-700 dark:text-dark-200 resize-y"
            />
          )}
        </div>
      )}
    </div>
  );
}
