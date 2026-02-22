import React, { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { exportToSchema } from '../utils/export';
import {
  generateProjectZip,
  generateProjectToDirectory,
  supportsDirectoryPicker,
} from '../utils/generate-zip';
import { validateProject } from '@gyxer/schema';
import { useTranslation } from '../i18n';
import { useI18nStore, type Locale } from '../i18n';
import type { GyxerProject } from '@gyxer/schema';
import { GyxerLogoFull } from './GyxerLogo';
import { useThemeStore } from '../store/theme-store';

export function Toolbar() {
  const { addEntity, entities, importProject } = useProjectStore();
  const { t, locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setLocale = useI18nStore((s) => s.setLocale);
  const { theme, toggleTheme } = useThemeStore();
  const [generating, setGenerating] = useState(false);
  const [showGenMenu, setShowGenMenu] = useState(false);

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

  const validateSchema = useCallback((): GyxerProject | null => {
    if (entities.length === 0) {
      alert(locale === 'ru'
        ? 'Добавьте хотя бы одну сущность!'
        : 'Add at least one entity!');
      return null;
    }
    const schema = exportToSchema();
    const validation = validateProject(schema);
    if (!validation.success) {
      const errors = validation.errors?.map((e) => e.message).join('\n') || 'Unknown error';
      alert(locale === 'ru' ? `Ошибки валидации:\n${errors}` : `Validation errors:\n${errors}`);
      return null;
    }
    return validation.data as GyxerProject;
  }, [entities, locale]);

  const handleGenerateZip = useCallback(async () => {
    const project = validateSchema();
    if (!project) return;
    setShowGenMenu(false);
    setGenerating(true);
    try {
      const blob = await generateProjectZip(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name || 'project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Generation error:', err);
      alert(locale === 'ru' ? `Ошибка генерации: ${err}` : `Generation error: ${err}`);
    } finally {
      setGenerating(false);
    }
  }, [validateSchema, locale]);

  const handleGenerateToFolder = useCallback(async () => {
    const project = validateSchema();
    if (!project) return;
    setShowGenMenu(false);
    setGenerating(true);
    try {
      const result = await generateProjectToDirectory(project);
      alert(locale === 'ru'
        ? `✅ Проект "${result.dirName}" — ${result.filesWritten} файлов создано!`
        : `✅ Project "${result.dirName}" — ${result.filesWritten} files created!`);
    } catch (err: any) {
      if (err?.name === 'AbortError') { /* cancelled */ } else {
        console.error('Generation error:', err);
        alert(locale === 'ru' ? `Ошибка генерации: ${err}` : `Generation error: ${err}`);
      }
    } finally {
      setGenerating(false);
    }
  }, [validateSchema, locale]);

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

  const canGenerate = !generating && entities.length > 0;
  const hasFolderSupport = supportsDirectoryPicker();

  return (
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

      {/* Generate — dropdown with folder / zip options */}
      <div className="relative">
        <button
          onClick={() => hasFolderSupport ? setShowGenMenu((p) => !p) : handleGenerateZip()}
          disabled={!canGenerate}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            !canGenerate
              ? 'bg-gray-200 dark:bg-dark-700 text-gray-400 dark:text-dark-500 cursor-not-allowed'
              : 'bg-gyxer-500 text-white hover:bg-gyxer-600 shadow-sm hover:shadow-md'
          }`}
        >
          {generating
            ? locale === 'ru' ? '⏳ Генерация...' : '⏳ Generating...'
            : t('toolbar.generate')}
        </button>

        {showGenMenu && canGenerate && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowGenMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-card-hover z-20 overflow-hidden p-1">
              <button
                onClick={handleGenerateToFolder}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-gyxer-50 dark:hover:bg-gyxer-900/30 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-lg">📁</span>
                <div>
                  <div className="font-medium text-dark-800 dark:text-dark-100">
                    {locale === 'ru' ? 'В папку...' : 'To folder...'}
                  </div>
                  <div className="text-xs text-dark-300">
                    {locale === 'ru' ? 'Записать файлы в директорию' : 'Write files to a directory'}
                  </div>
                </div>
              </button>
              <button
                onClick={handleGenerateZip}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-dark-50 dark:hover:bg-dark-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-lg">📦</span>
                <div>
                  <div className="font-medium text-dark-800 dark:text-dark-100">
                    {locale === 'ru' ? 'Скачать ZIP' : 'Download ZIP'}
                  </div>
                  <div className="text-xs text-dark-300">
                    {locale === 'ru' ? 'Архив с проектом' : 'Project archive'}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
