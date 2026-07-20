import type { GyxerProject } from '@gyxer-studio/schema';

// ─── Helper: detect which module services are needed ──────────────

interface ModuleFlags {
  needsRedis: boolean;
  needsMinio: boolean;
  needsMeili: boolean;
  needsKeycloak: boolean;
}

function getModuleFlags(project: GyxerProject): ModuleFlags {
  const modules = project.modules || [];
  const has = (name: string) => modules.some((m) => m.name === name && m.enabled !== false);
  const storageModule = modules.find((m) => m.name === 'file-storage' && m.enabled !== false);
  const provider = (storageModule?.options?.provider as string) || 'minio';

  return {
    needsRedis: has('cache') || has('queues'),
    needsMinio: has('file-storage') && provider === 'minio',
    needsMeili: has('search'),
    needsKeycloak: has('auth-keycloak') && !has('auth-jwt'),
  };
}

function generateModuleAppEnv(flags: ModuleFlags): string {
  const lines: string[] = [];
  if (flags.needsRedis)    lines.push('      - REDIS_URL=redis://redis:6379');
  if (flags.needsMinio)    lines.push('      - S3_ENDPOINT=http://minio:9000');
  if (flags.needsMeili)    lines.push('      - MEILISEARCH_HOST=http://meilisearch:7700');
  if (flags.needsKeycloak) lines.push('      - KEYCLOAK_AUTH_SERVER_URL=http://keycloak:8080');
  return lines.length ? '\n' + lines.join('\n') : '';
}

function generateModuleAppDependsOn(flags: ModuleFlags): string {
  const deps: string[] = [];
  if (flags.needsRedis)    deps.push('      redis:\n        condition: service_healthy');
  if (flags.needsMinio)    deps.push('      minio:\n        condition: service_healthy');
  if (flags.needsMeili)    deps.push('      meilisearch:\n        condition: service_healthy');
  if (flags.needsKeycloak) deps.push('      keycloak:\n        condition: service_started');
  return deps.length ? '\n' + deps.join('\n') : '';
}

function generateModuleServices(flags: ModuleFlags): string {
  const blocks: string[] = [];

  if (flags.needsRedis) {
    blocks.push(`
  redis:
    image: redis:7-alpine
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);
  }

  if (flags.needsMinio) {
    blocks.push(`
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "\${MINIO_PORT:-9000}:9000"
      - "\${MINIO_CONSOLE_PORT:-9001}:9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - miniodata:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);
  }

  if (flags.needsMeili) {
    blocks.push(`
  meilisearch:
    image: getmeili/meilisearch:latest
    ports:
      - "\${MEILI_PORT:-7700}:7700"
    environment:
      MEILI_MASTER_KEY: \${MEILI_MASTER_KEY:-masterkey}
    volumes:
      - meilidata:/meili_data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);
  }

  if (flags.needsKeycloak) {
    blocks.push(`
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: start-dev
    ports:
      - "\${KEYCLOAK_PORT:-8080}:8080"
    environment:
      KEYCLOAK_ADMIN: \${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: \${KEYCLOAK_ADMIN_PASSWORD:-admin}
    restart: unless-stopped`);
  }

  return blocks.join('\n');
}

function generateModuleVolumes(flags: ModuleFlags): string {
  const vols: string[] = [];
  if (flags.needsRedis) vols.push('  redisdata:');
  if (flags.needsMinio) vols.push('  miniodata:');
  if (flags.needsMeili) vols.push('  meilidata:');
  return vols.length ? '\n' + vols.join('\n') : '';
}

/**
 * Generate Dockerfile for the NestJS app.
 * When hasAdmin is true, expects admin/dist/ to be pre-built locally
 * (cd admin && npm install && npm run build) and copies it into /app/public
 * so ServeStaticModule can serve it.
 */
export function generateDockerfile(hasAdmin = false): string {
  const copyAdmin = hasAdmin
    ? '\nCOPY admin/dist ./public'
    : '';

  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma${copyAdmin}
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate && (npx prisma db seed 2>/dev/null || true) && node dist/main.js"]
`;
}

/**
 * Generate docker-compose.yml adapted to the chosen database.
 * Includes additional services for enabled modules (Redis, MinIO, MeiliSearch, Keycloak).
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
  const flags = getModuleFlags(project);
  const moduleEnv = generateModuleAppEnv(flags);
  const moduleDeps = generateModuleAppDependsOn(flags);
  const moduleServices = generateModuleServices(flags);
  const moduleVolumes = generateModuleVolumes(flags);

  return `services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://${dbUser}:\${DB_PASSWORD:-${dbPassword}}@db:5432/${dbName}
      - PORT=${project.settings.port}${moduleEnv}
    depends_on:
      db:
        condition: service_healthy${moduleDeps}
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
    restart: unless-stopped${moduleServices}

volumes:
  pgdata:${moduleVolumes}
`;
}

function generateDockerComposeSqlite(project: GyxerProject): string {
  const flags = getModuleFlags(project);
  const moduleEnv = generateModuleAppEnv(flags);
  const moduleServices = generateModuleServices(flags);
  const moduleVolumes = generateModuleVolumes(flags);
  const hasModuleDeps = flags.needsRedis || flags.needsMinio || flags.needsMeili || flags.needsKeycloak;
  const moduleDeps = generateModuleAppDependsOn(flags);
  const dependsOnBlock = hasModuleDeps ? `\n    depends_on:${moduleDeps}` : '';

  return `services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    env_file: .env
    environment:
      - DATABASE_URL=file:./dev.db
      - PORT=${project.settings.port}${moduleEnv}
    volumes:
      - sqlite-data:/app/prisma${dependsOnBlock}
    restart: unless-stopped${moduleServices}

volumes:
  sqlite-data:${moduleVolumes}
`;
}

function generateDockerComposeMysql(project: GyxerProject, dbName: string): string {
  const { dbUser, dbPassword, dbPort } = project.settings;
  const flags = getModuleFlags(project);
  const moduleEnv = generateModuleAppEnv(flags);
  const moduleDeps = generateModuleAppDependsOn(flags);
  const moduleServices = generateModuleServices(flags);
  const moduleVolumes = generateModuleVolumes(flags);

  return `services:
  app:
    build: .
    ports:
      - "\${PORT:-${project.settings.port}}:${project.settings.port}"
    env_file: .env
    environment:
      - DATABASE_URL=mysql://${dbUser}:\${DB_PASSWORD:-${dbPassword}}@db:3306/${dbName}
      - PORT=${project.settings.port}${moduleEnv}
    depends_on:
      db:
        condition: service_healthy${moduleDeps}
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
    restart: unless-stopped${moduleServices}

volumes:
  mysqldata:${moduleVolumes}
`;
}

// ─── Helper: build DATABASE_URL for a given database type ─────────

export function buildDatabaseUrl(
  settings: { database: string; dbHost: string; dbPort: number; dbUser: string; dbPassword: string },
  dbName: string,
): string {
  switch (settings.database) {
    case 'sqlite':
      return 'file:./dev.db';
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
    return `DATABASE_URL=file:./dev.db
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

/**
 * Generate .dockerignore for the NestJS app.
 * When hasAdmin is true, only admin/dist is kept (pre-built locally).
 * Everything else under admin/ is excluded.
 */
export function generateDockerignore(hasAdmin = false): string {
  const adminLines = hasAdmin
    ? 'admin/node_modules\nadmin/src\nadmin/*.json\nadmin/*.ts\nadmin/*.js\nadmin/*.html'
    : 'admin';

  return `node_modules
dist
${adminLines}
.env
.env.local
.git
*.md
coverage
prisma/*.db
prisma/*.db-journal
`;
}

export function generateEnvExample(project: GyxerProject): string {
  const db = project.settings.database;

  if (db === 'sqlite') {
    return `DATABASE_URL=file:./dev.db
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
