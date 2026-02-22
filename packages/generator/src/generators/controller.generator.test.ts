import { describe, it, expect } from 'vitest';
import { generateController } from './controller.generator.js';
import type { GyxerProject, Entity } from '@gyxer/schema';

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

const userEntity: Entity = {
  name: 'User',
  fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
  relations: [],
};

const orderItemEntity: Entity = {
  name: 'OrderItem',
  fields: [{ name: 'quantity', type: 'int', required: true, unique: false, index: false }],
  relations: [],
};

describe('Controller Generator', () => {
  it('should generate controller class with correct naming', () => {
    const ctrl = generateController(userEntity, baseProject);

    expect(ctrl).toContain('export class UserController');
    expect(ctrl).toContain('UserService');
    expect(ctrl).toContain("@Controller('users')");
    expect(ctrl).toContain("@ApiTags('users')");
  });

  it('should generate all CRUD endpoints', () => {
    const ctrl = generateController(userEntity, baseProject);

    expect(ctrl).toContain('@Post()');
    expect(ctrl).toContain('@Get()');
    expect(ctrl).toContain("@Get(':id')");
    expect(ctrl).toContain("@Patch(':id')");
    expect(ctrl).toContain("@Delete(':id')");
  });

  it('should use ParseIntPipe for id params', () => {
    const ctrl = generateController(userEntity, baseProject);

    expect(ctrl).toContain('ParseIntPipe');
    expect(ctrl).toContain("@Param('id', ParseIntPipe) id: number");
  });

  it('should import and use DTOs', () => {
    const ctrl = generateController(userEntity, baseProject);

    expect(ctrl).toContain('CreateUserDto');
    expect(ctrl).toContain('UpdateUserDto');
    expect(ctrl).toContain("from './dto/create-user.dto'");
    expect(ctrl).toContain("from './dto/update-user.dto'");
  });

  it('should include Swagger decorators', () => {
    const ctrl = generateController(userEntity, baseProject);

    expect(ctrl).toContain('@ApiOperation');
    expect(ctrl).toContain('@ApiResponse');
    expect(ctrl).toContain("status: 201");
    expect(ctrl).toContain("status: 200");
    expect(ctrl).toContain("status: 404");
  });

  it('should pluralize route correctly for multi-word entities', () => {
    const ctrl = generateController(orderItemEntity, baseProject);

    expect(ctrl).toContain("@Controller('order-items')");
    expect(ctrl).toContain("@ApiTags('order-items')");
    expect(ctrl).toContain('OrderItemService');
    expect(ctrl).toContain('export class OrderItemController');
  });

  describe('with auth-jwt', () => {
    const projectWithAuth: GyxerProject = {
      ...baseProject,
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    };

    it('should add @Public() on GET endpoints', () => {
      const ctrl = generateController(userEntity, projectWithAuth);

      expect(ctrl).toContain('@Public()');
      expect(ctrl).toContain("from '../auth/decorators/public.decorator'");
    });

    it('should add @ApiBearerAuth() on mutating endpoints', () => {
      const ctrl = generateController(userEntity, projectWithAuth);

      expect(ctrl).toContain('@ApiBearerAuth()');
      expect(ctrl).toContain('ApiBearerAuth');
    });

    it('should import ApiBearerAuth from swagger', () => {
      const ctrl = generateController(userEntity, projectWithAuth);

      expect(ctrl).toContain("ApiBearerAuth } from '@nestjs/swagger'");
    });
  });

  describe('without auth-jwt', () => {
    it('should NOT include @Public() decorator', () => {
      const ctrl = generateController(userEntity, baseProject);

      expect(ctrl).not.toContain('@Public()');
      expect(ctrl).not.toContain('public.decorator');
    });

    it('should NOT include @ApiBearerAuth()', () => {
      const ctrl = generateController(userEntity, baseProject);

      expect(ctrl).not.toContain('@ApiBearerAuth()');
    });
  });
});
