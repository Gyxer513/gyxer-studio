# Docker & Deployment

When `docker: true` in settings, Gyxer generates a complete Docker setup.

## Generated Files

### Dockerfile

Multi-stage build for minimal production image:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

### docker-compose.yml

Two services with health checks:

- **app** — NestJS application, depends on database health
- **db** — PostgreSQL 16 (alpine) with persistent volume

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | auto-generated | Prisma connection string |
| `PORT` | `3000` | Server port |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_PORT` | `5432` | External PostgreSQL port |

### Auth JWT Variables (when enabled)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | JWT signing key |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | `change-me-refresh-secret` | Refresh token signing key |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |

## Running with Docker

```bash
# Start all services
docker compose up -d

# Run initial migration
docker compose exec app npx prisma migrate dev --name init

# View logs
docker compose logs -f app
```

## Database URL Formats

| Database | URL Format |
|----------|-----------|
| PostgreSQL | `postgresql://user:password@host:5432/dbname` |
| MySQL | `mysql://user:password@host:3306/dbname` |
| SQLite | `file:./dbname.db` |

## Production Checklist

- [ ] Change `DB_PASSWORD` to a strong password
- [ ] Set proper `JWT_SECRET` and `JWT_REFRESH_SECRET` (use `openssl rand -hex 32`)
- [ ] Disable Swagger or add authentication to it
- [ ] Configure CORS allowed origins (don't use `*` in production)
- [ ] Set up SSL/TLS termination (nginx, Cloudflare, etc.)
- [ ] Enable database backups
- [ ] Set `NODE_ENV=production`
