# Gyxer Studio

Visual backend builder that generates production-ready NestJS applications.

> Build your backend visually. Get clean, readable code. No vendor lock-in.

## What is Gyxer Studio?

Gyxer Studio is a visual tool for building production-ready backends. You design data models and relationships in a drag-and-drop editor, pick the modules you need, and Gyxer generates a complete NestJS project with best practices baked in.

**Target audience:** Solo developers, indie hackers, and small teams who want to skip boilerplate and ship faster.

## Features

- **Visual Model Editor** — drag-and-drop data modeling with React Flow
- **Code Generation** — clean NestJS + Prisma code you actually want to read
- **Module System** — add Auth, File Storage, Queues, Search with a checkbox
- **Security Report** — Helmet, Rate Limiting, CORS, secrets check on every generation
- **Built-in HTTP Client** — test your API right from the editor
- **Docker Compose** — generated and ready to `docker compose up`
- **CLI** — `npx gyxer new`, `generate`, `add`, `deploy`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor | React, React Flow, TypeScript |
| Generated Backend | NestJS, Prisma, TypeScript |
| Database | PostgreSQL |
| Optional Modules | Redis, BullMQ, MinIO, JWT/OAuth/Keycloak, Elasticsearch |
| Infrastructure | Docker, Docker Compose |

## Available Modules

| Module | Description |
|--------|------------|
| `auth-jwt` | JWT authentication with refresh tokens |
| `auth-oauth` | OAuth2 (Google, GitHub, etc.) |
| `auth-keycloak` | Keycloak integration |
| `file-storage` | MinIO-based file uploads |
| `queues` | BullMQ background jobs |
| `search` | Elasticsearch integration |
| `cache` | Redis caching layer |
| `websockets` | Real-time events via Socket.IO |

## Roadmap

- [x] Project vision & architecture
- [ ] Visual model editor (entities, fields, relations)
- [ ] NestJS code generator (CRUD, DTOs, Swagger)
- [ ] Prisma schema generation
- [ ] Module system (auth, storage, queues)
- [ ] Security report
- [ ] CLI (`gyxer new`, `generate`, `add`)
- [ ] Built-in HTTP client
- [ ] Docker Compose generation
- [ ] Public release (open source)

## How It Will Work

```
# Create a new project
npx gyxer new my-app

# Open visual editor
npx gyxer studio

# Generate backend from your model
npx gyxer generate

# Add a module
npx gyxer add auth-jwt

# Start everything
docker compose up
```

## Philosophy

- **From real pain** — every feature solves a problem we've hit ourselves
- **No vendor lock-in** — eject anytime, the generated code is yours
- **Readable code** — if you wouldn't write it by hand, we won't generate it
- **Security by default** — not an afterthought

## License

MIT

---

Built by [Gyxer](https://gyxer.com)
