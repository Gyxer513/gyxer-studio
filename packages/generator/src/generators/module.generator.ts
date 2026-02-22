import type { Entity } from '@gyxer-studio/schema';
import { toKebabCase } from '../utils.js';

/**
 * Generate a NestJS module for an entity.
 */
export function generateModule(entity: Entity): string {
  const name = entity.name;
  const kebab = toKebabCase(name);

  return `import { Module } from '@nestjs/common';
import { ${name}Service } from './${kebab}.service';
import { ${name}Controller } from './${kebab}.controller';

@Module({
  controllers: [${name}Controller],
  providers: [${name}Service],
  exports: [${name}Service],
})
export class ${name}Module {}
`;
}
