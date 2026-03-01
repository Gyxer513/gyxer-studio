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
  const { dbUser, dbPassword, dbPort } = project.settings;
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    environment:
      - DATABASE_URL=postgresql://${dbUser}:\${DB_PASSWORD:-${dbPassword}}@db:5432/${dbName}
      - PORT=${project.settings.port}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-${dbPassword}}
    ports:
      - "\${DB_PORT:-${dbPort}}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser}"]
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
  const { dbUser, dbPassword, dbPort } = project.settings;
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    environment:
      - DATABASE_URL=mysql://${dbUser}:\${DB_PASSWORD:-${dbPassword}}@db:3306/${dbName}
      - PORT=${project.settings.port}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${dbName}
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD:-${dbPassword}}
    ports:
      - "\${DB_PORT:-${dbPort}}:3306"
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

export function buildDatabaseUrl(
  settings: { database: string; dbHost: string; dbPort: number; dbUser: string; dbPassword: string },
  dbName: string,
): string {
  switch (settings.database) {
    case 'sqlite':
      return 'file:./prisma/dev.db';
    case 'mysql':
      return `mysql://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort}/${dbName}`;
    case 'postgresql':
    default:
      return `postgresql://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort}/${dbName}`;
  }
}

/**
 * Generate .env file with correct DATABASE_URL for the chosen database.
 * Uses ${VAR} references in DATABASE_URL to avoid password duplication (Prisma supports dotenv-expand).
 */
export function generateEnvFile(project: GyxerProject): string {
  const db = project.settings.database;
  const dbName = project.name.replace(/-/g, '_');

  if (db === 'sqlite') {
    return `DATABASE_URL=file:./prisma/dev.db
PORT=${project.settings.port}
`;
  }

  const protocol = db === 'mysql' ? 'mysql' : 'postgresql';

  return `DB_HOST=${project.settings.dbHost}
DB_PORT=${project.settings.dbPort}
DB_USER=${project.settings.dbUser}
DB_PASSWORD=${project.settings.dbPassword}
DATABASE_URL=${protocol}://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/${dbName}
PORT=${project.settings.port}
`;
}

export function generateEnvExample(project: GyxerProject): string {
  const db = project.settings.database;

  if (db === 'sqlite') {
    return `DATABASE_URL=file:./prisma/dev.db
PORT=${project.settings.port}
`;
  }

  const protocol = db === 'mysql' ? 'mysql' : 'postgresql';

  return `DB_HOST=localhost
DB_PORT=${project.settings.dbPort}
DB_USER=${db === 'mysql' ? 'root' : 'postgres'}
DB_PASSWORD=YOUR_PASSWORD
DATABASE_URL=${protocol}://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/YOUR_DB_NAME
PORT=${project.settings.port}
`;
}
