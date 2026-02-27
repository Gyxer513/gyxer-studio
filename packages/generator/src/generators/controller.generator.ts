import type { Entity, GyxerProject } from '@gyxer-studio/schema';
import { toCamelCase, toKebabCase, pluralize } from '../utils.js';

/**
 * Generate a NestJS controller for an entity with full CRUD + Swagger.
 * When auth-jwt is enabled:
 *   - GET endpoints are @Public() (no auth required)
 *   - POST/PATCH/DELETE require JWT (global guard)
 *   - @ApiBearerAuth() on protected endpoints for Swagger UI
 */
export function generateController(entity: Entity, project: GyxerProject): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const route = pluralize(kebab);
  const serviceName = `${camel}Service`;
  const className = `${name}Controller`;

  const hasAuthJwt =
    project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false) ?? false;

  const authOverride = entity.authOverride ?? 'default';

  /** Return the auth decorator for a given method category. */
  function getDecorator(method: 'GET' | 'MUTATE'): string {
    if (!hasAuthJwt) return '';
    switch (authOverride) {
      case 'public':
        return '\n  @Public()';
      case 'protected':
        return '\n  @ApiBearerAuth()';
      default: // 'default'
        return method === 'GET' ? '\n  @Public()' : '\n  @ApiBearerAuth()';
    }
  }

  const needsPublicImport = hasAuthJwt && authOverride !== 'protected';
  const needsBearerImport = hasAuthJwt && authOverride !== 'public';

  const importLines = [
    'import {',
    '  Controller,',
    '  Get,',
    '  Post,',
    '  Body,',
    '  Patch,',
    '  Param,',
    '  Delete,',
    '  ParseIntPipe,',
    "} from '@nestjs/common';",
  ];

  const swaggerParts = ['ApiTags', 'ApiOperation', 'ApiResponse'];
  if (needsBearerImport) swaggerParts.push('ApiBearerAuth');
  importLines.push(`import { ${swaggerParts.join(', ')} } from '@nestjs/swagger';`);

  if (needsPublicImport) {
    importLines.push("import { Public } from '../auth/decorators/public.decorator';");
  }

  importLines.push(`import { ${name}Service } from './${kebab}.service';`);
  importLines.push(`import { Create${name}Dto } from './dto/create-${kebab}.dto';`);
  importLines.push(`import { Update${name}Dto } from './dto/update-${kebab}.dto';`);

  return `${importLines.join('\n')}

@ApiTags('${route}')
@Controller('${route}')
export class ${className} {
  constructor(private readonly ${serviceName}: ${name}Service) {}

  @Post()${getDecorator('MUTATE')}
  @ApiOperation({ summary: 'Create a new ${camel}' })
  @ApiResponse({ status: 201, description: '${name} created successfully' })
  create(@Body() dto: Create${name}Dto) {
    return this.${serviceName}.create(dto);
  }

  @Get()${getDecorator('GET')}
  @ApiOperation({ summary: 'Get all ${pluralize(camel)}' })
  @ApiResponse({ status: 200, description: 'List of ${pluralize(camel)}' })
  findAll() {
    return this.${serviceName}.findAll();
  }

  @Get(':id')${getDecorator('GET')}
  @ApiOperation({ summary: 'Get a ${camel} by id' })
  @ApiResponse({ status: 200, description: '${name} found' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.findOne(id);
  }

  @Patch(':id')${getDecorator('MUTATE')}
  @ApiOperation({ summary: 'Update a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} updated successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update${name}Dto) {
    return this.${serviceName}.update(id, dto);
  }

  @Delete(':id')${getDecorator('MUTATE')}
  @ApiOperation({ summary: 'Delete a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} deleted successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.remove(id);
  }
}
`;
}
