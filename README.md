# Gyxer Studio

Visual backend builder that generates production-ready NestJS applications.

> Design your backend visually. Export config. Generate clean code via CLI. No vendor lock-in.

## What is Gyxer Studio?

Gyxer Studio is a visual tool for building production-ready backends. You design data models and relationships in a drag-and-drop editor, export a JSON config, and run a single CLI command to generate a complete NestJS project with best practices baked in.

**Target audience:** Solo developers, indie hackers, and small teams who want to skip boilerplate and ship faster.

## Quick Start

### 1. Open the Visual Editor

```bash
npx @gyxer-studio/cli editor
```

Opens `http://localhost:4200` — add entities, configure fields and relations, then click **Generate**. The config saves to `./configs/`.

### 2. Generate via CLI

```bash
# From saved config
npx @gyxer-studio/cli generate configs/my-app.json -o ./my-app

# Or interactive wizard (no editor needed)
npx @gyxer-studio/cli new my-app
```

### 3. Run

```bash
cd my-app
npm install && npm run start:dev
# or with Docker
docker compose up -d
```

## Features

| Feature | Description |
|---------|------------|
| **Visual Model Editor** | Drag-and-drop data modeling with React Flow |
| **Code Generation** | Clean NestJS + Prisma — CRUD, DTOs, Swagger, validation |
| **Relations** | 1:1, 1:N with onDelete actions and auto-generated foreign keys |
| **Auth JWT** | Full auth system — register, login, refresh tokens, guards |
| **Security Report** | Helmet, Rate Limiting, CORS, secrets check on every build |
| **Docker** | Multi-stage Dockerfile + docker-compose.yml with healthcheck |
| **HTTP Client** | Built-in Postman-like API tester with auto-generated endpoints |
| **Import / Export** | Save and load project schemas as JSON |
| **CLI Wizard** | Interactive `npx gyxer new` with styled terminal output |
| **Dark Theme** | Light/dark mode with localStorage persistence |
| **i18n** | English and Russian interface |

## What Gets Generated

```
my-app/
  prisma/schema.prisma          # Models, relations, enums
  src/
    prisma/                     # PrismaService + PrismaExceptionFilter
    user/                       # Module, controller, service, DTOs
    post/                       # Module, controller, service, DTOs
    auth/                       # JWT auth (when enabled)
    main.ts                     # Swagger, Helmet, CORS, ValidationPipe
    app.module.ts               # All modules wired together
  Dockerfile                    # Multi-stage build (node:20-alpine)
  docker-compose.yml            # App + PostgreSQL with healthcheck
  .env / .env.example           # Environment config
  security-report.json          # Security assessment
  package.json                  # All deps pinned
  tsconfig.json / tsconfig.build.json
```

## Example Schemas

Ready-to-use configs in [`examples/`](./examples/):

| Example | Description |
|---------|-------------|
| [`blog.json`](./examples/blog.json) | Blog with users, posts, comments |
| [`blog-with-auth.json`](./examples/blog-with-auth.json) | Same blog + JWT authentication |
| [`shop.json`](./examples/shop.json) | E-commerce: 6 entities, enums, float prices |

Generate any example:

```bash
npx @gyxer-studio/cli generate examples/shop.json -o ./shop-api
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor | React 19, React Flow v12, Zustand v5, Tailwind CSS, Vite 6 |
| Schema | TypeScript + Zod validation |
| Generator | TypeScript, string-based code generation |
| CLI | Commander, Inquirer, Chalk, Ora |
| Generated Backend | NestJS, Prisma, class-validator, Swagger |
| Testing | Vitest — 149 tests (unit + E2E) |

## Project Structure

```
gyxer-studio/
  packages/
    schema/       # @gyxer-studio/schema    — Zod types + validation
    generator/    # @gyxer-studio/generator  — NestJS code generation engine
    editor/       # @gyxer-studio/editor     — React Flow visual editor
    cli/          # @gyxer-studio/cli        — CLI wizard + generate command
  examples/       # Example schemas (blog, blog-with-auth, shop)
  .changeset/     # Changesets config (unified versioning)
  .github/        # CI/CD workflows
```

## Development

```bash
npm install          # install all dependencies
npm run build        # build all packages
npm test             # run all 149 tests
npm run dev          # start editor dev server
```

## Philosophy

- **No vendor lock-in** — eject anytime, the generated code is yours
- **Readable code** — if you wouldn't write it by hand, we won't generate it
- **Security by default** — not an afterthought
- **From real pain** — every feature solves a problem we've hit ourselves

## License

MIT

---

Built by [Gyxer](https://github.com/Gyxer513)
