import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import type { GyxerProject } from '@gyxer-studio/schema';

// ─── Test helper ──────────────────────────────────────────────

function makeProject(overrides: Partial<GyxerProject> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: 'Test project',
    entities: [
      {
        name: 'User',
        fields: [
          { name: 'email', type: 'string', required: true, unique: true, index: true },
          { name: 'name', type: 'string', required: true, unique: false, index: false },
        ],
        relations: [],
      },
    ],
    modules: [],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/test_app',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'postgres',
      dbPassword: 'postgres',
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: true,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: true,
    },
    ...overrides,
  };
}

// ─── Mock filesystem ──────────────────────────────────────────

let mockFs: Map<string, string>;

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async (filePath: string) => {
    const content = mockFs.get(path.normalize(filePath));
    if (content === undefined) {
      throw Object.assign(new Error(`ENOENT: ${filePath}`), { code: 'ENOENT' });
    }
    return content;
  }),
  writeFile: vi.fn(async (filePath: string, data: string) => {
    mockFs.set(path.normalize(filePath), data);
  }),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn((filePath: string) => mockFs.has(path.normalize(filePath))),
}));

// ─── Imports (after mocks) ───────────────────────────────────

import {
  resolveProjectPath,
  readProject,
  readProjectRaw,
  writeProject,
  writeProjectRaw,
} from '../project-io.js';

// ──────────────────────────────────────────────────────────────
// project-io tests
// ──────────────────────────────────────────────────────────────

describe('project-io', () => {
  const cwd = '/test/dir';

  beforeEach(() => {
    mockFs = new Map();
  });

  it('resolveProjectPath returns gyxer.json when it exists', () => {
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), '{}');
    const result = resolveProjectPath(cwd);
    expect(result).toContain('gyxer.json');
  });

  it('resolveProjectPath falls back to project.json', () => {
    mockFs.set(path.normalize(path.join(cwd, 'project.json')), '{}');
    const result = resolveProjectPath(cwd);
    expect(result).toContain('project.json');
  });

  it('resolveProjectPath returns undefined when neither exists', () => {
    expect(resolveProjectPath(cwd)).toBeUndefined();
  });

  it('readProject parses valid project JSON', async () => {
    const project = makeProject();
    mockFs.set(
      path.normalize(path.join(cwd, 'gyxer.json')),
      JSON.stringify(project),
    );
    const result = await readProject(cwd);
    expect(result.name).toBe('test-app');
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].name).toBe('User');
  });

  it('readProject throws on missing file', async () => {
    await expect(readProject(cwd)).rejects.toThrow('No project file found');
  });

  it('readProjectRaw returns raw JSON object', async () => {
    const project = { name: 'raw-test', entities: [] };
    mockFs.set(
      path.normalize(path.join(cwd, 'gyxer.json')),
      JSON.stringify(project),
    );
    const raw = await readProjectRaw(cwd);
    expect(raw.name).toBe('raw-test');
  });

  it('writeProject validates before writing', async () => {
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), '{}');
    const project = makeProject();
    const result = await writeProject(project, cwd);
    expect(result.success).toBe(true);
    const written = JSON.parse(mockFs.get(path.normalize(path.join(cwd, 'gyxer.json')))!);
    expect(written.name).toBe('test-app');
  });

  it('writeProject returns errors on invalid project', async () => {
    const badProject = { ...makeProject(), entities: [] } as any;
    const result = await writeProject(badProject, cwd);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('writeProjectRaw writes without validation', async () => {
    const raw = { name: 'empty', entities: [] };
    await writeProjectRaw(raw, cwd);
    const written = JSON.parse(mockFs.get(path.normalize(path.join(cwd, 'gyxer.json')))!);
    expect(written.entities).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────
// Tool handler tests — we test the logic through project-io
// since tools are registered on McpServer and can't be called directly
// without the full MCP transport. We test the business logic.
// ──────────────────────────────────────────────────────────────

describe('createServer', () => {
  it('should create a server without errors', async () => {
    const { createServer } = await import('../server.js');
    const server = createServer();
    expect(server).toBeDefined();
  });
});

describe('entity operations (via project-io)', () => {
  const cwd = '/test/ops';

  beforeEach(() => {
    mockFs = new Map();
  });

  it('add entity to project', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities.push({
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities).toHaveLength(2);
    expect(reread.entities[1].name).toBe('Post');
  });

  it('reject duplicate entity', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities.push({
      name: 'User', // duplicate
      fields: [{ name: 'foo', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('Duplicate entity name'))).toBe(true);
  });

  it('remove entity and clean up relations', async () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [{ name: 'email', type: 'string', required: true, unique: true, index: true }],
          relations: [
            { name: 'posts', type: 'one-to-many', target: 'Post', foreignKey: 'authorId', onDelete: 'CASCADE' },
          ],
        },
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
          relations: [],
        },
      ],
    });
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    // Remove Post
    read.entities = read.entities.filter((e) => e.name !== 'Post');
    // Clean relations targeting Post
    for (const e of read.entities) {
      e.relations = e.relations.filter((r) => r.target !== 'Post');
    }

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities).toHaveLength(1);
    expect(reread.entities[0].relations).toHaveLength(0);
  });

  it('rename entity cascades to relations', async () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [{ name: 'email', type: 'string', required: true, unique: true, index: true }],
          relations: [
            { name: 'posts', type: 'one-to-many', target: 'Post', foreignKey: 'authorId', onDelete: 'CASCADE' },
          ],
        },
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
          relations: [],
        },
      ],
    });
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    const post = read.entities.find((e) => e.name === 'Post')!;
    // Rename Post → Article
    for (const e of read.entities) {
      for (const r of e.relations) {
        if (r.target === 'Post') r.target = 'Article';
      }
    }
    post.name = 'Article';

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities.find((e) => e.name === 'Article')).toBeDefined();
    expect(reread.entities[0].relations[0].target).toBe('Article');
  });
});

describe('field operations', () => {
  const cwd = '/test/fields';

  beforeEach(() => {
    mockFs = new Map();
  });

  it('add field to entity', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].fields.push({
      name: 'bio',
      type: 'text',
      required: false,
      unique: false,
      index: false,
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities[0].fields).toHaveLength(3);
    expect(reread.entities[0].fields[2].name).toBe('bio');
  });

  it('reject duplicate field name', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].fields.push({
      name: 'email', // duplicate
      type: 'string',
      required: true,
      unique: false,
      index: false,
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('Duplicate field name'))).toBe(true);
  });

  it('remove field from entity', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    // Remove 'name' field, keep 'email'
    read.entities[0].fields = read.entities[0].fields.filter((f) => f.name !== 'name');

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities[0].fields).toHaveLength(1);
    expect(reread.entities[0].fields[0].name).toBe('email');
  });
});

describe('relation operations', () => {
  const cwd = '/test/relations';

  beforeEach(() => {
    mockFs = new Map();
  });

  it('add relation between entities', async () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [{ name: 'email', type: 'string', required: true, unique: true, index: true }],
          relations: [],
        },
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
          relations: [],
        },
      ],
    });
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].relations.push({
      name: 'posts',
      type: 'one-to-many',
      target: 'Post',
      foreignKey: 'authorId',
      onDelete: 'CASCADE',
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.entities[0].relations).toHaveLength(1);
    expect(reread.entities[0].relations[0].target).toBe('Post');
  });

  it('reject relation to unknown entity', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].relations.push({
      name: 'orders',
      type: 'one-to-many',
      target: 'Order', // doesn't exist
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('unknown entity'))).toBe(true);
  });
});

describe('module operations', () => {
  const cwd = '/test/modules';

  beforeEach(() => {
    mockFs = new Map();
  });

  it('enable module', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.modules.push({ name: 'auth-jwt', enabled: true, options: {} });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.modules).toHaveLength(1);
    expect(reread.modules[0].name).toBe('auth-jwt');
  });

  it('enable multiple modules', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.modules.push(
      { name: 'auth-jwt', enabled: true, options: {} },
      { name: 'cache', enabled: true, options: {} },
      { name: 'admin-dashboard', enabled: true, options: {} },
    );

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.modules).toHaveLength(3);
  });

  it('disable module', async () => {
    const project = makeProject({
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    });
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    const mod = read.modules.find((m) => m.name === 'auth-jwt');
    expect(mod).toBeDefined();
    mod!.enabled = false;

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);

    const reread = await readProject(cwd);
    expect(reread.modules[0].enabled).toBe(false);
  });

  it('writeProjectRaw allows empty entities for create_project', async () => {
    const raw = {
      name: 'new-project',
      version: '0.1.0',
      description: '',
      entities: [],
      modules: [],
      settings: {
        port: 3000,
        database: 'postgresql',
        databaseUrl: 'postgresql://postgres:postgres@localhost:5432/new_project',
        dbHost: 'localhost',
        dbPort: 5432,
        dbUser: 'postgres',
        dbPassword: 'postgres',
        enableSwagger: true,
        enableCors: true,
        enableHelmet: true,
        enableRateLimit: true,
        rateLimitTtl: 60,
        rateLimitMax: 100,
        docker: true,
      },
    };

    await writeProjectRaw(raw, cwd);
    const written = JSON.parse(mockFs.get(path.normalize(path.join(cwd, 'gyxer.json')))!);
    expect(written.name).toBe('new-project');
    expect(written.entities).toEqual([]);
  });

  it('enum field validation - must have enumValues', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].fields.push({
      name: 'status',
      type: 'enum',
      required: true,
      unique: false,
      index: false,
      // missing enumValues!
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('enumValues'))).toBe(true);
  });

  it('enum field with enumValues passes validation', async () => {
    const project = makeProject();
    mockFs.set(path.normalize(path.join(cwd, 'gyxer.json')), JSON.stringify(project));

    const read = await readProject(cwd);
    read.entities[0].fields.push({
      name: 'role',
      type: 'enum',
      required: true,
      unique: false,
      index: false,
      enumValues: ['ADMIN', 'USER', 'MODERATOR'],
    });

    const result = await writeProject(read, cwd);
    expect(result.success).toBe(true);
  });
});
