import { describe, it, expect } from 'vitest';
import type { GyxerProject } from '@gyxer-studio/schema';
import {
  generateAuthOAuthFiles,
  getAuthOAuthDependencies,
  getAuthOAuthDevDependencies,
  getAuthOAuthEnvVars,
} from './auth-oauth.generator.js';

function makeProject(moduleOptions: Record<string, unknown> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: '',
    entities: [
      {
        name: 'User',
        fields: [{ name: 'email', type: 'string', required: true, unique: true, index: true }],
        relations: [],
      },
    ],
    modules: [
      { name: 'auth-jwt', enabled: true, options: {} },
      { name: 'auth-oauth', enabled: true, options: moduleOptions },
    ],
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

describe('auth-oauth.generator', () => {
  it('should generate Google strategy by default', () => {
    const files = generateAuthOAuthFiles(makeProject());
    expect(files.has('src/auth/strategies/google.strategy.ts')).toBe(true);
    expect(files.has('src/auth/auth-oauth.controller.ts')).toBe(true);
  });

  it('should generate both Google and GitHub strategies', () => {
    const files = generateAuthOAuthFiles(makeProject({ providers: ['google', 'github'] }));
    expect(files.has('src/auth/strategies/google.strategy.ts')).toBe(true);
    expect(files.has('src/auth/strategies/github.strategy.ts')).toBe(true);
    expect(files.has('src/auth/auth-oauth.controller.ts')).toBe(true);
  });

  it('should generate only GitHub strategy when specified', () => {
    const files = generateAuthOAuthFiles(makeProject({ providers: ['github'] }));
    expect(files.has('src/auth/strategies/google.strategy.ts')).toBe(false);
    expect(files.has('src/auth/strategies/github.strategy.ts')).toBe(true);
  });

  it('should use custom callback URL', () => {
    const files = generateAuthOAuthFiles(makeProject({
      providers: ['google'],
      callbackUrl: 'https://myapp.com/auth',
    }));
    const strategy = files.get('src/auth/strategies/google.strategy.ts')!;
    expect(strategy).toContain('https://myapp.com/auth/google/callback');
  });

  it('should generate Google strategy with correct structure', () => {
    const files = generateAuthOAuthFiles(makeProject());
    const strategy = files.get('src/auth/strategies/google.strategy.ts')!;
    expect(strategy).toContain('passport-google-oauth20');
    expect(strategy).toContain('GOOGLE_CLIENT_ID');
    expect(strategy).toContain('GOOGLE_CLIENT_SECRET');
    expect(strategy).toContain("scope: ['email', 'profile']");
  });

  it('should generate GitHub strategy with correct structure', () => {
    const files = generateAuthOAuthFiles(makeProject({ providers: ['github'] }));
    const strategy = files.get('src/auth/strategies/github.strategy.ts')!;
    expect(strategy).toContain('passport-github2');
    expect(strategy).toContain('GITHUB_CLIENT_ID');
    expect(strategy).toContain('GITHUB_CLIENT_SECRET');
  });

  it('should generate controller with OAuth routes', () => {
    const files = generateAuthOAuthFiles(makeProject({ providers: ['google', 'github'] }));
    const controller = files.get('src/auth/auth-oauth.controller.ts')!;
    expect(controller).toContain("@Get('google')");
    expect(controller).toContain("@Get('google/callback')");
    expect(controller).toContain("@Get('github')");
    expect(controller).toContain("@Get('github/callback')");
    expect(controller).toContain('@Public()');
  });

  it('should return correct dependencies for Google', () => {
    const deps = getAuthOAuthDependencies(['google']);
    expect(deps).toHaveProperty('passport-google-oauth20');
    expect(deps).not.toHaveProperty('passport-github2');
  });

  it('should return correct dependencies for both', () => {
    const deps = getAuthOAuthDependencies(['google', 'github']);
    expect(deps).toHaveProperty('passport-google-oauth20');
    expect(deps).toHaveProperty('passport-github2');
  });

  it('should return dev dependencies', () => {
    const devDeps = getAuthOAuthDevDependencies(['google', 'github']);
    expect(devDeps).toHaveProperty('@types/passport-google-oauth20');
    expect(devDeps).toHaveProperty('@types/passport-github2');
  });

  it('should return env vars for selected providers', () => {
    const env = getAuthOAuthEnvVars(['google', 'github']);
    expect(env).toContain('GOOGLE_CLIENT_ID');
    expect(env).toContain('GOOGLE_CLIENT_SECRET');
    expect(env).toContain('GITHUB_CLIENT_ID');
    expect(env).toContain('GITHUB_CLIENT_SECRET');
  });
});
