import type { Entity, GyxerProject } from '@gyxer/schema';
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

  const swaggerImports = hasAuthJwt
    ? "import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';"
    : "import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';";
  importLines.push(swaggerImports);

  if (hasAuthJwt) {
    importLines.push("import { Public } from '../auth/decorators/public.decorator';");
  }

  importLines.push(`import { ${name}Service } from './${kebab}.service';`);
  importLines.push(`import { Create${name}Dto } from './dto/create-${kebab}.dto';`);
  importLines.push(`import { Update${name}Dto } from './dto/update-${kebab}.dto';`);

  const protectedDecorator = hasAuthJwt ? '\n  @ApiBearerAuth()' : '';
  const publicDecorator = hasAuthJwt ? '\n  @Public()' : '';

  return `${importLines.join('\n')}

@ApiTags('${route}')
@Controller('${route}')
export class ${className} {
  constructor(private readonly ${serviceName}: ${name}Service) {}

  @Post()${protectedDecorator}
  @ApiOperation({ summary: 'Create a new ${camel}' })
  @ApiResponse({ status: 201, description: '${name} created successfully' })
  create(@Body() dto: Create${name}Dto) {
    return this.${serviceName}.create(dto);
  }

  @Get()${publicDecorator}
  @ApiOperation({ summary: 'Get all ${pluralize(camel)}' })
  @ApiResponse({ status: 200, description: 'List of ${pluralize(camel)}' })
  findAll() {
    return this.${serviceName}.findAll();
  }

  @Get(':id')${publicDecorator}
  @ApiOperation({ summary: 'Get a ${camel} by id' })
  @ApiResponse({ status: 200, description: '${name} found' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.findOne(id);
  }

  @Patch(':id')${protectedDecorator}
  @ApiOperation({ summary: 'Update a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} updated successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update${name}Dto) {
    return this.${serviceName}.update(id, dto);
  }

  @Delete(':id')${protectedDecorator}
  @ApiOperation({ summary: 'Delete a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} deleted successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.remove(id);
  }
}
`;
}
