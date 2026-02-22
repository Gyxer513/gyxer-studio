import type { Entity, Field, GyxerProject } from '@gyxer/schema';
import { toCamelCase } from '../utils.js';

/** FK field descriptor for DTO generation. */
interface FkFieldInfo {
  name: string;
  targetEntity: string;
}

/**
 * Collect all foreign key fields that this entity needs in its DTO.
 * Sources:
 *   1. Entity's own relations that define a foreignKey (explicit FK).
 *   2. Inverse relations from other entities that create FK on this entity.
 */
export function collectFkFields(entity: Entity, project: GyxerProject): FkFieldInfo[] {
  const fkFields: FkFieldInfo[] = [];
  const existingNames = new Set(entity.fields.map((f) => f.name));

  // 1. From entity's own relations with foreignKey (one-to-one only).
  //    one-to-many: this entity is "one" side, FK goes on the TARGET.
  for (const rel of entity.relations) {
    if (rel.type === 'one-to-many') continue; // FK is on target, not here
    if (rel.foreignKey && !existingNames.has(rel.foreignKey)) {
      fkFields.push({ name: rel.foreignKey, targetEntity: rel.target });
      existingNames.add(rel.foreignKey);
    }
  }

  // 2. From inverse relations (other entities pointing to this one via one-to-many)
  for (const otherEntity of project.entities) {
    if (otherEntity.name === entity.name) continue;

    for (const rel of otherEntity.relations) {
      if (rel.target !== entity.name) continue;

      // Skip if this entity already has a back-reference to otherEntity
      const hasBackRef = entity.relations.some((r) => r.target === otherEntity.name);
      if (hasBackRef) continue;

      const sourceName = otherEntity.name.charAt(0).toLowerCase() + otherEntity.name.slice(1);

      if (rel.type === 'one-to-many') {
        // Source is "one" side → this entity is "many" side → needs FK
        const fk = rel.foreignKey || `${sourceName}Id`;
        if (!existingNames.has(fk)) {
          fkFields.push({ name: fk, targetEntity: otherEntity.name });
          existingNames.add(fk);
        }
      } else if (rel.type === 'one-to-one' && !rel.foreignKey) {
        // Source has optional ref → this entity needs FK
        const fk = `${sourceName}Id`;
        if (!existingNames.has(fk)) {
          fkFields.push({ name: fk, targetEntity: otherEntity.name });
          existingNames.add(fk);
        }
      }
      // many-to-many → no FK on either side (join table)
      // one-to-one WITH foreignKey → source owns FK, not this entity
    }
  }

  return fkFields;
}

/**
 * Generate Create DTO for an entity.
 */
export function generateCreateDto(entity: Entity, project: GyxerProject): string {
  const className = `Create${entity.name}Dto`;
  const fkFields = collectFkFields(entity, project);
  const lines: string[] = [];

  // Import ApiPropertyOptional too if any field is optional
  const hasOptionalFields = entity.fields.some((f) => !f.required);
  if (hasOptionalFields) {
    lines.push("import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';");
  } else {
    lines.push("import { ApiProperty } from '@nestjs/swagger';");
  }

  // Import Prisma enums if entity has enum fields
  const enumFields = entity.fields.filter((f) => f.type === 'enum' && f.enumValues);
  if (enumFields.length > 0) {
    const enumNames = enumFields.map(
      (f) => `${entity.name}${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`,
    );
    lines.push(`import { ${enumNames.join(', ')} } from '@prisma/client';`);
  }

  lines.push(generateValidatorImports(entity.fields, false, fkFields.length > 0));
  lines.push('');
  lines.push(`export class ${className} {`);

  for (const field of entity.fields) {
    lines.push(generateDtoField(field, entity, false));
  }

  // FK fields from relations
  for (const fk of fkFields) {
    lines.push(generateFkDtoField(fk, false));
  }

  // Auth-jwt: add password field to CreateUserDto
  const hasAuthJwt =
    entity.name === 'User' &&
    project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
  if (hasAuthJwt) {
    lines.push("  @ApiProperty({ description: 'User password (will be hashed)' })");
    lines.push('  @IsString()');
    lines.push('  @IsNotEmpty()');
    lines.push('  password: string;');
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Generate Update DTO for an entity (all fields optional).
 */
export function generateUpdateDto(entity: Entity, project: GyxerProject): string {
  const className = `Update${entity.name}Dto`;
  const fkFields = collectFkFields(entity, project);
  const lines: string[] = [];

  lines.push("import { ApiPropertyOptional } from '@nestjs/swagger';");

  // Import Prisma enums if entity has enum fields
  const enumFields = entity.fields.filter((f) => f.type === 'enum' && f.enumValues);
  if (enumFields.length > 0) {
    const enumNames = enumFields.map(
      (f) => `${entity.name}${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`,
    );
    lines.push(`import { ${enumNames.join(', ')} } from '@prisma/client';`);
  }

  lines.push(generateValidatorImports(entity.fields, true, fkFields.length > 0));
  lines.push('');
  lines.push(`export class ${className} {`);

  for (const field of entity.fields) {
    lines.push(generateDtoField(field, entity, true));
  }

  // FK fields from relations (optional in update)
  for (const fk of fkFields) {
    lines.push(generateFkDtoField(fk, true));
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
  const tsType = mapToTsType(field, entity.name);
  const questionMark = optional ? '?' : '';
  lines.push(`  ${field.name}${questionMark}: ${tsType};`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a DTO field for a foreign key (relation FK).
 */
function generateFkDtoField(fk: FkFieldInfo, isUpdate: boolean): string {
  const lines: string[] = [];
  const decorator = isUpdate ? 'ApiPropertyOptional' : 'ApiProperty';
  const questionMark = isUpdate ? '?' : '';

  lines.push(`  @${decorator}({ description: 'FK to ${fk.targetEntity}' })`);
  if (isUpdate) {
    lines.push('  @IsOptional()');
  }
  lines.push('  @IsInt()');
  lines.push(`  ${fk.name}${questionMark}: number;`);
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

function generateValidatorImports(
  fields: Field[],
  isUpdate: boolean = false,
  hasFkFields: boolean = false,
): string {
  const validators = new Set<string>();

  if (isUpdate) validators.add('IsOptional');

  // FK fields always need IsInt (and IsOptional for update)
  if (hasFkFields) {
    validators.add('IsInt');
    if (isUpdate) validators.add('IsOptional');
  }

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

function mapToTsType(field: Field, entityName?: string): string {
  switch (field.type) {
    case 'string':
    case 'text':
    case 'uuid':
    case 'datetime':
      return 'string';
    case 'enum':
      if (entityName && field.enumValues) {
        return `${entityName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
      }
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
