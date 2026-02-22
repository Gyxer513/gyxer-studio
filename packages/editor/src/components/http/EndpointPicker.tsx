import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/project-store';
import { useHttpStore, type HttpRequest } from '../../store/http-store';
import { useTranslation } from '../../i18n';
import { generateEndpoints, type EndpointSuggestion } from '../../utils/endpoint-generator';
import { inputCls } from '../shared-styles';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-600',
  POST: 'text-blue-600',
  PATCH: 'text-orange-500',
  PUT: 'text-purple-600',
  DELETE: 'text-red-600',
};

export function EndpointPicker() {
  const { entities, modules } = useProjectStore();
  const { loadRequest } = useHttpStore();
  const { t } = useTranslation();

  const endpoints = useMemo(
    () => generateEndpoints(entities, modules),
    [entities, modules],
  );

  // Group by entity name
  const groups = useMemo(() => {
    const map = new Map<string, EndpointSuggestion[]>();
    for (const ep of endpoints) {
      const arr = map.get(ep.group) || [];
      arr.push(ep);
      map.set(ep.group, arr);
    }
    return map;
  }, [endpoints]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx) || !endpoints[idx]) return;
    const ep = endpoints[idx];
    const req: HttpRequest = {
      method: ep.method,
      path: ep.path,
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      body: ep.bodyTemplate,
    };
    loadRequest(req);
    // Reset select to placeholder
    e.target.value = '';
  };

  if (endpoints.length === 0) {
    return (
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-dark-700">
        <div className="text-xs text-dark-300 dark:text-dark-500 text-center py-1">
          {t('http.noEntities')}
        </div>
      </div>
    );
  }

  let optionIdx = 0;

  return (
    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-dark-700">
      <select
        onChange={handleSelect}
        defaultValue=""
        className={`${inputCls} text-xs`}
      >
        <option value="" disabled>
          {t('http.selectEndpoint')}
        </option>
        {Array.from(groups.entries()).map(([group, eps]) => (
          <optgroup key={group} label={group}>
            {eps.map((ep) => {
              const idx = optionIdx++;
              return (
                <option key={idx} value={idx}>
                  {ep.method} {ep.path}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
