import React, { useCallback } from 'react';
import { useProjectStore } from '../store/project-store';
import { exportToSchema } from '../utils/export';

export function Toolbar() {
  const { addEntity } = useProjectStore();

  const handleAddEntity = useCallback(() => {
    // Place new entity at a random position in the viewport
    const x = 100 + Math.random() * 400;
    const y = 100 + Math.random() * 300;
    addEntity({ x, y });
  }, [addEntity]);

  const handleExport = useCallback(() => {
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

      {/* Actions */}
      <button
        onClick={handleAddEntity}
        className="px-3 py-1.5 bg-gyxer-600 text-white rounded text-sm hover:bg-gyxer-700 transition-colors"
      >
        + Entity
      </button>

      <div className="flex-1" />

      {/* Export */}
      <button
        onClick={handleExport}
        className="px-3 py-1.5 border border-gyxer-600 text-gyxer-600 rounded text-sm hover:bg-gyxer-50 transition-colors"
      >
        Export JSON
      </button>
    </div>
  );
}
