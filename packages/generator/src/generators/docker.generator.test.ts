import { describe, it, expect } from 'vitest';
import {
  generateDockerfile,
  generateDockerCompose,
  generateEnvFile,
  generateEnvExample,
} from './docker.generator.js';
import type { GyxerProject } from '@gyxer/schema';

const baseProject: GyxerProject = {
  name: 'my-app',
  version: '0.1.0',
  description: 'Test',
  entities: [],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: false,
    docker: true,
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

    it('should run prisma db push before starting app', () => {
      const df = generateDockerfile();

      expect(df).toContain('prisma db push --skip-generate');
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

  describe('generateDockerCompose', () => {
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

    it('should handle hyphenated project names', () => {
      const project = { ...baseProject, name: 'my-cool-app' };
      const compose = generateDockerCompose(project);

      expect(compose).toContain('my_cool_app');
    });
  });

  describe('generateEnvFile', () => {
    it('should include DATABASE_URL', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('DATABASE_URL=');
      expect(env).toContain('postgresql://');
    });

    it('should use project name for database name', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('my_app');
    });

    it('should include PORT', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('PORT=3000');
    });

    it('should include DB_PASSWORD', () => {
      const env = generateEnvFile(baseProject);

      expect(env).toContain('DB_PASSWORD=postgres');
    });
  });

  describe('generateEnvExample', () => {
    it('should use placeholder values', () => {
      const env = generateEnvExample(baseProject);

      expect(env).toContain('YOUR_PASSWORD');
      expect(env).toContain('YOUR_DB_NAME');
    });

    it('should include all same keys as env file', () => {
      const env = generateEnvExample(baseProject);

      expect(env).toContain('DATABASE_URL=');
      expect(env).toContain('PORT=');
      expect(env).toContain('DB_PASSWORD=');
      expect(env).toContain('DB_PORT=');
    });
  });
});
