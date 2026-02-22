import type { GyxerProject } from '@gyxer/schema';

/**
 * Generate Dockerfile for the NestJS app.
 */
export function generateDockerfile(): string {
  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
`;
}

/**
 * Generate docker-compose.yml with app + PostgreSQL.
 */
export function generateDockerCompose(project: GyxerProject): string {
  const dbName = project.name.replace(/-/g, '_');

  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    environment:
      - DATABASE_URL=postgresql://postgres:\${DB_PASSWORD:-postgres}@db:5432/${dbName}
      - PORT=${project.settings.port}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
`;
}

/**
 * Generate .env and .env.example files.
 */
export function generateEnvFile(project: GyxerProject): string {
  const dbName = project.name.replace(/-/g, '_');
  return `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${dbName}
PORT=${project.settings.port}
DB_PASSWORD=postgres
DB_PORT=5432
`;
}

export function generateEnvExample(project: GyxerProject): string {
  return `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/YOUR_DB_NAME
PORT=${project.settings.port}
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=5432
`;
}
