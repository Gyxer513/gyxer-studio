import { describe, it, expect } from 'vitest';
import type { GyxerProject } from '@gyxer-studio/schema';
import {
  generateAuthKeycloakFiles,
  getAuthKeycloakDependencies,
  getAuthKeycloakDevDependencies,
  getAuthKeycloakEnvVars,
} from './auth-keycloak.generator.js';

function makeProject(moduleOptions: Record<string, unknown> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: '',
    entities: [
      {
        name: 'Post',
        fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
        relations: [],
      },
    ],
    modules: [{ name: 'auth-keycloak', enabled: true, options: moduleOptions }],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: 'postgresql://localhost/test',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'postgres',
      dbPassword: 'postgres',
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: false,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: true,
    },
  };
}

describe('auth-keycloak.generator', () => {
  it('should generate 4 files', () => {
    const files = generateAuthKeycloakFiles(makeProject());
    expect(files.size).toBe(4);
    expect(files.has('src/auth/auth-keycloak.module.ts')).toBe(true);
    expect(files.has('src/auth/strategies/keycloak.strategy.ts')).toBe(true);
    expect(files.has('src/auth/guards/keycloak-auth.guard.ts')).toBe(true);
    expect(files.has('src/auth/decorators/public.decorator.ts')).toBe(true);
  });

  it('should use default realm "master"', () => {
    const files = generateAuthKeycloakFiles(makeProject());
    const strategy = files.get('src/auth/strategies/keycloak.strategy.ts')!;
    expect(strategy).toContain("'master'");
  });

  it('should use custom realm', () => {
    const files = generateAuthKeycloakFiles(makeProject({ realm: 'my-realm' }));
    const strategy = files.get('src/auth/strategies/keycloak.strategy.ts')!;
    expect(strategy).toContain("'my-realm'");
  });

  it('should use custom authServerUrl', () => {
    const files = generateAuthKeycloakFiles(makeProject({ authServerUrl: 'https://auth.example.com' }));
    const strategy = files.get('src/auth/strategies/keycloak.strategy.ts')!;
    expect(strategy).toContain("'https://auth.example.com'");
  });

  it('should generate strategy with JWKS validation', () => {
    const files = generateAuthKeycloakFiles(makeProject());
    const strategy = files.get('src/auth/strategies/keycloak.strategy.ts')!;
    expect(strategy).toContain('jwks-rsa');
    expect(strategy).toContain('passportJwtSecret');
    expect(strategy).toContain('RS256');
    expect(strategy).toContain('openid-connect/certs');
  });

  it('should generate guard with @Public() support', () => {
    const files = generateAuthKeycloakFiles(makeProject());
    const guard = files.get('src/auth/guards/keycloak-auth.guard.ts')!;
    expect(guard).toContain('IS_PUBLIC_KEY');
    expect(guard).toContain("AuthGuard('keycloak')");
  });

  it('should generate module with PassportModule', () => {
    const files = generateAuthKeycloakFiles(makeProject());
    const module = files.get('src/auth/auth-keycloak.module.ts')!;
    expect(module).toContain('PassportModule');
    expect(module).toContain('KeycloakStrategy');
  });

  it('should return correct dependencies', () => {
    const deps = getAuthKeycloakDependencies();
    expect(deps).toHaveProperty('jwks-rsa');
    expect(deps).toHaveProperty('passport-jwt');
    expect(deps).toHaveProperty('@nestjs/passport');
  });

  it('should return dev dependencies', () => {
    const devDeps = getAuthKeycloakDevDependencies();
    expect(devDeps).toHaveProperty('@types/passport-jwt');
  });

  it('should return env vars with Keycloak config', () => {
    const env = getAuthKeycloakEnvVars();
    expect(env).toContain('KEYCLOAK_AUTH_SERVER_URL');
    expect(env).toContain('KEYCLOAK_REALM');
    expect(env).toContain('KEYCLOAK_CLIENT_ID');
  });
});
