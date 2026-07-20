import { describe, it, expect } from 'vitest';
import type { GyxerProject } from '@gyxer-studio/schema';
import {
  generateSearchFiles,
  getSearchDependencies,
  getSearchEnvVars,
} from './search.generator.js';

function makeProject(moduleOptions: Record<string, unknown> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: '',
    entities: [
      {
        name: 'Post',
        fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
        relations: [],
      },
      {
        name: 'Comment',
        fields: [{ name: 'body', type: 'text', required: true, unique: false, index: false }],
        relations: [],
      },
    ],
    modules: [{ name: 'search', enabled: true, options: moduleOptions }],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: 'postgresql://localhost/test',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'postgres',
      dbPassword: 'postgres',
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: false,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: true,
    },
  };
}

describe('search.generator', () => {
  it('should generate 3 files', () => {
    const files = generateSearchFiles(makeProject());
    expect(files.size).toBe(3);
    expect(files.has('src/search/search.module.ts')).toBe(true);
    expect(files.has('src/search/search.service.ts')).toBe(true);
    expect(files.has('src/search/search.controller.ts')).toBe(true);
  });

  it('should index all entities by default', () => {
    const files = generateSearchFiles(makeProject());
    const service = files.get('src/search/search.service.ts')!;
    expect(service).toContain("'post'");
    expect(service).toContain("'comment'");
  });

  it('should index only specified entities', () => {
    const files = generateSearchFiles(makeProject({ indexableEntities: ['Post'] }));
    const service = files.get('src/search/search.service.ts')!;
    expect(service).toContain("'post'");
    expect(service).not.toContain("'comment'");
  });

  it('should use MeiliSearch client', () => {
    const files = generateSearchFiles(makeProject());
    const service = files.get('src/search/search.service.ts')!;
    expect(service).toContain('MeiliSearch');
    expect(service).toContain('MEILISEARCH_HOST');
    expect(service).toContain('MEILISEARCH_API_KEY');
  });

  it('should generate controller with search and reindex endpoints', () => {
    const files = generateSearchFiles(makeProject());
    const controller = files.get('src/search/search.controller.ts')!;
    expect(controller).toContain("@Get()");
    expect(controller).toContain("@Get('indexes')");
    expect(controller).toContain("@Post(':index/reindex')");
    expect(controller).toContain("@ApiTags('search')");
  });

  it('should validate index and query instead of leaking Meili 500s', () => {
    const files = generateSearchFiles(makeProject());
    const controller = files.get('src/search/search.controller.ts')!;
    // missing q/index → 400, unknown index → 404 with the known-index list,
    // empty reindex body → 400
    expect(controller).toContain('BadRequestException');
    expect(controller).toContain('NotFoundException');
    expect(controller).toContain('assertKnownIndex');
    expect(controller).toContain('Available:');
    expect(controller).toContain('non-empty JSON array');
  });

  it('should generate module with correct exports', () => {
    const files = generateSearchFiles(makeProject());
    const module = files.get('src/search/search.module.ts')!;
    expect(module).toContain('SearchService');
    expect(module).toContain('SearchController');
    expect(module).toContain('exports: [SearchService]');
  });

  it('should return correct dependencies', () => {
    const deps = getSearchDependencies();
    expect(deps).toHaveProperty('meilisearch');
  });

  it('should return env vars with MeiliSearch config', () => {
    const env = getSearchEnvVars();
    expect(env).toContain('MEILISEARCH_HOST');
    expect(env).toContain('MEILISEARCH_API_KEY');
  });
});
