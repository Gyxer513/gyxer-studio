import { GyxerProjectSchema, type GyxerProject } from './types.js';
import { ZodError } from 'zod';

export interface ValidationResult {
  success: boolean;
  data?: GyxerProject;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Parse and validate a raw object as a GyxerProject.
 * Returns parsed data with defaults applied, or validation errors.
 */
export function validateProject(raw: unknown): ValidationResult {
  try {
    const data = GyxerProjectSchema.parse(raw);

    // Cross-field validations
    const errors = crossValidate(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        errors: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }
    throw err;
  }
}

/**
 * Cross-field validations that Zod can't express alone.
 */
function crossValidate(project: GyxerProject): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set<string>();

  for (const entity of project.entities) {
    // Unique entity names
    if (entityNames.has(entity.name)) {
      errors.push({
        path: `entities`,
        message: `Duplicate entity name: "${entity.name}"`,
      });
    }
    entityNames.add(entity.name);

    // Unique field names within entity
    const fieldNames = new Set<string>();
    for (const field of entity.fields) {
      if (fieldNames.has(field.name)) {
        errors.push({
          path: `entities.${entity.name}.fields`,
          message: `Duplicate field name: "${field.name}" in entity "${entity.name}"`,
        });
      }
      fieldNames.add(field.name);

      // Enum fields must have enumValues
      if (field.type === 'enum' && (!field.enumValues || field.enumValues.length === 0)) {
        errors.push({
          path: `entities.${entity.name}.fields.${field.name}`,
          message: `Enum field "${field.name}" must have enumValues`,
        });
      }
    }

    // Relations must reference existing entities
    for (const relation of entity.relations) {
      if (!project.entities.some((e) => e.name === relation.target)) {
        errors.push({
          path: `entities.${entity.name}.relations.${relation.name}`,
          message: `Relation "${relation.name}" targets unknown entity "${relation.target}"`,
        });
      }
    }
  }

  return errors;
}

/**
 * Parse a JSON string into a GyxerProject.
 */
export function parseProjectJson(json: string): ValidationResult {
  try {
    const raw = JSON.parse(json);
    return validateProject(raw);
  } catch {
    return {
      success: false,
      errors: [{ path: '', message: 'Invalid JSON' }],
    };
  }
}
