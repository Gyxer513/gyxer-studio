import React, { useState } from 'react';
import { useHttpStore, type HistoryEntry } from '../../store/http-store';
import { useTranslation } from '../../i18n';

const METHOD_BADGE_COLORS: Record<string, string> = {
  GET: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  POST: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  PATCH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  PUT: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function statusBadgeColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
  if (status >= 400 && status < 500) return 'text-orange-600 dark:text-orange-400';
  if (status >= 500) return 'text-red-600 dark:text-red-400';
  return 'text-dark-400';
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export function RequestHistory() {
  const { history, loadRequest, setResponse, clearHistory } = useHttpStore();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleReplay = (entry: HistoryEntry) => {
    loadRequest(entry.request);
    setResponse(entry.response);
  };

  return (
    <div className="border-t border-gray-100 dark:border-dark-700 shrink-0">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
          <span className="text-xs font-medium text-dark-400 dark:text-dark-300">
            {t('http.history')}
          </span>
          {history.length > 0 && (
            <span className="text-[10px] text-dark-300 dark:text-dark-500 bg-dark-50 dark:bg-dark-700 px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        {expanded && history.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearHistory();
            }}
            className="text-[10px] text-dark-300 hover:text-gyxer-500 cursor-pointer font-medium"
          >
            {t('http.clearHistory')}
          </span>
        )}
      </button>

      {/* History list */}
      {expanded && (
        <div className="max-h-[200px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="px-3 py-3 text-center text-[11px] text-dark-300 dark:text-dark-500">
              {t('http.noHistory')}
            </div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleReplay(entry)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${METHOD_BADGE_COLORS[entry.request.method] || ''}`}>
                  {entry.request.method}
                </span>
                <span className="flex-1 text-[11px] font-mono text-dark-600 dark:text-dark-200 truncate">
                  {entry.request.path}
                </span>
                <span className={`text-[10px] font-bold shrink-0 ${statusBadgeColor(entry.response.status)}`}>
                  {entry.response.status}
                </span>
                <span className="text-[10px] text-dark-300 dark:text-dark-500 shrink-0 font-mono">
                  {formatTime(entry.timestamp)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
