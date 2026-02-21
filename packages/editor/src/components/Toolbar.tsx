import React, { useCallback, useState } from 'react';
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

export function Toolbar() {
  const { addEntity, entities } = useProjectStore();
  const { t, locale } = useTranslation();
  const setLocale = useI18nStore((s) => s.setLocale);
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

  /** Validate the current schema; returns validated data or null. */
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
      alert(locale === 'ru'
        ? `Ошибки валидации:\n${errors}`
        : `Validation errors:\n${errors}`);
      return null;
    }

    return validation.data as GyxerProject;
  }, [entities, locale]);

  /** Generate as ZIP download */
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
      alert(locale === 'ru'
        ? `Ошибка генерации: ${err}`
        : `Generation error: ${err}`);
    } finally {
      setGenerating(false);
    }
  }, [validateSchema, locale]);

  /** Generate directly to a user-selected folder */
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
      // User cancelled the picker
      if (err?.name === 'AbortError') {
        // do nothing
      } else {
        console.error('Generation error:', err);
        alert(locale === 'ru'
          ? `Ошибка генерации: ${err}`
          : `Generation error: ${err}`);
      }
    } finally {
      setGenerating(false);
    }
  }, [validateSchema, locale]);

  const handleLocaleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLocale(e.target.value as Locale);
    },
    [setLocale],
  );

  const canGenerate = !generating && entities.length > 0;
  const hasFolderSupport = supportsDirectoryPicker();

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 bg-gyxer-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <span className="font-semibold text-gray-800">Gyxer Studio</span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Add Entity */}
      <button
        onClick={handleAddEntity}
        className="px-3 py-1.5 bg-gyxer-600 text-white rounded text-sm hover:bg-gyxer-700 transition-colors"
      >
        {t('toolbar.addEntity')}
      </button>

      <div className="flex-1" />

      {/* Language selector */}
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:border-gyxer-400 transition-colors cursor-pointer"
      >
        <option value="en">🇬🇧 English</option>
        <option value="ru">🇷🇺 Русский</option>
      </select>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Export JSON */}
      <button
        onClick={handleExportJson}
        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
      >
        {t('toolbar.exportJson')}
      </button>

      {/* Generate — dropdown with folder / zip options */}
      <div className="relative">
        <button
          onClick={() => {
            if (hasFolderSupport) {
              setShowGenMenu((prev) => !prev);
            } else {
              handleGenerateZip();
            }
          }}
          disabled={!canGenerate}
          className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
            !canGenerate
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
          }`}
        >
          {generating
            ? locale === 'ru' ? '⏳ Генерация...' : '⏳ Generating...'
            : t('toolbar.generate')}
        </button>

        {/* Dropdown menu */}
        {showGenMenu && canGenerate && (
          <>
            {/* Invisible overlay to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowGenMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={handleGenerateToFolder}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <span>📁</span>
                <div>
                  <div className="font-medium text-gray-800">
                    {locale === 'ru' ? 'В папку...' : 'To folder...'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {locale === 'ru' ? 'Выбрать директорию' : 'Select a directory'}
                  </div>
                </div>
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleGenerateZip}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <span>📦</span>
                <div>
                  <div className="font-medium text-gray-800">
                    {locale === 'ru' ? 'Скачать ZIP' : 'Download ZIP'}
                  </div>
                  <div className="text-xs text-gray-500">
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
