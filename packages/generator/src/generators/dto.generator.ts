import type { Entity, Field } from '@gyxer/schema';
import { toCamelCase } from '../utils.js';

/**
 * Generate Create DTO for an entity.
 */
export function generateCreateDto(entity: Entity): string {
  const className = `Create${entity.name}Dto`;
  const lines: string[] = [];

  lines.push("import { ApiProperty } from '@nestjs/swagger';");
  lines.push(generateValidatorImports(entity.fields));
  lines.push('');
  lines.push(`export class ${className} {`);

  for (const field of entity.fields) {
    lines.push(generateDtoField(field, entity, false));
  }

  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Generate Update DTO for an entity (all fields optional).
 */
export function generateUpdateDto(entity: Entity): string {
  const className = `Update${entity.name}Dto`;
  const lines: string[] = [];

  lines.push("import { ApiPropertyOptional } from '@nestjs/swagger';");
  lines.push(generateValidatorImports(entity.fields, true));
  lines.push('');
  lines.push(`export class ${className} {`);

  for (const field of entity.fields) {
    lines.push(generateDtoField(field, entity, true));
  }

  lines.push('}');

  return lines.join('\n') + '\n';
}

function generateDtoField(field: Field, entity: Entity, isUpdate: boolean): string {
  const lines: string[] = [];
  const optional = isUpdate || !field.required;
  const decorator = isUpdate ? 'ApiPropertyOptional' : optional ? 'ApiPropertyOptional' : 'ApiProperty';

  // Swagger decorator
  const swaggerOpts: string[] = [];
  if (field.description) swaggerOpts.push(`description: '${field.description}'`);
  if (field.type === 'enum' && field.enumValues) {
    swaggerOpts.push(`enum: [${field.enumValues.map((v) => `'${v}'`).join(', ')}]`);
  }
  if (field.default !== undefined && field.default !== null) {
    if (typeof field.default === 'string') {
      swaggerOpts.push(`default: '${field.default}'`);
    } else {
      swaggerOpts.push(`default: ${field.default}`);
    }
  }

  const swaggerArgs = swaggerOpts.length > 0 ? `{ ${swaggerOpts.join(', ')} }` : '';
  lines.push(`  @${decorator}(${swaggerArgs})`);

  // Validation decorators
  const validators = getValidators(field, isUpdate);
  for (const v of validators) {
    lines.push(`  ${v}`);
  }

  // Property
  const tsType = mapToTsType(field);
  const questionMark = optional ? '?' : '';
  lines.push(`  ${field.name}${questionMark}: ${tsType};`);
  lines.push('');

  return lines.join('\n');
}

function getValidators(field: Field, isUpdate: boolean): string[] {
  const validators: string[] = [];

  if (isUpdate || !field.required) {
    validators.push('@IsOptional()');
  }

  switch (field.type) {
    case 'string':
    case 'text':
    case 'uuid':
      validators.push('@IsString()');
      if (field.required && !isUpdate) {
        validators.push('@IsNotEmpty()');
      }
      break;
    case 'int':
      validators.push('@IsInt()');
      break;
    case 'float':
      validators.push('@IsNumber()');
      break;
    case 'boolean':
      validators.push('@IsBoolean()');
      break;
    case 'datetime':
      validators.push('@IsDateString()');
      break;
    case 'enum':
      if (field.enumValues) {
        validators.push(`@IsIn([${field.enumValues.map((v) => `'${v}'`).join(', ')}])`);
      }
      break;
  }

  return validators;
}

function generateValidatorImports(fields: Field[], isUpdate: boolean = false): string {
  const validators = new Set<string>();

  if (isUpdate) validators.add('IsOptional');

  for (const field of fields) {
    if (!field.required || isUpdate) validators.add('IsOptional');

    switch (field.type) {
      case 'string':
      case 'text':
      case 'uuid':
        validators.add('IsString');
        if (field.required && !isUpdate) validators.add('IsNotEmpty');
        break;
      case 'int':
        validators.add('IsInt');
        break;
      case 'float':
        validators.add('IsNumber');
        break;
      case 'boolean':
        validators.add('IsBoolean');
        break;
      case 'datetime':
        validators.add('IsDateString');
        break;
      case 'enum':
        validators.add('IsIn');
        break;
    }
  }

  return `import { ${[...validators].sort().join(', ')} } from 'class-validator';`;
}

function mapToTsType(field: Field): string {
  switch (field.type) {
    case 'string':
    case 'text':
    case 'uuid':
    case 'datetime':
    case 'enum':
      return 'string';
    case 'int':
    case 'float':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
      return 'Record<string, any>';
    default:
      return 'string';
  }
}
