import type { EntityData, FieldData, ModulesConfig } from '../store/project-store';
import type { HttpMethod } from '../store/http-store';
import { toKebabCase, pluralize } from '@gyxer-studio/generator/utils';

export interface EndpointSuggestion {
  label: string;
  method: HttpMethod;
  path: string;
  bodyTemplate: string;
  group: string;
}

/** Generate default value for a field type (for body templates). */
function defaultForType(field: FieldData): unknown {
  switch (field.type) {
    case 'string':
    case 'text':
    case 'uuid':
      return field.default != null ? String(field.default) : '';
    case 'int':
      return field.default != null ? Number(field.default) : 0;
    case 'float':
      return field.default != null ? Number(field.default) : 0.0;
    case 'boolean':
      return field.default != null ? Boolean(field.default) : false;
    case 'datetime':
      return new Date().toISOString();
    case 'enum':
      return field.enumValues?.[0] ?? '';
    case 'json':
      return {};
    default:
      return '';
  }
}

/** Build a JSON body template from entity fields. */
function buildBodyTemplate(fields: FieldData[]): string {
  const obj: Record<string, unknown> = {};
  for (const field of fields) {
    obj[field.name] = defaultForType(field);
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * Generate endpoint suggestions from editor entities and modules.
 * Returns a flat array of EndpointSuggestion grouped by entity name / "Auth".
 */
export function generateEndpoints(
  entities: EntityData[],
  modules: ModulesConfig,
): EndpointSuggestion[] {
  const suggestions: EndpointSuggestion[] = [];

  for (const entity of entities) {
    const kebab = toKebabCase(entity.name);
    const route = `/${pluralize(kebab)}`;
    const group = entity.name;
    const body = buildBodyTemplate(entity.fields);

    suggestions.push(
      {
        label: `POST ${route}`,
        method: 'POST',
        path: route,
        bodyTemplate: body,
        group,
      },
      {
        label: `GET ${route}`,
        method: 'GET',
        path: route,
        bodyTemplate: '',
        group,
      },
      {
        label: `GET ${route}/1`,
        method: 'GET',
        path: `${route}/1`,
        bodyTemplate: '',
        group,
      },
      {
        label: `PATCH ${route}/1`,
        method: 'PATCH',
        path: `${route}/1`,
        bodyTemplate: body,
        group,
      },
      {
        label: `DELETE ${route}/1`,
        method: 'DELETE',
        path: `${route}/1`,
        bodyTemplate: '',
        group,
      },
    );
  }

  // Auth endpoints (when JWT module is enabled)
  if (modules.authJwt) {
    const authGroup = 'Auth';
    suggestions.push(
      {
        label: 'POST /auth/register',
        method: 'POST',
        path: '/auth/register',
        bodyTemplate: JSON.stringify({ email: '', password: '' }, null, 2),
        group: authGroup,
      },
      {
        label: 'POST /auth/login',
        method: 'POST',
        path: '/auth/login',
        bodyTemplate: JSON.stringify({ email: '', password: '' }, null, 2),
        group: authGroup,
      },
      {
        label: 'POST /auth/refresh',
        method: 'POST',
        path: '/auth/refresh',
        bodyTemplate: JSON.stringify({ refreshToken: '' }, null, 2),
        group: authGroup,
      },
      {
        label: 'GET /auth/profile',
        method: 'GET',
        path: '/auth/profile',
        bodyTemplate: '',
        group: authGroup,
      },
    );
  }

  return suggestions;
}
