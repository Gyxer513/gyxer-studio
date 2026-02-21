import type { Entity } from '@gyxer/schema';
import { toCamelCase, toKebabCase, pluralize } from '../utils.js';

/**
 * Generate a NestJS controller for an entity with full CRUD + Swagger.
 */
export function generateController(entity: Entity): string {
  const name = entity.name;
  const camel = toCamelCase(name);
  const kebab = toKebabCase(name);
  const route = pluralize(kebab);
  const serviceName = `${camel}Service`;
  const className = `${name}Controller`;

  return `import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${name}Service } from './${kebab}.service';
import { Create${name}Dto } from './dto/create-${kebab}.dto';
import { Update${name}Dto } from './dto/update-${kebab}.dto';

@ApiTags('${route}')
@Controller('${route}')
export class ${className} {
  constructor(private readonly ${serviceName}: ${name}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ${camel}' })
  @ApiResponse({ status: 201, description: '${name} created successfully' })
  create(@Body() dto: Create${name}Dto) {
    return this.${serviceName}.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${pluralize(camel)}' })
  @ApiResponse({ status: 200, description: 'List of ${pluralize(camel)}' })
  findAll() {
    return this.${serviceName}.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ${camel} by id' })
  @ApiResponse({ status: 200, description: '${name} found' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} updated successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update${name}Dto) {
    return this.${serviceName}.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ${camel}' })
  @ApiResponse({ status: 200, description: '${name} deleted successfully' })
  @ApiResponse({ status: 404, description: '${name} not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.${serviceName}.remove(id);
  }
}
`;
}
