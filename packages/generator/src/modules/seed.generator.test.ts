import { describe, it, expect } from 'vitest';
import { generateSeedFile } from './seed.generator.js';
import type { GyxerProject } from '@gyxer-studio/schema';

/* ─── Helpers ───────────────────────────────────────── */

function makeProject(overrides: Partial<GyxerProject> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: '',
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
    modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/test_app', // pragma: allowlist secret
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: true,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: false,
    },
    ...overrides,
  };
}

/* ─── Tests ────────────────────────────────────────── */

describe('generateSeedFile', () => {
  it('should import PrismaClient and bcrypt', () => {
    const result = generateSeedFile(makeProject());
    expect(result).toContain("import { PrismaClient } from '@prisma/client'");
    expect(result).toContain("import * as bcrypt from 'bcrypt'");
  });

  it('should use bcrypt.hash with salt rounds 12', () => {
    const result = generateSeedFile(makeProject());
    expect(result).toContain("bcrypt.hash('password123', 12)");
  });

  it('should upsert user with admin@example.com', () => {
    const result = generateSeedFile(makeProject());
    expect(result).toContain("email: 'admin@example.com'");
    expect(result).toContain('prisma.user.upsert');
  });

  it('should include passwordHash in create data', () => {
    const result = generateSeedFile(makeProject());
    expect(result).toContain('passwordHash,');
  });

  it('should include extra required string fields from User entity', () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'name', type: 'string', required: true, unique: false, index: false },
            { name: 'bio', type: 'text', required: true, unique: false, index: false },
          ],
          relations: [],
        },
      ],
    });
    const result = generateSeedFile(project);
    expect(result).toContain("name: 'name',");
    expect(result).toContain("bio: 'bio',");
  });

  it('should handle boolean extra fields', () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'isActive', type: 'boolean', required: true, unique: false, index: false },
          ],
          relations: [],
        },
      ],
    });
    const result = generateSeedFile(project);
    expect(result).toContain('isActive: false,');
  });

  it('should handle int extra fields', () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'age', type: 'int', required: true, unique: false, index: false },
          ],
          relations: [],
        },
      ],
    });
    const result = generateSeedFile(project);
    expect(result).toContain('age: 0,');
  });

  it('should skip optional fields', () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'avatar', type: 'string', required: false, unique: false, index: false },
          ],
          relations: [],
        },
      ],
    });
    const result = generateSeedFile(project);
    expect(result).not.toContain('avatar');
  });

  it('should skip fields with defaults', () => {
    const project = makeProject({
      entities: [
        {
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'role', type: 'string', required: true, unique: false, index: false, default: 'user' },
          ],
          relations: [],
        },
      ],
    });
    const result = generateSeedFile(project);
    expect(result).not.toContain("role:");
  });

  it('should handle project without User entity', () => {
    const project = makeProject({ entities: [] });
    const result = generateSeedFile(project);
    expect(result).toContain('prisma.user.upsert');
    expect(result).toContain('passwordHash,');
    // No extra fields — just email + passwordHash
    expect(result).not.toContain("name: 'name',");
  });

  it('should disconnect prisma in finally block', () => {
    const result = generateSeedFile(makeProject());
    expect(result).toContain('prisma.$disconnect()');
  });

  describe('custom seedUsers from module options', () => {
    it('should use seedUsers from auth-jwt module options', () => {
      const project = makeProject({
        modules: [{
          name: 'auth-jwt',
          enabled: true,
          options: {
            seedUsers: [
              { email: 'custom@test.com', password: 'mypass' },
            ],
          },
        }],
      });
      const result = generateSeedFile(project);
      expect(result).toContain("email: 'custom@test.com'");
      expect(result).toContain("bcrypt.hash('mypass', 12)");
      expect(result).not.toContain('admin@example.com');
    });

    it('should generate multiple seed users', () => {
      const project = makeProject({
        modules: [{
          name: 'auth-jwt',
          enabled: true,
          options: {
            seedUsers: [
              { email: 'alice@test.com', password: 'pass1' },
              { email: 'bob@test.com', password: 'pass2' },
            ],
          },
        }],
      });
      const result = generateSeedFile(project);
      expect(result).toContain("email: 'alice@test.com'");
      expect(result).toContain("email: 'bob@test.com'");
      expect(result).toContain("bcrypt.hash('pass1', 12)");
      expect(result).toContain("bcrypt.hash('pass2', 12)");
    });

    it('should fall back to default admin when seedUsers is empty', () => {
      const project = makeProject({
        modules: [{
          name: 'auth-jwt',
          enabled: true,
          options: { seedUsers: [] },
        }],
      });
      const result = generateSeedFile(project);
      expect(result).toContain("email: 'admin@example.com'");
    });

    it('should use extraFields from seedUser when provided', () => {
      const project = makeProject({
        entities: [{
          name: 'User',
          fields: [
            { name: 'email', type: 'string', required: true, unique: true, index: true },
            { name: 'name', type: 'string', required: true, unique: false, index: false },
          ],
          relations: [],
        }],
        modules: [{
          name: 'auth-jwt',
          enabled: true,
          options: {
            seedUsers: [
              { email: 'admin@test.com', password: 'pass', name: 'Admin' },
            ],
          },
        }],
      });
      const result = generateSeedFile(project);
      expect(result).toContain("name: 'Admin',");
    });
  });
});
