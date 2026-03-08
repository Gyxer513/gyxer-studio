Add a new entity to the current Gyxer Studio project.

## Instructions

1. Use `add_entity` MCP tool with:
   - `name`: PascalCase entity name (e.g., User, BlogPost, OrderItem)
   - `fields`: array of field objects
   - `description`: optional description
2. Each field needs: `name` (camelCase), `type`, and optionally `required`, `unique`, `index`, `default`, `enumValues`, `description`
3. If the entity has relations to other entities, use `add_relation` after creating it
4. Show a summary of the created entity

## Field Types

| Type | Description | Notes |
|------|-------------|-------|
| string | Short text (VARCHAR) | |
| text | Long text (TEXT) | |
| int | Integer number | |
| float | Floating point | |
| boolean | True/false | |
| datetime | ISO 8601 date/time | |
| enum | Fixed set of values | Must include `enumValues` |
| json | Arbitrary JSON | |
| uuid | UUID v4 | |

## Best Practices

- Use `unique: true` for natural keys (email, slug, username)
- Use `index: true` on fields you query/filter by
- Use `required: true` for mandatory fields
- Enum fields must include `enumValues` array
- The `id` field is auto-generated, don't add it manually

## Example

Entity "Product" with fields: name (string, required), price (float, required), description (text), sku (string, unique, index), status (enum: draft/published/archived)
