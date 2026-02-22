import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Sidebar } from './Sidebar';
import { HttpClient } from './http/HttpClient';

type PanelTab = 'schema' | 'http';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('schema');
  const { t } = useTranslation();

  return (
    <div
      className={`${
        activeTab === 'schema' ? 'w-80' : 'w-[480px]'
      } bg-white dark:bg-dark-800 border-l border-gray-200/80 dark:border-dark-700 h-full flex flex-col transition-[width] duration-200`}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-dark-700 shrink-0">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'schema'
              ? 'text-gyxer-600 dark:text-gyxer-400 border-b-2 border-gyxer-500'
              : 'text-dark-300 dark:text-dark-400 hover:text-dark-500 dark:hover:text-dark-200'
          }`}
        >
          {t('panel.schemaTab')}
        </button>
        <button
          onClick={() => setActiveTab('http')}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'http'
              ? 'text-gyxer-600 dark:text-gyxer-400 border-b-2 border-gyxer-500'
              : 'text-dark-300 dark:text-dark-400 hover:text-dark-500 dark:hover:text-dark-200'
          }`}
        >
          {t('panel.httpTab')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'schema' ? <Sidebar /> : <HttpClient />}
      </div>
    </div>
  );
}
