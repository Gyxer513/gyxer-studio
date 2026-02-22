import { describe, it, expect } from 'vitest';
import { generateSecurityReport } from './report.js';
import type { GyxerProject } from '@gyxer-studio/schema';

const fullSecurityProject: GyxerProject = {
  name: 'secure-app',
  version: '0.1.0',
  description: '',
  entities: [
    { name: 'User', fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }], relations: [] },
  ],
  modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: false,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: true,
  },
};

const weakProject: GyxerProject = {
  name: 'weak-app',
  version: '0.1.0',
  description: '',
  entities: [
    { name: 'Item', fields: [{ name: 'name', type: 'string', required: true, unique: false, index: false }], relations: [] },
  ],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: false,
    enableHelmet: false,
    enableRateLimit: false,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: false,
  },
};

describe('Security Report', () => {
  it('should give 100% score for fully secure project', () => {
    const report = generateSecurityReport(fullSecurityProject);
    expect(report.score).toBe(100);
    expect(report.failed).toBe(0);
  });

  it('should detect missing Helmet', () => {
    const report = generateSecurityReport(weakProject);
    const helmet = report.checks.find((c) => c.name.includes('Helmet'));
    expect(helmet).toBeDefined();
    expect(helmet!.passed).toBe(false);
  });

  it('should detect missing rate limiting', () => {
    const report = generateSecurityReport(weakProject);
    const rateLimit = report.checks.find((c) => c.name.includes('Rate'));
    expect(rateLimit).toBeDefined();
    expect(rateLimit!.passed).toBe(false);
  });

  it('should detect missing authentication', () => {
    const report = generateSecurityReport(weakProject);
    const auth = report.checks.find((c) => c.name.includes('Authentication'));
    expect(auth).toBeDefined();
    expect(auth!.passed).toBe(false);
  });

  it('should pass authentication check when auth-jwt enabled', () => {
    const report = generateSecurityReport(fullSecurityProject);
    const auth = report.checks.find((c) => c.name.includes('Authentication'));
    expect(auth).toBeDefined();
    expect(auth!.passed).toBe(true);
  });

  it('should include project name and timestamp', () => {
    const report = generateSecurityReport(fullSecurityProject);
    expect(report.projectName).toBe('secure-app');
    expect(report.timestamp).toBeDefined();
  });
});
