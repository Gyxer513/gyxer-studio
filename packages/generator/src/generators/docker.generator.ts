import type { GyxerProject } from '@gyxer-studio/schema';

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
 * Generate docker-compose.yml adapted to the chosen database.
 * - PostgreSQL: app + postgres service
 * - SQLite: app only (file-based DB, no extra service)
 * - MySQL: app + mysql service
 */
export function generateDockerCompose(project: GyxerProject): string {
  const db = project.settings.database;
  const dbName = project.name.replace(/-/g, '_');

  if (db === 'sqlite') {
    return generateDockerComposeSqlite(project);
  }

  if (db === 'mysql') {
    return generateDockerComposeMysql(project, dbName);
  }

  // Default: PostgreSQL
  return generateDockerComposePostgres(project, dbName);
}

function generateDockerComposePostgres(project: GyxerProject, dbName: string): string {
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

function generateDockerComposeSqlite(project: GyxerProject): string {
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    environment:
      - DATABASE_URL=file:./prisma/dev.db
      - PORT=${project.settings.port}
    volumes:
      - sqlite-data:/app/prisma
    restart: unless-stopped

volumes:
  sqlite-data:
`;
}

function generateDockerComposeMysql(project: GyxerProject, dbName: string): string {
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    environment:
      - DATABASE_URL=mysql://root:\${DB_PASSWORD:-root}@db:3306/${dbName}
      - PORT=${project.settings.port}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${dbName}
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD:-root}
    ports:
      - "\${DB_PORT:-3306}:3306"
    volumes:
      - mysqldata:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mysqldata:
`;
}

// ─── Helper: build DATABASE_URL for a given database type ─────────

export function buildDatabaseUrl(db: string, dbName: string): string {
  switch (db) {
    case 'sqlite':
      return 'file:./prisma/dev.db';
    case 'mysql':
      return `mysql://root:root@localhost:3306/${dbName}`;
    case 'postgresql':
    default:
      return `postgresql://postgres:postgres@localhost:5432/${dbName}`;
  }
}

/**
 * Generate .env file with correct DATABASE_URL for the chosen database.
 */
export function generateEnvFile(project: GyxerProject): string {
  const db = project.settings.database;
  const dbName = project.name.replace(/-/g, '_');
  const url = buildDatabaseUrl(db, dbName);

  if (db === 'sqlite') {
    return `DATABASE_URL=${url}
PORT=${project.settings.port}
`;
  }

  const defaultPort = db === 'mysql' ? '3306' : '5432';
  const defaultPassword = db === 'mysql' ? 'root' : 'postgres';

  return `DATABASE_URL=${url}
PORT=${project.settings.port}
DB_PASSWORD=${defaultPassword}
DB_PORT=${defaultPort}
`;
}

export function generateEnvExample(project: GyxerProject): string {
  const db = project.settings.database;

  if (db === 'sqlite') {
    return `DATABASE_URL=file:./prisma/dev.db
PORT=${project.settings.port}
`;
  }

  if (db === 'mysql') {
    return `DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/YOUR_DB_NAME
PORT=${project.settings.port}
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=3306
`;
  }

  return `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/YOUR_DB_NAME
PORT=${project.settings.port}
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=5432
`;
}
