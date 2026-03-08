Generate the NestJS project from the current Gyxer Studio schema.

## Instructions

1. First call `get_project` to review the current project state
2. Verify the project has at least one entity with fields
3. Call `generate_project` MCP tool with optional `outputDir` parameter
4. Report the results: number of generated files and security score
5. If there are validation errors, suggest fixes

## What Gets Generated

- Prisma schema with all entities, relations, and enums
- NestJS modules, controllers, services for each entity
- DTOs (Create/Update) with class-validator decorators
- CRUD endpoints with pagination and filtering
- Authentication (if auth module enabled)
- Docker setup (Dockerfile, docker-compose.yml)
- E2E tests for all endpoints
- Seed data scripts
- Environment configuration
- All enabled module integrations

## Output

The generated project is a complete, production-ready NestJS application that can be started with `docker compose up`.
