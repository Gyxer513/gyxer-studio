# @gyxer-studio/schema

Zod-based schema types and validation for Gyxer Studio projects.

## Installation

```bash
npm install @gyxer-studio/schema
```

## Usage

```typescript
import { validateProject, parseProjectJson } from '@gyxer-studio/schema';
import type { GyxerProject, Entity, Field, Relation } from '@gyxer-studio/schema';

// Validate a project object
const result = validateProject({
  name: 'my-app',
  entities: [
    {
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
      ],
    },
  ],
});

if (result.success) {
  console.log(result.data); // fully typed GyxerProject
} else {
  console.error(result.errors);
}

// Parse from JSON string
const jsonResult = parseProjectJson(fs.readFileSync('my-app.json', 'utf-8'));
```

## Field Types

| Type | TypeScript | Prisma |
|------|-----------|--------|
| `string` | `string` | `String` |
| `text` | `string` | `String` |
| `int` | `number` | `Int` |
| `float` | `number` | `Float` |
| `boolean` | `boolean` | `Boolean` |
| `datetime` | `Date` | `DateTime` |
| `enum` | `enum` | `enum` |
| `json` | `object` | `Json` |
| `uuid` | `string` | `String @default(uuid())` |

## Relation Types

| Type | Description |
|------|-------------|
| `one-to-one` | e.g. User has one Profile |
| `one-to-many` | e.g. User has many Posts |
| `many-to-many` | e.g. Post has many Tags |

## Part of [Gyxer Studio](https://github.com/Gyxer513/gyxer-studio)

MIT License
