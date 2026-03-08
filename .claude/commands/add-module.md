Enable a module in the current Gyxer Studio project.

## Instructions

1. Use `enable_module` MCP tool with:
   - `moduleName`: one of the available modules
   - `options`: optional configuration object
2. Respect dependency rules:
   - `auth-oauth` requires `auth-jwt` to be enabled first
   - `auth-keycloak` and `auth-jwt` are mutually exclusive
3. Show confirmation of the enabled module

## Available Modules

| Module | Description | Dependencies |
|--------|-------------|-------------|
| auth-jwt | JWT authentication with access/refresh tokens, registration, login | None |
| auth-oauth | OAuth2 providers (Google, GitHub, Facebook) | Requires auth-jwt |
| auth-keycloak | Keycloak SSO integration | Conflicts with auth-jwt |
| file-storage | S3-compatible file upload/download with Multer | None |
| queues | BullMQ job queues with Redis | None |
| search | MeiliSearch full-text search | None |
| cache | Redis caching layer | None |
| websockets | Socket.IO real-time communication | None |
| admin-dashboard | React admin panel with CRUD UI | None |

## Disabling

Use `disable_module` to turn off a module. Disabling `auth-jwt` will also disable `auth-oauth` automatically.
