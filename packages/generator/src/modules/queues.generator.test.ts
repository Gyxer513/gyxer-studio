import { describe, it, expect } from 'vitest';
import { generateQueuesFiles, getQueuesDependencies, getQueuesEnvVars } from './queues.generator.js';
import type { GyxerProject } from '@gyxer-studio/schema';

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
  modules: [{ name: 'queues', enabled: true, options: {} }],
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

describe('Queues Generator', () => {
  it('should generate 4 files', () => {
    const files = generateQueuesFiles(baseProject);
    expect(files.size).toBe(4);
    expect(files.has('src/queues/queues.module.ts')).toBe(true);
    expect(files.has('src/queues/queues.service.ts')).toBe(true);
    expect(files.has('src/queues/queues.processor.ts')).toBe(true);
    expect(files.has('src/queues/dto/add-job.dto.ts')).toBe(true);
  });

  it('should use default queue name and concurrency', () => {
    const files = generateQueuesFiles(baseProject);
    const module = files.get('src/queues/queues.module.ts')!;
    expect(module).toContain("name: 'default'");
    const processor = files.get('src/queues/queues.processor.ts')!;
    expect(processor).toContain("concurrency: 5");
  });

  it('should use custom queue name and concurrency', () => {
    const custom: GyxerProject = {
      ...baseProject,
      modules: [{ name: 'queues', enabled: true, options: { queueName: 'emails', concurrency: 10 } }],
    };
    const files = generateQueuesFiles(custom);
    const module = files.get('src/queues/queues.module.ts')!;
    expect(module).toContain("name: 'emails'");
    const processor = files.get('src/queues/queues.processor.ts')!;
    expect(processor).toContain("concurrency: 10");
  });

  it('should generate BullMQ module with Redis config', () => {
    const files = generateQueuesFiles(baseProject);
    const module = files.get('src/queues/queues.module.ts')!;
    expect(module).toContain('BullModule.forRoot');
    expect(module).toContain('REDIS_HOST');
    expect(module).toContain('REDIS_PORT');
  });

  it('should generate service with addJob method', () => {
    const files = generateQueuesFiles(baseProject);
    const service = files.get('src/queues/queues.service.ts')!;
    expect(service).toContain('async addJob(');
    expect(service).toContain('@InjectQueue');
  });

  it('should generate processor extending WorkerHost', () => {
    const files = generateQueuesFiles(baseProject);
    const processor = files.get('src/queues/queues.processor.ts')!;
    expect(processor).toContain('extends WorkerHost');
    expect(processor).toContain('async process(job: Job)');
  });

  it('should return correct dependencies', () => {
    const deps = getQueuesDependencies();
    expect(deps['@nestjs/bullmq']).toBeDefined();
    expect(deps['bullmq']).toBeDefined();
  });

  it('should return Redis env vars', () => {
    const env = getQueuesEnvVars();
    expect(env).toContain('REDIS_URL=');
  });
});
