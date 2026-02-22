# Gyxer Studio

Visual backend builder that generates production-ready NestJS applications.

> Design your backend visually. Get clean, readable code. No vendor lock-in.

## What is Gyxer Studio?

Gyxer Studio is a visual tool for building production-ready backends. You design data models and relationships in a drag-and-drop editor, pick the modules you need, and Gyxer generates a complete NestJS project with best practices baked in.

**Target audience:** Solo developers, indie hackers, and small teams who want to skip boilerplate and ship faster.

## Quick Start

### Visual Editor

```bash
git clone https://github.com/Gyxer513/gyxer-studio.git
cd gyxer-studio
npm install
npm run dev
```

Open `http://localhost:5173` — add entities, configure fields and relations, then hit **Generate**.

### CLI

```bash
npx gyxer new my-app
```

Interactive wizard: choose database, port, Swagger, JWT Auth, Docker, Helmet, Rate Limit — project generated in seconds.

## Features

| Feature | Description |
|---------|------------|
| **Visual Model Editor** | Drag-and-drop data modeling with React Flow |
| **Code Generation** | Clean NestJS + Prisma — CRUD, DTOs, Swagger, validation |
| **Relations** | 1:1, 1:N, N:M with onDelete actions and foreign keys |
| **Auth JWT** | Full auth system — register, login, refresh tokens, guards |
| **Security Report** | Helmet, Rate Limiting, CORS, secrets check on every build |
| **Docker** | Dockerfile + docker-compose.yml, ready to `docker compose up` |
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
    prisma/                     # PrismaService + PrismaModule
    user/                       # Module, controller, service, DTOs
    post/                       # Module, controller, service, DTOs
    auth/                       # JWT auth (when enabled)
    main.ts                     # Swagger, Helmet, CORS, ValidationPipe
    app.module.ts               # All modules wired together
  Dockerfile                    # Multi-stage build
  docker-compose.yml            # App + PostgreSQL
  .env / .env.example           # Environment config
  security-report.json          # Security assessment
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor | React 19, React Flow v12, Zustand v5, Tailwind CSS, Vite 6 |
| Schema | TypeScript + Zod validation |
| Generator | TypeScript, string-based code generation |
| CLI | Commander, Inquirer, Chalk, Ora |
| Generated Backend | NestJS, Prisma, class-validator, Swagger |
| Database | PostgreSQL, MySQL, SQLite |

## Documentation

Full documentation available at [docs/](./docs/) — run locally:

```bash
npm run docs:dev
```

- [Getting Started](./docs/getting-started.md)
- [Visual Editor Guide](./docs/guide/visual-editor.md)
- [Field Types](./docs/guide/field-types.md)
- [Schema Specification](./docs/reference/schema.md)
- [Security Report](./docs/reference/security.md)
- [Docker & Deployment](./docs/reference/docker.md)

## Project Structure

```
gyxer-studio/
  packages/
    schema/       # @gyxer/schema  — Zod validation + TypeScript types
    generator/    # @gyxer/generator — NestJS code generation engine
    editor/       # @gyxer/editor   — React Flow visual editor
    cli/          # @gyxer/cli      — CLI wizard
  examples/       # Example schemas (blog, blog-with-auth)
  docs/           # VitePress documentation
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
