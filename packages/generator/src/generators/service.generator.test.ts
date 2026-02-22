import { describe, it, expect } from 'vitest';
import { generateService } from './service.generator.js';
import type { GyxerProject, Entity } from '@gyxer-studio/schema';

const baseProject: GyxerProject = {
  name: 'test-app',
  version: '0.1.0',
  description: 'Test',
  entities: [],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: false,
    docker: false,
  },
};

const postEntity: Entity = {
  name: 'Post',
  fields: [
    { name: 'title', type: 'string', required: true, unique: false, index: false },
    { name: 'content', type: 'text', required: true, unique: false, index: false },
  ],
  relations: [],
};

const userEntity: Entity = {
  name: 'User',
  fields: [
    { name: 'email', type: 'string', required: true, unique: true, index: false },
    { name: 'name', type: 'string', required: true, unique: false, index: false },
  ],
  relations: [],
};

describe('Service Generator', () => {
  describe('standard entity (no auth)', () => {
    it('should generate service class with correct naming', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('export class PostService');
      expect(svc).toContain('@Injectable()');
      expect(svc).toContain('PrismaService');
    });

    it('should generate all CRUD methods', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('async create(');
      expect(svc).toContain('async findAll()');
      expect(svc).toContain('async findOne(id: number)');
      expect(svc).toContain('async update(id: number');
      expect(svc).toContain('async remove(id: number)');
    });

    it('should use camelCase for Prisma model name', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('this.prisma.post.create');
      expect(svc).toContain('this.prisma.post.findMany');
      expect(svc).toContain('this.prisma.post.findUnique');
      expect(svc).toContain('this.prisma.post.update');
      expect(svc).toContain('this.prisma.post.delete');
    });

    it('should throw NotFoundException for missing records', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('NotFoundException');
      expect(svc).toContain('not found');
    });

    it('should import DTO types', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('CreatePostDto');
      expect(svc).toContain('UpdatePostDto');
      expect(svc).toContain("from './dto/create-post.dto'");
      expect(svc).toContain("from './dto/update-post.dto'");
    });

    it('should use Prisma UncheckedCreateInput type cast', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).toContain('Prisma.PostUncheckedCreateInput');
    });

    it('should NOT import bcrypt for non-User entity', () => {
      const svc = generateService(postEntity, baseProject);

      expect(svc).not.toContain('bcrypt');
    });
  });

  describe('User entity with auth-jwt', () => {
    const projectWithAuth: GyxerProject = {
      ...baseProject,
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    };

    it('should import bcrypt', () => {
      const svc = generateService(userEntity, projectWithAuth);

      expect(svc).toContain("import * as bcrypt from 'bcrypt'");
    });

    it('should hash password in create method', () => {
      const svc = generateService(userEntity, projectWithAuth);

      expect(svc).toContain('bcrypt.hash(password, 12)');
      expect(svc).toContain('passwordHash');
      expect(svc).toContain('const { password, ...rest } = dto');
    });

    it('should exclude passwordHash from findAll select', () => {
      const svc = generateService(userEntity, projectWithAuth);

      expect(svc).toContain('select:');
      expect(svc).toContain('email: true');
      expect(svc).toContain('name: true');
      // Should NOT include passwordHash in select
      expect(svc).not.toContain('passwordHash: true');
    });

    it('should exclude passwordHash from findOne select', () => {
      const svc = generateService(userEntity, projectWithAuth);

      // findOne should also use select to exclude password
      const findOneMatch = svc.match(/findOne[\s\S]*?findUnique\(\{[\s\S]*?\}\)/);
      expect(findOneMatch).not.toBeNull();
      expect(findOneMatch![0]).toContain('select:');
    });
  });

  describe('User entity without auth-jwt', () => {
    it('should NOT import bcrypt', () => {
      const svc = generateService(userEntity, baseProject);

      expect(svc).not.toContain('bcrypt');
    });

    it('should NOT hash password', () => {
      const svc = generateService(userEntity, baseProject);

      expect(svc).not.toContain('passwordHash');
    });

    it('should use standard findMany without select', () => {
      const svc = generateService(userEntity, baseProject);

      expect(svc).toContain('this.prisma.user.findMany()');
    });
  });
});
