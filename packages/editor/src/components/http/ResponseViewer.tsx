import React, { useMemo } from 'react';
import { useHttpStore } from '../../store/http-store';
import { useTranslation } from '../../i18n';

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  if (status >= 300 && status < 400) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
  if (status >= 400 && status < 500) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
}

export function ResponseViewer() {
  const { activeResponse } = useHttpStore();
  const { t } = useTranslation();

  const formattedBody = useMemo(() => {
    if (!activeResponse) return '';
    try {
      const parsed = JSON.parse(activeResponse.body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return activeResponse.body;
    }
  }, [activeResponse]);

  if (!activeResponse) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-20">📡</div>
          <div className="text-dark-300 dark:text-dark-500 text-xs">{t('http.noResponse')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {/* Status + Time */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusColor(activeResponse.status)}`}>
          {activeResponse.status} {activeResponse.statusText}
        </span>
        <span className="text-[11px] text-dark-300 dark:text-dark-400 font-mono">
          {activeResponse.timeMs}ms
        </span>
      </div>

      {/* Response body */}
      <pre className="text-[11px] font-mono text-dark-600 dark:text-dark-200 bg-dark-50 dark:bg-dark-700/50 rounded-lg p-3 overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
        {formattedBody || '(empty response)'}
      </pre>
    </div>
  );
}
