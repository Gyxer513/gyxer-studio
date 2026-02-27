import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { ProjectTab } from './tabs/ProjectTab';
import { DatabaseTab } from './tabs/DatabaseTab';
import { ModulesTab } from './tabs/ModulesTab';
import { HttpClient } from './http/HttpClient';

type PanelTab = 'project' | 'database' | 'modules' | 'http';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('project');
  const { t } = useTranslation();

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'project', label: t('panel.projectTab') },
    { id: 'database', label: t('panel.databaseTab') },
    { id: 'modules', label: t('panel.modulesTab') },
    { id: 'http', label: t('panel.httpTab') },
  ];

  return (
    <div
      className={`${
        activeTab === 'http' ? 'w-[480px]' : 'w-80'
      } bg-white dark:bg-dark-800 border-l border-gray-200/80 dark:border-dark-700 h-full flex flex-col transition-[width] duration-200`}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-dark-700 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'text-gyxer-600 dark:text-gyxer-400 border-b-2 border-gyxer-500'
                : 'text-dark-300 dark:text-dark-400 hover:text-dark-500 dark:hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'project' && <ProjectTab />}
        {activeTab === 'database' && <DatabaseTab />}
        {activeTab === 'modules' && <ModulesTab />}
        {activeTab === 'http' && <HttpClient />}
      </div>
    </div>
  );
}
