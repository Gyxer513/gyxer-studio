import type { Entity } from '@gyxer/schema';
import { toCamelCase, toKebabCase } from '../utils.js';

/**
 * Generate a NestJS service for an entity with full CRUD.
 */
export function generateService(entity: Entity): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const className = `${name}Service`;

  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${name}Dto } from './dto/create-${toKebabCase(name)}.dto';
import { Update${name}Dto } from './dto/update-${toKebabCase(name)}.dto';

@Injectable()
export class ${className} {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Create${name}Dto) {
    return this.prisma.${camel}.create({ data });
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
    return this.prisma.${camel}.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;
}
