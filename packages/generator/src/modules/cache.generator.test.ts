import { describe, it, expect } from 'vitest';
import { generateCacheFiles, getCacheDependencies, getCacheEnvVars } from './cache.generator.js';
import type { GyxerProject } from '@gyxer-studio/schema';

const baseProject: GyxerProject = {
  name: 'test-app',
  version: '0.1.0',
  description: 'Test app',
  entities: [
    {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [],
    },
  ],
  modules: [{ name: 'cache', enabled: true, options: {} }],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: true,
  },
};

describe('Cache Generator', () => {
  it('should generate cache module and service files', () => {
    const files = generateCacheFiles(baseProject);
    expect(files.size).toBe(2);
    expect(files.has('src/cache/cache.module.ts')).toBe(true);
    expect(files.has('src/cache/cache.service.ts')).toBe(true);
  });

  it('should use default TTL and max when no options', () => {
    const files = generateCacheFiles(baseProject);
    const moduleContent = files.get('src/cache/cache.module.ts')!;
    expect(moduleContent).toContain('ttl: 300 * 1000');
    expect(moduleContent).toContain('lruSize: 100');
  });

  it('should use custom TTL and max from options', () => {
    const customProject: GyxerProject = {
      ...baseProject,
      modules: [{ name: 'cache', enabled: true, options: { ttl: 600, maxItems: 500 } }],
    };
    const files = generateCacheFiles(customProject);
    const moduleContent = files.get('src/cache/cache.module.ts')!;
    expect(moduleContent).toContain('ttl: 600 * 1000');
    expect(moduleContent).toContain('lruSize: 500');
  });

  it('should generate cache module with Redis and memory stores', () => {
    const files = generateCacheFiles(baseProject);
    const moduleContent = files.get('src/cache/cache.module.ts')!;
    expect(moduleContent).toContain('createKeyv');
    expect(moduleContent).toContain('CacheableMemory');
    expect(moduleContent).toContain('REDIS_URL');
  });

  it('should generate cache service with get/set/del/reset methods', () => {
    const files = generateCacheFiles(baseProject);
    const serviceContent = files.get('src/cache/cache.service.ts')!;
    expect(serviceContent).toContain('async get<T>');
    expect(serviceContent).toContain('async set<T>');
    expect(serviceContent).toContain('async del(');
    expect(serviceContent).toContain('async reset()');
    expect(serviceContent).toContain('CACHE_MANAGER');
  });

  it('should return correct dependencies', () => {
    const deps = getCacheDependencies();
    expect(deps['@nestjs/cache-manager']).toBeDefined();
    expect(deps['cache-manager']).toBeDefined();
    expect(deps['@keyv/redis']).toBeDefined();
  });

  it('should return REDIS_URL env var', () => {
    const env = getCacheEnvVars();
    expect(env).toContain('REDIS_URL=');
  });
});
