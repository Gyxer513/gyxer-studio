import type { Entity, Field, GyxerProject } from '@gyxer-studio/schema';
import { toCamelCase, toKebabCase } from '../utils.js';

/**
 * Generate a sample value string for a field based on its type.
 */
function sampleValue(field: Field): string {
  switch (field.type) {
    case 'string':
      return `'test-${field.name}'`;
    case 'text':
      return `'Sample ${field.name} text'`;
    case 'int':
      return '42';
    case 'float':
      return '3.14';
    case 'boolean':
      return 'true';
    case 'datetime':
      return `'2025-01-01T00:00:00.000Z'`;
    case 'enum':
      return field.enumValues?.length ? `'${field.enumValues[0]}'` : `'VALUE'`;
    case 'json':
      return '{}';
    case 'uuid':
      return `'550e8400-e29b-41d4-a716-446655440000'`;
    default:
      return `'test'`;
  }
}

/**
 * Build a sample DTO object literal from entity fields.
 */
function buildSampleDto(entity: Entity, project: GyxerProject): string {
  const hasAuthJwt =
    entity.name === 'User' &&
    project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false);

  const lines = entity.fields
    .filter((f) => f.required)
    .map((f) => `      ${f.name}: ${sampleValue(f)},`);

  if (hasAuthJwt) {
    lines.push(`      password: 'StrongP@ss1',`);
  }

  return `{\n${lines.join('\n')}\n    }`;
}

/**
 * Generate a NestJS service spec file for an entity.
 */
export function generateServiceSpec(entity: Entity, project: GyxerProject): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const className = `${name}Service`;

  const hasAuthJwt =
    name === 'User' &&
    project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false);

  const sampleDto = buildSampleDto(entity, project);

  const bcryptMock = hasAuthJwt
    ? `\njest.mock('bcrypt', () => ({\n  hash: jest.fn().mockResolvedValue('hashed-password'),\n}));\n`
    : '';

  const authCreateTests = hasAuthJwt
    ? `
    it('should hash password on create', async () => {
      const dto = ${sampleDto};
      mockPrisma.${camel}.create.mockResolvedValue({ id: 1, email: dto.email, passwordHash: 'hashed-password' });
      await service.create(dto as any);
      const callArgs = mockPrisma.${camel}.create.mock.calls[0][0];
      expect(callArgs.data.passwordHash).toBeDefined();
    });
`
    : '';

  const authFindAllTest = hasAuthJwt
    ? `
    it('should exclude passwordHash from results', async () => {
      mockPrisma.${camel}.findMany.mockResolvedValue([
        { id: 1, email: 'a@b.com', passwordHash: 'secret' },
      ]);
      const result = await service.findAll();
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
`
    : '';

  return `import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ${className} } from './${kebab}.service';
import { PrismaService } from '../prisma/prisma.service';
${bcryptMock}
describe('${className}', () => {
  let service: ${className};

  const mockPrisma = {
    ${camel}: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${className},
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<${className}>(${className});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ${camel}', async () => {
      const dto = ${sampleDto};
      mockPrisma.${camel}.create.mockResolvedValue({ id: 1, ...dto });
      const result = await service.create(dto as any);
      expect(result).toBeDefined();
      expect(mockPrisma.${camel}.create).toHaveBeenCalled();
    });
${authCreateTests}  });

  describe('findAll', () => {
    it('should return an array', async () => {
      mockPrisma.${camel}.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
${authFindAllTest}  });

  describe('findOne', () => {
    it('should return a ${camel} by id', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue({ id: 1 });
      const result = await service.findOne(1);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a ${camel}', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.${camel}.update.mockResolvedValue({ id: 1, updated: true });
      const result = await service.update(1, {} as any);
      expect(result).toBeDefined();
      expect(mockPrisma.${camel}.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a ${camel}', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.${camel}.delete.mockResolvedValue({ id: 1 });
      const result = await service.remove(1);
      expect(result).toBeDefined();
      expect(mockPrisma.${camel}.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
`;
}

/**
 * Generate a NestJS controller spec file for an entity.
 */
export function generateControllerSpec(entity: Entity, project: GyxerProject): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const className = `${name}Controller`;
  const serviceName = `${name}Service`;

  const sampleDto = buildSampleDto(entity, project);

  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${className} } from './${kebab}.controller';
import { ${serviceName} } from './${kebab}.service';

describe('${className}', () => {
  let controller: ${className};

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${className}],
      providers: [
        { provide: ${serviceName}, useValue: mockService },
      ],
    }).compile();

    controller = module.get<${className}>(${className});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a ${camel}', async () => {
      const dto = ${sampleDto};
      const expected = { id: 1, ...dto };
      mockService.create.mockResolvedValue(expected);
      const result = await controller.create(dto as any);
      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const expected = [{ id: 1 }, { id: 2 }];
      mockService.findAll.mockResolvedValue(expected);
      const result = await controller.findAll();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a ${camel} by id', async () => {
      const expected = { id: 1 };
      mockService.findOne.mockResolvedValue(expected);
      const result = await controller.findOne(1);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a ${camel}', async () => {
      const dto = ${sampleDto};
      const expected = { id: 1, ...dto };
      mockService.update.mockResolvedValue(expected);
      const result = await controller.update(1, dto as any);
      expect(result).toEqual(expected);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should delete a ${camel}', async () => {
      const expected = { id: 1 };
      mockService.remove.mockResolvedValue(expected);
      const result = await controller.remove(1);
      expect(result).toEqual(expected);
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});
`;
}
