import { describe, it, expect } from 'vitest';
import { generatePrismaSchema } from './prisma.generator.js';
import type { GyxerProject } from '@gyxer/schema';

const baseProject: GyxerProject = {
  name: 'test-app',
  version: '0.1.0',
  description: 'Test',
  entities: [
    {
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true, index: false },
        { name: 'name', type: 'string', required: true, unique: false, index: false },
        { name: 'isActive', type: 'boolean', required: true, unique: false, index: false, default: true },
      ],
      relations: [
        { name: 'posts', type: 'one-to-many', target: 'Post', foreignKey: 'authorId', onDelete: 'CASCADE' },
      ],
    },
    {
      name: 'Post',
      description: 'Blog post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'slug', type: 'string', required: true, unique: true, index: true },
        { name: 'content', type: 'text', required: true, unique: false, index: false },
        {
          name: 'status',
          type: 'enum',
          required: true,
          unique: false,
          index: false,
          default: 'DRAFT',
          enumValues: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        },
        { name: 'viewCount', type: 'int', required: true, unique: false, index: false, default: 0 },
      ],
      relations: [],
    },
  ],
  modules: [],
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

describe('Prisma Generator', () => {
  it('should generate schema matching snapshot', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toMatchSnapshot();
  });

  it('should include datasource with correct provider', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('provider = "postgresql"');
  });

  it('should generate enum for enum fields', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('enum PostStatus');
    expect(schema).toContain('DRAFT');
    expect(schema).toContain('PUBLISHED');
    expect(schema).toContain('ARCHIVED');
  });

  it('should add unique attribute', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('@unique');
  });

  it('should add index attribute', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('@index');
  });

  it('should add default values', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('@default(true)');
    expect(schema).toContain('@default(0)');
    expect(schema).toContain('@default(DRAFT)');
  });

  it('should generate relation with foreign key', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('authorId');
    expect(schema).toContain('@relation(fields: [authorId], references: [id]');
  });

  it('should generate table mapping', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).toContain('@@map("user")');
    expect(schema).toContain('@@map("post")');
  });

  it('should add passwordHash when auth-jwt enabled', () => {
    const projectWithAuth = {
      ...baseProject,
      modules: [{ name: 'auth-jwt' as const, enabled: true, options: {} }],
    };
    const schema = generatePrismaSchema(projectWithAuth);
    expect(schema).toContain('passwordHash');
    expect(schema).toContain('@map("password_hash")');
  });

  it('should NOT add passwordHash when auth-jwt disabled', () => {
    const schema = generatePrismaSchema(baseProject);
    expect(schema).not.toContain('passwordHash');
  });
});
