# Gyxer Studio

Visual backend builder that generates production-ready NestJS applications.

> Build your backend visually. Get clean, readable code. No vendor lock-in.

## What is Gyxer Studio?

Gyxer Studio is a visual tool for building production-ready backends. You design data models and relationships in a drag-and-drop editor, pick the modules you need, and Gyxer generates a complete NestJS project with best practices baked in.

**Target audience:** Solo developers, indie hackers, and small teams who want to skip boilerplate and ship faster.

## Features

- **Visual Model Editor** — drag-and-drop data modeling with React Flow
- **Relation Editing** — click edges to edit type (1:1, 1:N, N:M), onDelete, foreign key; delete from edge or sidebar
- **Code Generation** — clean NestJS + Prisma code you actually want to read
- **Generate to Folder or ZIP** — write files directly to a directory or download as archive
- **Import / Export JSON** — save and load project schemas
- **Module System** — add Auth (JWT), File Storage, Queues, Search with a checkbox
- **Field Defaults & Enums** — set default values and enum options per field
- **Security Report** — Helmet, Rate Limiting, CORS, secrets check on every generation
- **Docker Compose** — generated and ready to `docker compose up`
- **Built-in HTTP Client** — Postman-like API tester with auto-generated endpoints from your entities
- **Dark Theme** — toggle between light and dark mode with localStorage persistence
- **i18n** — English and Russian interface
- **CLI Wizard** — interactive `npx gyxer new` with inquirer, chalk & ora styling

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor | React 19, React Flow v12, Zustand v5, Tailwind CSS, Vite 6 |
| Schema | TypeScript + Zod validation |
| Generator | TypeScript, string-based code generation |
| Generated Backend | NestJS, Prisma, class-validator, Swagger |
| Database | PostgreSQL, MySQL, SQLite |
| Infrastructure | Docker, Docker Compose |

## Project Structure

```
gyxer-studio/
  packages/
    schema/       # @gyxer/schema  — JSON project schema types + Zod validation
    generator/    # @gyxer/generator — NestJS code generation engine
    editor/       # @gyxer/editor   — React Flow visual editor
    cli/          # @gyxer/cli      — CLI wrapper
  examples/       # Example project schemas (blog, blog-with-auth)
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/Gyxer513/gyxer-studio.git
cd gyxer-studio
npm install

# Run the visual editor
npm run dev -w packages/editor

# Run tests (59 tests)
npm test -w packages/schema
npm test -w packages/generator
```

Open http://localhost:5173 — add entities, configure fields and relations, then hit **Generate**.

## Available Modules

| Module | Status | Description |
|--------|--------|------------|
| `auth-jwt` | ✅ Done | JWT authentication with refresh tokens, guards, decorators |
| `file-storage` | Planned | MinIO-based file uploads |
| `queues` | Planned | BullMQ background jobs |
| `cache` | Planned | Redis caching layer |
| `websockets` | Planned | Real-time events via Socket.IO |
| `search` | Planned | Elasticsearch integration |

## What Gets Generated

For each entity you create, Gyxer generates:

- **Prisma schema** — models, relations, indexes, cascades
- **NestJS module** — module, controller, service
- **DTOs** — CreateDto + UpdateDto with class-validator decorators
- **Swagger** — @ApiTags, @ApiOperation, @ApiResponse on every endpoint
- **main.ts** — Bootstrap with Swagger, Helmet, CORS, ValidationPipe
- **app.module.ts** — All modules wired together
- **Docker** — Dockerfile + docker-compose.yml (app + PostgreSQL)
- **.env** — Environment config with .env.example
- **Security Report** — JSON report checking Helmet, Rate Limit, CORS, secrets

## Roadmap

- ✅ Monorepo setup (npm workspaces, 4 packages)
- ✅ JSON schema contract (@gyxer/schema + Zod)
- ✅ Code generator (Prisma, NestJS CRUD, Docker, Security Report)
- ✅ Visual editor (React Flow, entities, fields, relations)
- ✅ Generate to folder / ZIP from browser
- ✅ i18n (EN/RU)
- ✅ Auth JWT module
- ✅ 59 tests passing
- ✅ UI polish (Gyxer branding, Inter font, dark entity cards)
- ✅ Relation editing UI (custom edge, type/onDelete/FK editing, delete)
- ✅ Import / Export JSON schemas
- ✅ Field default values & enum editor
- ✅ Built-in HTTP client (Postman-like)
- ✅ CLI wizard (`npx gyxer new` interactive, chalk + ora output)
- ✅ Dark theme
- 🔲 Additional modules (cache, queues, file-storage, websockets, search)
- 🔲 Documentation site
- 🔲 Public release

## Philosophy

- **From real pain** — every feature solves a problem we've hit ourselves
- **No vendor lock-in** — eject anytime, the generated code is yours
- **Readable code** — if you wouldn't write it by hand, we won't generate it
- **Security by default** — not an afterthought

## License

MIT

---

Built by [Gyxer](https://github.com/Gyxer513)
