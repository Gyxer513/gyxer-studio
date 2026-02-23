# Getting Started

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9

## Quick Start

### 1. Open the Visual Editor

```bash
npx @gyxer-studio/cli editor
```

Opens `http://localhost:4200` — add entities, configure fields and relations, then click **Generate**. Configs save to `./configs/`.

### 2. Generate from Config

```bash
npx @gyxer-studio/cli generate configs/my-app.json -o ./my-app
```

### 3. Run

```bash
cd my-app
npm install
npx prisma migrate dev --name init
npm run start:dev
```

## CLI Alternative

Create a project without the editor using the interactive wizard:

```bash
npx @gyxer-studio/cli new my-app
```

The wizard asks about database, port, modules, and security settings.

## Validate a Config

Check a schema without generating code:

```bash
npx @gyxer-studio/cli validate configs/my-app.json
```

## Running Tests (Development)

```bash
npm test                         # all 149 tests
npm test -w packages/schema      # schema validation tests
npm test -w packages/generator   # code generation tests
```

## Project Structure

```
gyxer-studio/
  packages/
    schema/       # @gyxer-studio/schema  — Zod validation + TypeScript types
    generator/    # @gyxer-studio/generator — NestJS code generation engine
    editor/       # @gyxer-studio/editor   — React Flow visual editor
    cli/          # @gyxer-studio/cli      — CLI commands
  examples/       # Example project schemas
  docs/           # This documentation (VitePress)
```

| Package | Description |
|---------|------------|
| `@gyxer-studio/schema` | Project schema types + Zod validation |
| `@gyxer-studio/generator` | NestJS + Prisma code generator |
| `@gyxer-studio/editor` | Visual drag-and-drop editor |
| `@gyxer-studio/cli` | Command-line interface |

## Next Steps

- [Visual Editor Guide](/guide/visual-editor) — learn the editor interface
- [Field Types](/guide/field-types) — all 9 supported field types
- [CLI Commands](/guide/cli) — editor, generate, new, validate
- [Schema Specification](/reference/schema) — full JSON schema reference
