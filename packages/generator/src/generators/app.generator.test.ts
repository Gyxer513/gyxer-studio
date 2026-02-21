import { describe, it, expect } from 'vitest';
import { generateMain, generateAppModule } from './app.generator.js';
import type { GyxerProject } from '@gyxer/schema';

const baseProject: GyxerProject = {
  name: 'test-app',
  version: '0.1.0',
  description: 'Test app',
  entities: [
    {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [],
    },
  ],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: true,
  },
};

describe('App Generator', () => {
  describe('generateMain', () => {
    it('should generate main.ts matching snapshot', () => {
      expect(generateMain(baseProject)).toMatchSnapshot();
    });

    it('should include Swagger setup', () => {
      const main = generateMain(baseProject);
      expect(main).toContain('SwaggerModule');
      expect(main).toContain('DocumentBuilder');
    });

    it('should include Helmet when enabled', () => {
      const main = generateMain(baseProject);
      expect(main).toContain('helmet');
    });

    it('should include CORS when enabled', () => {
      const main = generateMain(baseProject);
      expect(main).toContain('enableCors');
    });

    it('should include ValidationPipe', () => {
      const main = generateMain(baseProject);
      expect(main).toContain('ValidationPipe');
      expect(main).toContain('whitelist: true');
    });

    it('should add BearerAuth to Swagger when auth-jwt enabled', () => {
      const projectWithAuth = {
        ...baseProject,
        modules: [{ name: 'auth-jwt' as const, enabled: true, options: {} }],
      };
      const main = generateMain(projectWithAuth);
      expect(main).toContain('.addBearerAuth()');
    });

    it('should NOT add BearerAuth when no auth module', () => {
      const main = generateMain(baseProject);
      expect(main).not.toContain('addBearerAuth');
    });

    it('should skip Swagger when disabled', () => {
      const noSwagger = {
        ...baseProject,
        settings: { ...baseProject.settings, enableSwagger: false },
      };
      const main = generateMain(noSwagger);
      expect(main).not.toContain('SwaggerModule');
    });
  });

  describe('generateAppModule', () => {
    it('should generate app.module.ts matching snapshot', () => {
      expect(generateAppModule(baseProject)).toMatchSnapshot();
    });

    it('should import PrismaModule', () => {
      const mod = generateAppModule(baseProject);
      expect(mod).toContain('PrismaModule');
    });

    it('should import entity modules', () => {
      const mod = generateAppModule(baseProject);
      expect(mod).toContain('UserModule');
    });

    it('should include ThrottlerModule when rate limit enabled', () => {
      const mod = generateAppModule(baseProject);
      expect(mod).toContain('ThrottlerModule');
      expect(mod).toContain('ThrottlerGuard');
    });

    it('should import AuthModule when auth-jwt enabled', () => {
      const projectWithAuth = {
        ...baseProject,
        modules: [{ name: 'auth-jwt' as const, enabled: true, options: {} }],
      };
      const mod = generateAppModule(projectWithAuth);
      expect(mod).toContain('AuthModule');
      expect(mod).toContain('JwtAuthGuard');
      expect(mod).toContain('APP_GUARD');
    });

    it('should NOT import AuthModule when no auth', () => {
      const mod = generateAppModule(baseProject);
      expect(mod).not.toContain('AuthModule');
      expect(mod).not.toContain('JwtAuthGuard');
    });
  });
});
