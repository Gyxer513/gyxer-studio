# Schema Specification

Full reference for the Gyxer project JSON schema. All types are validated with [Zod](https://zod.dev/).

## GyxerProject (Root)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | required | Project name, kebab-case (`^[a-z][a-z0-9-]*$`) |
| `version` | `string` | `"0.1.0"` | Semver version |
| `description` | `string` | `""` | Project description |
| `entities` | `Entity[]` | required | At least 1 entity |
| `modules` | `ModuleConfig[]` | `[]` | Optional modules |
| `settings` | `ProjectSettings` | defaults | Project settings |

## Entity

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | required | PascalCase (`^[A-Z][a-zA-Z0-9]*$`) |
| `description` | `string?` | — | Optional description |
| `fields` | `Field[]` | required | At least 1 field |
| `relations` | `Relation[]` | `[]` | Entity relations |

## Field

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | required | Valid identifier (`^[a-zA-Z][a-zA-Z0-9_]*$`) |
| `type` | `FieldType` | required | One of 9 types (see below) |
| `required` | `boolean` | `true` | Is the field required? |
| `unique` | `boolean` | `false` | Unique constraint |
| `index` | `boolean` | `false` | Database index |
| `default` | `string \| number \| boolean \| null` | — | Default value |
| `enumValues` | `string[]?` | — | Required when `type` is `enum` |
| `description` | `string?` | — | Optional description |

### FieldType

```
string | text | int | float | boolean | datetime | enum | json | uuid
```

See [Field Types](/guide/field-types) for detailed mapping.

## Relation

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | required | Relation name |
| `type` | `RelationType` | required | `one-to-one`, `one-to-many`, `many-to-many` |
| `target` | `string` | required | Target entity name (must exist) |
| `foreignKey` | `string?` | — | Foreign key column name |
| `onDelete` | `OnDeleteAction` | `CASCADE` | Delete behavior |
| `description` | `string?` | — | Optional description |

### OnDeleteAction

```
CASCADE | SET_NULL | RESTRICT | NO_ACTION
```

## ProjectSettings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `port` | `number` | `3000` | Server port (1-65535) |
| `database` | `DatabaseType` | `postgresql` | Database engine |
| `databaseUrl` | `string` | auto-generated | Connection string |
| `enableSwagger` | `boolean` | `true` | Swagger API docs |
| `enableCors` | `boolean` | `true` | CORS middleware |
| `enableHelmet` | `boolean` | `true` | Security headers |
| `enableRateLimit` | `boolean` | `true` | Rate limiting |
| `rateLimitTtl` | `number` | `60` | Rate limit window (seconds) |
| `rateLimitMax` | `number` | `100` | Max requests per window |
| `docker` | `boolean` | `true` | Generate Docker files |

### DatabaseType

```
postgresql | mysql | sqlite
```

## ModuleConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `ModuleName` | required | Module identifier |
| `enabled` | `boolean` | `true` | Is module enabled? |
| `options` | `Record<string, unknown>` | `{}` | Module-specific options |

### ModuleName

```
auth-jwt | auth-oauth | auth-keycloak | file-storage | queues | search | cache | websockets
```

Currently only `auth-jwt` is implemented. See [Modules](/guide/modules).

## Validation Rules

- Entity names must be **unique** across the project
- Field names must be **unique** within an entity
- Enum fields **must** have non-empty `enumValues`
- Relation `target` must reference an **existing** entity name
- Project must have at least **1 entity**
- Each entity must have at least **1 field**

## Complete Example

```json
{
  "name": "my-blog-auth",
  "version": "0.1.0",
  "description": "Blog API with JWT authentication",
  "entities": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "string", "required": true, "unique": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "bio", "type": "text", "required": false },
        { "name": "isActive", "type": "boolean", "required": true, "default": true }
      ],
      "relations": [
        { "name": "posts", "type": "one-to-many", "target": "Post", "onDelete": "CASCADE" }
      ]
    },
    {
      "name": "Post",
      "fields": [
        { "name": "title", "type": "string", "required": true },
        { "name": "slug", "type": "string", "required": true, "unique": true, "index": true },
        { "name": "content", "type": "text", "required": true },
        {
          "name": "status", "type": "enum", "required": true,
          "default": "DRAFT",
          "enumValues": ["DRAFT", "PUBLISHED", "ARCHIVED"]
        }
      ],
      "relations": [
        { "name": "author", "type": "one-to-many", "target": "User", "foreignKey": "authorId" }
      ]
    }
  ],
  "modules": [
    { "name": "auth-jwt", "enabled": true }
  ],
  "settings": {
    "port": 3000,
    "database": "postgresql",
    "enableSwagger": true,
    "enableHelmet": true,
    "enableRateLimit": true,
    "docker": true
  }
}
```
