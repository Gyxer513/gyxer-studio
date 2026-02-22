# Modules

Modules add pre-built functionality to your generated project.

## Available Modules

| Module | Status | Description |
|--------|--------|-------------|
| `auth-jwt` | **Implemented** | JWT authentication with refresh tokens |
| `auth-oauth` | Planned | OAuth2 integration |
| `auth-keycloak` | Planned | Keycloak SSO |
| `file-storage` | Planned | MinIO-based file uploads |
| `queues` | Planned | BullMQ background jobs |
| `search` | Planned | Elasticsearch integration |
| `cache` | Planned | Redis caching layer |
| `websockets` | Planned | Real-time events via Socket.IO |

## Enabling Modules

### In the Editor

Toggle the **JWT Auth** checkbox in the modules section of the right panel.

### In JSON

Add to the `modules` array:

```json
{
  "modules": [
    { "name": "auth-jwt", "enabled": true }
  ]
}
```

## Auth JWT Module

The JWT authentication module generates a complete auth system.

### Generated Files

```
src/auth/
  auth.module.ts          # NestJS module (imports PassportModule, JwtModule)
  auth.service.ts         # Register, login, refresh, profile logic
  auth.controller.ts      # REST endpoints
  dto/
    register.dto.ts       # Email + password validation
    login.dto.ts          # Email + password validation
    auth-response.dto.ts  # Token response type
    refresh-token.dto.ts  # Refresh token validation
  strategies/
    jwt.strategy.ts       # Passport JWT strategy
  guards/
    jwt-auth.guard.ts     # Global auth guard (respects @Public())
  decorators/
    current-user.decorator.ts  # Extract user from request
    public.decorator.ts        # Mark routes as public
```

### API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Create a new account | Public |
| `POST` | `/auth/login` | Get access + refresh tokens | Public |
| `POST` | `/auth/refresh` | Refresh access token | Public |
| `GET` | `/auth/profile` | Get current user profile | Protected |

### How It Works

- **Password hashing** — bcrypt with automatic salt
- **Global guard** — `JwtAuthGuard` is registered as `APP_GUARD`, so all routes are protected by default
- **Public routes** — use `@Public()` decorator to opt out of auth
- **Swagger** — `Bearer` auth added to Swagger UI via `.addBearerAuth()`
- **Prisma** — adds `passwordHash` field to the User model

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | — | Access token signing key |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |

### Dependencies Added

```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0"
}
```

::: warning
Always change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production. Use `openssl rand -hex 32` to generate strong keys.
:::
