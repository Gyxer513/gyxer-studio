# Field Types

Gyxer supports 9 field types. Each type maps to Prisma, TypeScript, and class-validator decorators.

## Type Mapping

| Type | Prisma | TypeScript | Validator | Use Case |
|------|--------|-----------|-----------|----------|
| `string` | `String` | `string` | `@IsString()` `@IsNotEmpty()` | Names, emails, URLs |
| `text` | `String` | `string` | `@IsString()` `@IsNotEmpty()` | Long content, descriptions |
| `int` | `Int` | `number` | `@IsInt()` | Counts, quantities, IDs |
| `float` | `Float` | `number` | `@IsNumber()` | Prices, coordinates |
| `boolean` | `Boolean` | `boolean` | `@IsBoolean()` | Flags, toggles |
| `datetime` | `DateTime` | `string` | `@IsDateString()` | Timestamps, dates |
| `enum` | `Enum` | `string` | `@IsIn([...values])` | Fixed value sets |
| `json` | `Json` | `Record<string, any>` | — | Arbitrary data |
| `uuid` | `String` | `string` | `@IsString()` | UUID identifiers |

## Field Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | `boolean` | `true` | Adds `@IsNotEmpty()` and non-nullable in Prisma |
| `unique` | `boolean` | `false` | Adds `@unique` in Prisma |
| `index` | `boolean` | `false` | Adds `@@index` in Prisma |
| `default` | `string \| number \| boolean \| null` | — | Adds `@default()` in Prisma |
| `enumValues` | `string[]` | — | Required for `enum` type |

## Auto-Generated Fields

Every entity automatically gets three fields (you don't define them):

```prisma
id        Int      @id @default(autoincrement())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

## Enum Fields

When using `enum` type, you must provide `enumValues`:

```json
{
  "name": "status",
  "type": "enum",
  "required": true,
  "default": "DRAFT",
  "enumValues": ["DRAFT", "PUBLISHED", "ARCHIVED"]
}
```

This generates a Prisma enum:

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

Enum naming convention: `{EntityName}{FieldNameCapitalized}`.

## Column Mapping

Field names in camelCase are automatically mapped to snake_case columns:

```prisma
publishedAt DateTime? @map("published_at")
viewCount   Int       @default(0) @map("view_count")
```

## Examples

### User entity fields

```json
[
  { "name": "email", "type": "string", "required": true, "unique": true },
  { "name": "name", "type": "string", "required": true },
  { "name": "bio", "type": "text", "required": false },
  { "name": "isActive", "type": "boolean", "required": true, "default": true }
]
```

### Post entity fields

```json
[
  { "name": "title", "type": "string", "required": true },
  { "name": "slug", "type": "string", "required": true, "unique": true, "index": true },
  { "name": "content", "type": "text", "required": true },
  { "name": "viewCount", "type": "int", "required": true, "default": 0 },
  { "name": "publishedAt", "type": "datetime", "required": false },
  {
    "name": "status", "type": "enum", "required": true,
    "default": "DRAFT", "enumValues": ["DRAFT", "PUBLISHED", "ARCHIVED"]
  }
]
```
