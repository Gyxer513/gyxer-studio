import { describe, it, expect } from 'vitest';
import {
  generateDockerfile,
  generateDockerCompose,
  generateEnvFile,
  generateEnvExample,
  buildDatabaseUrl,
  generateDockerignore,
} from './docker.generator.js';
import type { GyxerProject } from '@gyxer-studio/schema';

const baseProject: GyxerProject = {
  name: 'my-app',
  version: '0.1.0',
  description: 'Test',
  entities: [],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://postgres:postgres@localhost:5432/my_app',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'postgres',
    dbPassword: 'postgres',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: false,
    docker: true,
  },
};

const sqliteProject: GyxerProject = {
  ...baseProject,
  name: 'lite-app',
  settings: {
    ...baseProject.settings,
    database: 'sqlite',
    databaseUrl: 'file:./prisma/dev.db',
  },
};

const mysqlProject: GyxerProject = {
  ...baseProject,
  name: 'mysql-app',
  settings: {
    ...baseProject.settings,
    database: 'mysql',
    databaseUrl: 'mysql://root:root@localhost:3306/mysql_app',
    dbPort: 3306,
    dbUser: 'root',
    dbPassword: 'root',
  },
};

describe('Docker Generator', () => {
  describe('generateDockerfile', () => {
    it('should use multi-stage build', () => {
      const df = generateDockerfile();

      expect(df).toContain('AS builder');
      expect(df).toContain('AS runner');
    });

    it('should use node:20-alpine base image', () => {
      const df = generateDockerfile();

      expect(df).toContain('FROM node:20-alpine');
    });

    it('should run prisma generate in builder', () => {
      const df = generateDockerfile();

      expect(df).toContain('npx prisma generate');
    });

    it('should run prisma db push and seed before starting app', () => {
      const df = generateDockerfile();

      expect(df).toContain('prisma db push --skip-generate');
      expect(df).toContain('prisma db seed');
      expect(df).toContain('node dist/main.js');
    });

    it('should copy prisma directory to runner', () => {
      const df = generateDockerfile();

      expect(df).toContain('COPY --from=builder /app/prisma ./prisma');
    });

    it('should expose port 3000', () => {
      const df = generateDockerfile();

      expect(df).toContain('EXPOSE 3000');
    });
  });

  // ─── Docker Compose: PostgreSQL ─────────────────────────────

  describe('generateDockerCompose (postgresql)', () => {
    it('should include app and db services', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('app:');
      expect(compose).toContain('db:');
    });

    it('should use project name for database', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('my_app'); // my-app → my_app
    });

    it('should use postgres:16-alpine', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('postgres:16-alpine');
    });

    it('should include healthcheck', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('healthcheck');
      expect(compose).toContain('pg_isready');
    });

    it('should use correct port from settings', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('3000');
    });

    it('should include volume for pgdata', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('pgdata:');
      expect(compose).toContain('/var/lib/postgresql/data');
    });

    it('should set app dependency on db with healthy condition', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('depends_on');
      expect(compose).toContain('condition: service_healthy');
    });

    it('should include env_file for module env vars', () => {
      const compose = generateDockerCompose(baseProject);

      expect(compose).toContain('env_file: .env');
    });

    it('should handle hyphenated project names', () => {
      const project = { ...baseProject, name: 'my-cool-app' };
      const compose = generateDockerCompose(project);

      expect(compose).toContain('my_cool_app');
    });
  });

  // ─── Docker Compose: SQLite ─────────────────────────────────

  describe('generateDockerCompose (sqlite)', () => {
    it('should include only app service, no db', () => {
      const compose = generateDockerCompose(sqliteProject);

      expect(compose).toContain('app:');
      expect(compose).not.toContain('db:');
      expect(compose).not.toContain('postgres');
      expect(compose).not.toContain('mysql');
    });

    it('should use file-based DATABASE_URL', () => {
      const compose = generateDockerCompose(sqliteProject);

      expect(compose).toContain('DATABASE_URL=file:./prisma/dev.db');
    });

    it('should use sqlite-data volume', () => {
      const compose = generateDockerCompose(sqliteProject);

      expect(compose).toContain('sqlite-data:');
      expect(compose).toContain('sqlite-data:/app/prisma');
    });

    it('should not have depends_on', () => {
      const compose = generateDockerCompose(sqliteProject);

      expect(compose).not.toContain('depends_on');
    });
  });

  // ─── Docker Compose: MySQL ──────────────────────────────────

  describe('generateDockerCompose (mysql)', () => {
    it('should include app and db services', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('app:');
      expect(compose).toContain('db:');
    });

    it('should use mysql:8 image', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('mysql:8');
    });

    it('should use mysql DATABASE_URL', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('DATABASE_URL=mysql://');
      expect(compose).toContain('mysql_app');
    });

    it('should include mysqladmin healthcheck', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('healthcheck');
      expect(compose).toContain('mysqladmin');
    });

    it('should use port 3306', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('3306}:3306');
    });

    it('should include mysqldata volume', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('mysqldata:');
      expect(compose).toContain('/var/lib/mysql');
    });

    it('should set MYSQL_DATABASE and MYSQL_ROOT_PASSWORD', () => {
      const compose = generateDockerCompose(mysqlProject);

      expect(compose).toContain('MYSQL_DATABASE: mysql_app');
      expect(compose).toContain('MYSQL_ROOT_PASSWORD:');
    });
  });

  // ─── .env file ──────────────────────────────────────────────

  describe('generateEnvFile', () => {
    it('should include DATABASE_URL with variable references for postgresql', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('DATABASE_URL=postgresql://');
      expect(env).toContain('${DB_USER}');
      expect(env).toContain('${DB_PASSWORD}');
      expect(env).toContain('${DB_HOST}');
      expect(env).toContain('${DB_PORT}');
    });

    it('should use project name for database name', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('my_app');
    });

    it('should include PORT', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('PORT=3000');
    });

    it('should include individual DB fields', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('DB_HOST=localhost');
      expect(env).toContain('DB_PORT=5432');
      expect(env).toContain('DB_USER=postgres');
      expect(env).toContain('DB_PASSWORD=postgres');
    });

    it('should use custom credentials from settings', () => {
      const customProject: GyxerProject = {
        ...baseProject,
        settings: {
          ...baseProject.settings,
          dbHost: 'db.example.com',
          dbPort: 5433,
          dbUser: 'admin',
          dbPassword: 'secret123',
        },
      };
      const env = generateEnvFile(customProject);

      expect(env).toContain('DB_HOST=db.example.com');
      expect(env).toContain('DB_PORT=5433');
      expect(env).toContain('DB_USER=admin');
      expect(env).toContain('DB_PASSWORD=secret123');
    });

    it('should use file URL for sqlite', () => {
      const env = generateEnvFile(sqliteProject);

      expect(env).toContain('DATABASE_URL=file:./prisma/dev.db');
      expect(env).not.toContain('DB_PASSWORD');
      expect(env).not.toContain('DB_PORT');
    });

    it('should use mysql URL for mysql', () => {
      const env = generateEnvFile(mysqlProject);

      expect(env).toContain('DATABASE_URL=mysql://');
      expect(env).toContain('DB_PASSWORD=root');
      expect(env).toContain('DB_PORT=3306');
    });
  });

  // ─── .env.example ───────────────────────────────────────────

  describe('generateEnvExample', () => {
    it('should use placeholder values for postgresql', () => {
      const env = generateEnvExample(baseProject);

      expect(env).toContain('YOUR_PASSWORD');
      expect(env).toContain('YOUR_DB_NAME');
    });

    it('should include all same keys as env file for postgresql', () => {
      const env = generateEnvExample(baseProject);

      expect(env).toContain('DATABASE_URL=');
      expect(env).toContain('PORT=');
      expect(env).toContain('DB_HOST=');
      expect(env).toContain('DB_PORT=');
      expect(env).toContain('DB_USER=');
      expect(env).toContain('DB_PASSWORD=');
    });

    it('should use file URL for sqlite example', () => {
      const env = generateEnvExample(sqliteProject);

      expect(env).toContain('DATABASE_URL=file:./prisma/dev.db');
      expect(env).not.toContain('DB_PASSWORD');
    });

    it('should use mysql placeholders for mysql example', () => {
      const env = generateEnvExample(mysqlProject);

      expect(env).toContain('DATABASE_URL=mysql://');
      expect(env).toContain('YOUR_PASSWORD');
      expect(env).toContain('DB_PORT=3306');
    });
  });

  // ─── Admin embedded in main Dockerfile ─────────────────────

  describe('admin embedded in Dockerfile', () => {
    it('should not include admin service in docker-compose', () => {
      const adminProject: GyxerProject = {
        ...baseProject,
        modules: [{ name: 'admin-dashboard', enabled: true, options: {} }],
      };
      const compose = generateDockerCompose(adminProject);

      expect(compose).not.toContain('admin:');
      expect(compose).not.toContain('build: ./admin');
    });

    it('should copy pre-built admin/dist to public/ when hasAdmin is true', () => {
      const df = generateDockerfile(true);

      expect(df).toContain('COPY admin/dist ./public');
      expect(df).not.toContain('admin-builder');
    });

    it('should not copy admin when hasAdmin is false', () => {
      const df = generateDockerfile(false);

      expect(df).not.toContain('./public');
      expect(df).not.toContain('admin');
    });

    it('should exclude admin sources but keep admin/dist in dockerignore when hasAdmin', () => {
      const di = generateDockerignore(true);

      expect(di).toContain('admin/node_modules');
      expect(di).toContain('admin/src');
      expect(di).not.toMatch(/^admin$/m);
    });

    it('should exclude admin entirely in dockerignore when no admin', () => {
      const di = generateDockerignore(false);

      expect(di).toContain('admin');
      expect(di).not.toContain('admin/node_modules');
    });
  });

  // ─── .dockerignore ─────────────────────────────────────────

  describe('generateDockerignore', () => {
    it('should exclude node_modules and dist', () => {
      const di = generateDockerignore();

      expect(di).toContain('node_modules');
      expect(di).toContain('dist');
    });

    it('should exclude .env files', () => {
      const di = generateDockerignore();

      expect(di).toContain('.env');
      expect(di).toContain('.env.local');
    });
  });

  // ─── buildDatabaseUrl ───────────────────────────────────────

  describe('buildDatabaseUrl', () => {
    const pgSettings = { database: 'postgresql', dbHost: 'localhost', dbPort: 5432, dbUser: 'postgres', dbPassword: 'postgres' };
    const mysqlSettings = { database: 'mysql', dbHost: 'localhost', dbPort: 3306, dbUser: 'root', dbPassword: 'root' };
    const sqliteSettings = { database: 'sqlite', dbHost: '', dbPort: 0, dbUser: '', dbPassword: '' };

    it('should return postgresql URL by default', () => {
      const url = buildDatabaseUrl(pgSettings, 'my_db');

      expect(url).toBe('postgresql://postgres:postgres@localhost:5432/my_db');
    });

    it('should return file URL for sqlite', () => {
      const url = buildDatabaseUrl(sqliteSettings, 'my_db');

      expect(url).toBe('file:./prisma/dev.db');
    });

    it('should return mysql URL for mysql', () => {
      const url = buildDatabaseUrl(mysqlSettings, 'my_db');

      expect(url).toBe('mysql://root:root@localhost:3306/my_db');
    });

    it('should use custom credentials', () => {
      const custom = { database: 'postgresql', dbHost: 'db.prod.com', dbPort: 5433, dbUser: 'admin', dbPassword: 'secret' };
      const url = buildDatabaseUrl(custom, 'prod_db');

      expect(url).toBe('postgresql://admin:secret@db.prod.com:5433/prod_db');
    });

    it('should default to postgresql for unknown db type', () => {
      const unknown = { ...pgSettings, database: 'unknown' };
      const url = buildDatabaseUrl(unknown, 'test_db');

      expect(url).toBe('postgresql://postgres:postgres@localhost:5432/test_db');
    });
  });
});
