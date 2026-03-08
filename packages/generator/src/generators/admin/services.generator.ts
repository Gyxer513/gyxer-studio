import type { GyxerProject, Entity } from '@gyxer-studio/schema';
import { toKebabCase, toCamelCase, pluralize } from '../../utils.js';

/**
 * Generate admin/src/lib/api.ts — axios instance with auth interceptor.
 */
export function generateApiClient(hasAuth: boolean): string {
  const lines: string[] = [];
  lines.push(`import axios from 'axios';`);
  lines.push('');
  lines.push(`const api = axios.create({`);
  lines.push(`  baseURL: '/api',`);
  lines.push(`  headers: { 'Content-Type': 'application/json' },`);
  lines.push(`});`);
  lines.push('');

  if (hasAuth) {
    lines.push('// Request interceptor — attach JWT token');
    lines.push('api.interceptors.request.use((config) => {');
    lines.push(`  const token = localStorage.getItem('access_token');`);
    lines.push('  if (token) {');
    lines.push('    config.headers.Authorization = `Bearer ${token}`;');
    lines.push('  }');
    lines.push('  return config;');
    lines.push('});');
    lines.push('');
    lines.push('// Response interceptor — handle 401');
    lines.push('api.interceptors.response.use(');
    lines.push('  (response) => response,');
    lines.push('  (error) => {');
    lines.push('    if (error.response?.status === 401) {');
    lines.push(`      localStorage.removeItem('access_token');`);
    lines.push(`      window.location.href = '/login';`);
    lines.push('    }');
    lines.push('    return Promise.reject(error);');
    lines.push('  },');
    lines.push(');');
    lines.push('');
  }

  lines.push('export default api;');
  return lines.join('\n') + '\n';
}

/**
 * Generate API service for a single entity.
 * e.g. services/post.service.ts
 */
export function generateEntityService(entity: Entity): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(kebab);

  return `import api from '../lib/api';

const BASE = '/${plural}';

export const ${camel}Service = {
  list: (params?: Record<string, unknown>) =>
    api.get(BASE, { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get(\`\${BASE}/\${id}\`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    api.post(BASE, data).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(\`\${BASE}/\${id}\`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(\`\${BASE}/\${id}\`).then((r) => r.data),
};
`;
}

/**
 * Generate all service files.
 */
export function generateServiceFiles(project: GyxerProject): Map<string, string> {
  const hasAuth = project.modules?.some(
    (m) => (m.name === 'auth-jwt' || m.name === 'auth-keycloak') && m.enabled !== false,
  ) ?? false;

  const files = new Map<string, string>();

  files.set('src/lib/api.ts', generateApiClient(hasAuth));

  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    files.set(`src/services/${kebab}.service.ts`, generateEntityService(entity));
  }

  return files;
}
