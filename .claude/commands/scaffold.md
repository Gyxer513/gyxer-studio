Create a new Gyxer Studio project from the user's description.

## Instructions

1. Ask the user what backend they want to build (if not already described)
2. Use the `create_project` MCP tool with:
   - `name`: kebab-case project name
   - `description`: one-line description
   - `database`: postgresql (default), mysql, or sqlite
3. Based on the user's description, add entities using `add_entity` with appropriate fields
4. Add relations between entities using `add_relation`
5. Enable relevant modules using `enable_module`:
   - `auth-jwt` for authentication
   - `auth-oauth` for social login (requires auth-jwt first)
   - `file-storage` for file uploads
   - `cache` for Redis caching
   - `queues` for background jobs
   - `search` for full-text search
   - `websockets` for real-time features
   - `admin-dashboard` for admin panel
6. Call `generate_project` to produce the NestJS code
7. Show a summary of what was created

## Field Types

string, text, int, float, boolean, datetime, enum (needs enumValues), json, uuid

## Relation Types

one-to-one, one-to-many, many-to-many

## Rules

- Entity names: PascalCase (User, BlogPost)
- Field names: camelCase (firstName, isActive)
- Project names: kebab-case (my-api, blog-platform)
- Every entity needs at least one field (id is auto-generated)
- Enable auth-jwt before auth-oauth
- auth-keycloak and auth-jwt are mutually exclusive
