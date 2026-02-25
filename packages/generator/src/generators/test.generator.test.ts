import { describe, it, expect } from 'vitest';
import { generateServiceSpec, generateControllerSpec } from './test.generator.js';
import type { Entity, GyxerProject } from '@gyxer-studio/schema';

/* ─── Helpers ───────────────────────────────────────── */

function makeProject(overrides: Partial<GyxerProject> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: '',
    entities: [],
    modules: [],
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

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    name: 'Post',
    fields: [
      { name: 'title', type: 'string', required: true, unique: false, index: false },
      { name: 'content', type: 'text', required: true, unique: false, index: false },
    ],
    relations: [],
    ...overrides,
  };
}

/* ─── Service Spec ──────────────────────────────────── */

describe('generateServiceSpec', () => {
  it('generates a valid NestJS service spec', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain("import { Test, TestingModule } from '@nestjs/testing'");
    expect(spec).toContain("import { NotFoundException } from '@nestjs/common'");
    expect(spec).toContain("import { PostService } from './post.service'");
    expect(spec).toContain("import { PrismaService } from '../prisma/prisma.service'");
  });

  it('includes all CRUD test blocks', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain("describe('create'");
    expect(spec).toContain("describe('findAll'");
    expect(spec).toContain("describe('findOne'");
    expect(spec).toContain("describe('update'");
    expect(spec).toContain("describe('remove'");
  });

  it('uses camelCase model name in prisma mock', () => {
    const entity = makeEntity({ name: 'BlogPost' });
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain('mockPrisma.blogPost.create');
    expect(spec).toContain('mockPrisma.blogPost.findMany');
    expect(spec).toContain('mockPrisma.blogPost.findUnique');
    expect(spec).toContain('mockPrisma.blogPost.update');
    expect(spec).toContain('mockPrisma.blogPost.delete');
  });

  it('generates sample DTO values from field types', () => {
    const entity = makeEntity({
      name: 'Item',
      fields: [
        { name: 'name', type: 'string', required: true, unique: false, index: false },
        { name: 'count', type: 'int', required: true, unique: false, index: false },
        { name: 'active', type: 'boolean', required: true, unique: false, index: false },
      ],
    });
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain("name: 'test-name'");
    expect(spec).toContain('count: 42');
    expect(spec).toContain('active: true');
  });

  it('tests NotFoundException on findOne/update/remove', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    // 3 NotFoundException tests: findOne, update, remove
    const matches = spec.match(/rejects\.toThrow\(NotFoundException\)/g);
    expect(matches).toHaveLength(3);
  });

  it('adds bcrypt mock and auth tests for User with auth-jwt', () => {
    const entity = makeEntity({
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true, index: true },
        { name: 'name', type: 'string', required: true, unique: false, index: false },
      ],
    });
    const project = makeProject({
      entities: [entity],
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain("jest.mock('bcrypt'");
    expect(spec).toContain('should hash password on create');
    expect(spec).toContain('should exclude passwordHash from results');
    expect(spec).toContain("password: 'StrongP@ss1'"); // pragma: allowlist secret
  });

  it('does NOT add auth tests for User without auth-jwt', () => {
    const entity = makeEntity({ name: 'User' });
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).not.toContain("jest.mock('bcrypt'");
    expect(spec).not.toContain('should hash password');
  });

  it('handles enum fields with sample values', () => {
    const entity = makeEntity({
      name: 'Task',
      fields: [
        { name: 'status', type: 'enum', required: true, unique: false, index: false, enumValues: ['OPEN', 'CLOSED'] },
      ],
    });
    const project = makeProject({ entities: [entity] });
    const spec = generateServiceSpec(entity, project);

    expect(spec).toContain("status: 'OPEN'");
  });
});

/* ─── Controller Spec ───────────────────────────────── */

describe('generateControllerSpec', () => {
  it('generates a valid NestJS controller spec', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain("import { Test, TestingModule } from '@nestjs/testing'");
    expect(spec).toContain("import { PostController } from './post.controller'");
    expect(spec).toContain("import { PostService } from './post.service'");
  });

  it('includes all CRUD test blocks', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain("describe('create'");
    expect(spec).toContain("describe('findAll'");
    expect(spec).toContain("describe('findOne'");
    expect(spec).toContain("describe('update'");
    expect(spec).toContain("describe('remove'");
  });

  it('mocks the service properly', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain('mockService.create.mockResolvedValue');
    expect(spec).toContain('mockService.findAll.mockResolvedValue');
    expect(spec).toContain('mockService.findOne.mockResolvedValue');
    expect(spec).toContain('mockService.update.mockResolvedValue');
    expect(spec).toContain('mockService.remove.mockResolvedValue');
  });

  it('uses correct class names for multi-word entities', () => {
    const entity = makeEntity({ name: 'OrderItem' });
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain('OrderItemController');
    expect(spec).toContain('OrderItemService');
    expect(spec).toContain("import { OrderItemController } from './order-item.controller'");
    expect(spec).toContain("import { OrderItemService } from './order-item.service'");
  });

  it('verifies service method calls with arguments', () => {
    const entity = makeEntity();
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain('mockService.create).toHaveBeenCalledWith(dto)');
    expect(spec).toContain('mockService.findOne).toHaveBeenCalledWith(1)');
    expect(spec).toContain('mockService.update).toHaveBeenCalledWith(1, dto)');
    expect(spec).toContain('mockService.remove).toHaveBeenCalledWith(1)');
  });

  it('includes sample DTO based on field types', () => {
    const entity = makeEntity({
      name: 'Product',
      fields: [
        { name: 'name', type: 'string', required: true, unique: false, index: false },
        { name: 'price', type: 'float', required: true, unique: false, index: false },
      ],
    });
    const project = makeProject({ entities: [entity] });
    const spec = generateControllerSpec(entity, project);

    expect(spec).toContain("name: 'test-name'");
    expect(spec).toContain('price: 3.14');
  });
});
