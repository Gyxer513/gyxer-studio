# Getting Started

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9
- **Git**

## Installation

```bash
git clone https://github.com/Gyxer513/gyxer-studio.git
cd gyxer-studio
npm install
```

## Running the Visual Editor

```bash
npm run dev
```

Opens the editor at `http://localhost:5173`.

## Quick Workflow

1. Click **Add Entity** in the toolbar
2. Name your entity (PascalCase, e.g. `Product`)
3. Add fields — choose type, set required/unique/index
4. Drag entities on the canvas to arrange them
5. Connect entities by dragging from handle to handle to create relations
6. Click **Generate** — choose "To folder..." or "Download ZIP"

## CLI Alternative

Create a project without the editor:

```bash
npx gyxer new my-app
```

The interactive wizard will ask you about database, port, modules, and security settings.

## Running Tests

```bash
npm test -w packages/schema
npm test -w packages/generator
```

59 tests across schema validation and code generation.

## Project Structure

```
gyxer-studio/
  packages/
    schema/       # @gyxer/schema  — Zod validation + TypeScript types
    generator/    # @gyxer/generator — NestJS code generation engine
    editor/       # @gyxer/editor   — React Flow visual editor
    cli/          # @gyxer/cli      — CLI wizard (inquirer + chalk + ora)
  examples/       # Example project schemas
  docs/           # This documentation (VitePress)
```

| Package | Description |
|---------|------------|
| `@gyxer/schema` | Project schema types + Zod validation |
| `@gyxer/generator` | NestJS + Prisma code generator |
| `@gyxer/editor` | Visual drag-and-drop editor |
| `@gyxer/cli` | Command-line interface |

## Next Steps

- [Visual Editor Guide](/guide/visual-editor) — learn the editor interface
- [Field Types](/guide/field-types) — all 9 supported field types
- [Schema Specification](/reference/schema) — full JSON schema reference
