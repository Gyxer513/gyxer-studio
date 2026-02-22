# Code Generation

Gyxer generates a complete NestJS project with Prisma ORM.

## Output Structure

```
{project-name}/
  prisma/
    schema.prisma              # Data models, enums, relations
  src/
    prisma/
      prisma.service.ts        # PrismaClient wrapper with lifecycle hooks
      prisma.module.ts         # Global module exporting PrismaService
    {entity-kebab}/
      dto/
        create-{entity}.dto.ts # class-validator decorators
        update-{entity}.dto.ts # All fields optional (PartialType)
      {entity}.service.ts      # CRUD: create, findAll, findOne, update, remove
      {entity}.controller.ts   # REST endpoints with Swagger
      {entity}.module.ts       # NestJS module
    auth/                      # (when auth-jwt enabled)
      ...                      # See Modules page
    main.ts                    # Bootstrap with middleware
    app.module.ts              # Root module
  package.json
  tsconfig.json
  tsconfig.build.json
  .gitignore
  .env                         # Environment variables
  .env.example                 # Template without secrets
  Dockerfile                   # (when docker enabled)
  docker-compose.yml           # (when docker enabled)
  security-report.json         # Security assessment
```

## Generation Modes

### Browser (Visual Editor)

Two options from the **Generate** button:

- **To folder...** — uses the File System Access API to write files directly to a directory. Only available in Chromium-based browsers.
- **Download ZIP** — creates a ZIP archive using JSZip. Works in all browsers.

### CLI

```bash
# From a schema file
gyxer generate schema.json -o ./output

# Interactive wizard
gyxer new my-app
```

## What Gets Generated

### Prisma Schema

- Datasource from `settings.database` (PostgreSQL, MySQL, or SQLite)
- Uses `env("DATABASE_URL")` for connection string
- Auto-generated fields: `id`, `createdAt`, `updatedAt`
- Column mapping to snake_case via `@map()`
- Table mapping via `@@map()`
- Enums named `{EntityName}{FieldName}`

### DTOs

- **CreateDto** — all required fields with class-validator decorators
- **UpdateDto** — all fields optional (for partial updates)
- Decorators: `@IsString()`, `@IsInt()`, `@IsBoolean()`, `@IsDateString()`, `@IsIn()`, etc.
- Swagger: `@ApiProperty()` on every field

### Service

Standard CRUD operations wrapping Prisma:

- `create(dto)` — `prisma.entity.create()`
- `findAll()` — `prisma.entity.findMany()`
- `findOne(id)` — `prisma.entity.findUnique()`
- `update(id, dto)` — `prisma.entity.update()`
- `remove(id)` — `prisma.entity.delete()`

### Controller

REST endpoints for each entity:

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/{entities}` | Create |
| `GET` | `/{entities}` | List all |
| `GET` | `/{entities}/:id` | Get by ID |
| `PATCH` | `/{entities}/:id` | Update |
| `DELETE` | `/{entities}/:id` | Delete |

Routes are auto-pluralized from entity name (e.g., `User` becomes `/users`).

### main.ts

The bootstrap file includes:

- `app.enableCors()` when CORS is enabled
- `app.use(helmet())` when Helmet is enabled
- Swagger setup with `SwaggerModule` when enabled
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Listens on `settings.port`

### app.module.ts

Wires all entity modules together:

- Imports all entity modules
- Imports `PrismaModule` (global)
- Imports `ThrottlerModule` when rate limiting is enabled
- Registers global guards (`ThrottlerGuard`, `JwtAuthGuard`)

## Example: Blog with Auth

Input: `examples/blog-with-auth.json` (2 entities + auth-jwt module)

Output: **35 files** including User CRUD, Post CRUD, auth system, Prisma schema, Docker setup, and security report.

Security score: **100%** (all features enabled).
