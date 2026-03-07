import { describe, it, expect } from 'vitest';
import type { GyxerProject } from '@gyxer-studio/schema';
import {
  generateWebsocketsFiles,
  getWebsocketsDependencies,
} from './websockets.generator.js';

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
    modules: [{ name: 'websockets', enabled: true, options: moduleOptions }],
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

describe('websockets.generator', () => {
  it('should generate 3 files', () => {
    const files = generateWebsocketsFiles(makeProject());
    expect(files.size).toBe(3);
    expect(files.has('src/websockets/websockets.module.ts')).toBe(true);
    expect(files.has('src/websockets/websockets.gateway.ts')).toBe(true);
    expect(files.has('src/websockets/dto/ws-message.dto.ts')).toBe(true);
  });

  it('should use default namespace "/"', () => {
    const files = generateWebsocketsFiles(makeProject());
    const gateway = files.get('src/websockets/websockets.gateway.ts')!;
    expect(gateway).toContain("namespace: '/'");
  });

  it('should use custom namespace', () => {
    const files = generateWebsocketsFiles(makeProject({ namespace: '/chat' }));
    const gateway = files.get('src/websockets/websockets.gateway.ts')!;
    expect(gateway).toContain("namespace: '/chat'");
  });

  it('should enable CORS by default', () => {
    const files = generateWebsocketsFiles(makeProject());
    const gateway = files.get('src/websockets/websockets.gateway.ts')!;
    expect(gateway).toContain("cors: { origin: '*' }");
  });

  it('should disable CORS when configured', () => {
    const files = generateWebsocketsFiles(makeProject({ cors: false }));
    const gateway = files.get('src/websockets/websockets.gateway.ts')!;
    expect(gateway).not.toContain('cors:');
  });

  it('should generate gateway with connect/disconnect handlers', () => {
    const files = generateWebsocketsFiles(makeProject());
    const gateway = files.get('src/websockets/websockets.gateway.ts')!;
    expect(gateway).toContain('handleConnection');
    expect(gateway).toContain('handleDisconnect');
    expect(gateway).toContain("@SubscribeMessage('message')");
    expect(gateway).toContain('broadcast');
  });

  it('should generate module with gateway export', () => {
    const files = generateWebsocketsFiles(makeProject());
    const module = files.get('src/websockets/websockets.module.ts')!;
    expect(module).toContain('AppGateway');
    expect(module).toContain('exports: [AppGateway]');
  });

  it('should return correct dependencies', () => {
    const deps = getWebsocketsDependencies();
    expect(deps).toHaveProperty('@nestjs/websockets');
    expect(deps).toHaveProperty('@nestjs/platform-socket.io');
    expect(deps).toHaveProperty('socket.io');
  });
});
