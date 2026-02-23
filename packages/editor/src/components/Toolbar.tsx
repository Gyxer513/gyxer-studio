import React, { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { exportToSchema } from '../utils/export';
import { validateProject } from '@gyxer-studio/schema';
import { useTranslation } from '../i18n';
import { useI18nStore, type Locale } from '../i18n';
import type { GyxerProject } from '@gyxer-studio/schema';
import { GyxerLogoFull } from './GyxerLogo';
import { useThemeStore } from '../store/theme-store';

export function Toolbar() {
  const { addEntity, entities, importProject } = useProjectStore();
  const { t, locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setLocale = useI18nStore((s) => s.setLocale);
  const { theme, toggleTheme } = useThemeStore();
  const [showSuccess, setShowSuccess] = useState<{ fileName: string; command: string } | null>(null);

  const handleAddEntity = useCallback(() => {
    const x = 100 + Math.random() * 400;
    const y = 100 + Math.random() * 300;
    addEntity({ x, y });
  }, [addEntity]);

  const handleExportJson = useCallback(() => {
    const schema = exportToSchema();
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Generate = validate + save config to configs/ via API + show CLI instruction
  const handleGenerate = useCallback(async () => {
    if (entities.length === 0) {
      alert(t('generate.noEntities'));
      return;
    }

    const schema = exportToSchema();
    const validation = validateProject(schema);

    if (!validation.success) {
      const errors = validation.errors?.map((e) => e.message).join('\n') || 'Unknown error';
      alert(`${t('generate.validationErrors')}\n${errors}`);
      return;
    }

    const projectName = (schema.name as string) || 'project';
    const fileName = `${projectName}.json`;

    try {
      // Save config to configs/ directory via Vite middleware
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema, null, 2),
      });

      if (res.ok) {
        // Saved to configs/ — show CLI command
        const command = `npx @gyxer-studio/cli generate configs/${fileName} -o ./${projectName}`;
        setShowSuccess({ fileName, command });
        return;
      }
    } catch {
      // Middleware not available (production build) — fallback to download
    }

    // Fallback: download JSON file
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const command = `npx @gyxer-studio/cli generate ${fileName} -o ./${projectName}`;
    setShowSuccess({ fileName, command });
  }, [entities, t]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          importProject(json);
        } catch {
          alert(locale === 'ru' ? 'Ошибка: невалидный JSON файл' : 'Error: invalid JSON file');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importProject, locale],
  );

  const handleLocaleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setLocale(e.target.value as Locale),
    [setLocale],
  );

  return (
    <>
      <div className="h-14 bg-white dark:bg-dark-800 border-b border-gray-200/80 dark:border-dark-700 flex items-center px-5 gap-3 shadow-toolbar transition-colors">
        {/* Logo */}
        <GyxerLogoFull size={30} />

        <div className="text-dark-300 mx-1">|</div>
        <span className="text-sm text-dark-400 dark:text-dark-300 font-medium tracking-wide">Studio</span>

        {/* Separator */}
        <div className="w-px h-7 bg-gray-200 dark:bg-dark-600 mx-2" />

        {/* Add Entity */}
        <button
          onClick={handleAddEntity}
          className="px-3.5 py-1.5 bg-dark-800 dark:bg-dark-600 text-white rounded-lg text-sm font-medium hover:bg-dark-700 dark:hover:bg-dark-500 transition-all active:scale-95"
        >
          {t('toolbar.addEntity')}
        </button>

        <div className="flex-1" />

        {/* Entity counter */}
        {entities.length > 0 && (
          <div className="text-xs text-dark-300 bg-dark-50 dark:bg-dark-700 dark:text-dark-300 px-2.5 py-1 rounded-full font-medium">
            {entities.length} {locale === 'ru' ? 'сущн.' : 'entities'}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-dark-600 text-dark-400 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-all active:scale-95 text-sm"
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Language selector */}
        <select
          value={locale}
          onChange={handleLocaleChange}
          className="px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-dark-500 dark:text-dark-200 bg-white dark:bg-dark-700 hover:border-dark-300 dark:hover:border-dark-500 transition-colors cursor-pointer"
        >
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        {/* Separator */}
        <div className="w-px h-7 bg-gray-200 dark:bg-dark-600" />

        {/* Import JSON (hidden input + button) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={handleImportJson}
          className="px-3 py-1.5 border border-gray-200 dark:border-dark-600 text-dark-500 dark:text-dark-200 rounded-lg text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-700 hover:border-dark-200 dark:hover:border-dark-500 transition-all active:scale-95"
        >
          {t('toolbar.importJson')}
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExportJson}
          className="px-3 py-1.5 border border-gray-200 dark:border-dark-600 text-dark-500 dark:text-dark-200 rounded-lg text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-700 hover:border-dark-200 dark:hover:border-dark-500 transition-all active:scale-95"
        >
          {t('toolbar.exportJson')}
        </button>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={entities.length === 0}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            entities.length === 0
              ? 'bg-gray-200 dark:bg-dark-700 text-gray-400 dark:text-dark-500 cursor-not-allowed'
              : 'bg-gyxer-500 text-white hover:bg-gyxer-600 shadow-sm hover:shadow-md'
          }`}
        >
          {t('toolbar.generate')}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowSuccess(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-600 p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-dark-800 dark:text-dark-100">
                {t('generate.configSaved').replace('{fileName}', showSuccess.fileName)}
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-dark-400 dark:text-dark-300 mb-3">
                {t('generate.runCommand')}
              </p>
              <div className="bg-dark-900 dark:bg-dark-950 rounded-xl p-4 font-mono text-sm text-green-400 select-all cursor-text">
                {showSuccess.command}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showSuccess.command);
                }}
                className="flex-1 px-4 py-2.5 bg-dark-800 dark:bg-dark-600 text-white rounded-xl text-sm font-medium hover:bg-dark-700 dark:hover:bg-dark-500 transition-all active:scale-95"
              >
                {locale === 'ru' ? '📋 Скопировать команду' : '📋 Copy command'}
              </button>
              <button
                onClick={() => setShowSuccess(null)}
                className="px-4 py-2.5 border border-gray-200 dark:border-dark-600 text-dark-500 dark:text-dark-300 rounded-xl text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-700 transition-all active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
