import type { Entity, GyxerProject } from '@gyxer/schema';
import { toCamelCase, toKebabCase } from '../utils.js';

/**
 * Generate a NestJS service for an entity with full CRUD.
 */
export function generateService(entity: Entity, project: GyxerProject): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const className = `${name}Service`;

  const hasAuthJwt =
    name === 'User' &&
    project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false);

  // User + auth-jwt: create method hashes password
  if (hasAuthJwt) {
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Create${name}Dto } from './dto/create-${toKebabCase(name)}.dto';
import { Update${name}Dto } from './dto/update-${toKebabCase(name)}.dto';

@Injectable()
export class ${className} {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Create${name}Dto) {
    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 12);
    return this.prisma.${camel}.create({ data: { ...rest, passwordHash } as Prisma.${name}UncheckedCreateInput });
  }

  async findAll() {
    return this.prisma.${camel}.findMany({
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(id: number) {
    const ${camel} = await this.prisma.${camel}.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!${camel}) {
      throw new NotFoundException(\`${name} with id \${id} not found\`);
    }
    return ${camel};
  }

  async update(id: number, data: Update${name}Dto) {
    await this.findOne(id);
    return this.prisma.${camel}.update({ where: { id }, data: data as Prisma.${name}UncheckedUpdateInput });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;
  }

  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Create${name}Dto } from './dto/create-${toKebabCase(name)}.dto';
import { Update${name}Dto } from './dto/update-${toKebabCase(name)}.dto';

@Injectable()
export class ${className} {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Create${name}Dto) {
    return this.prisma.${camel}.create({ data: data as Prisma.${name}UncheckedCreateInput });
  }

  async findAll() {
    return this.prisma.${camel}.findMany();
  }

  async findOne(id: number) {
    const ${camel} = await this.prisma.${camel}.findUnique({ where: { id } });
    if (!${camel}) {
      throw new NotFoundException(\`${name} with id \${id} not found\`);
    }
    return ${camel};
  }

  async update(id: number, data: Update${name}Dto) {
    await this.findOne(id);
    return this.prisma.${camel}.update({ where: { id }, data: data as Prisma.${name}UncheckedUpdateInput });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;
}
