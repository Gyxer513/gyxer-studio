import { describe, it, expect } from 'vitest';
import type { GyxerProject } from '@gyxer-studio/schema';
import {
  generateFileStorageFiles,
  getFileStorageDependencies,
  getFileStorageDevDependencies,
  getFileStorageEnvVars,
} from './file-storage.generator.js';

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
    modules: [{ name: 'file-storage', enabled: true, options: moduleOptions }],
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

describe('file-storage.generator', () => {
  it('should generate 4 files', () => {
    const files = generateFileStorageFiles(makeProject());
    expect(files.size).toBe(4);
    expect(files.has('src/storage/storage.module.ts')).toBe(true);
    expect(files.has('src/storage/storage.service.ts')).toBe(true);
    expect(files.has('src/storage/storage.controller.ts')).toBe(true);
    expect(files.has('src/storage/dto/upload-file.dto.ts')).toBe(true);
  });

  it('should use default bucket "uploads"', () => {
    const files = generateFileStorageFiles(makeProject());
    const service = files.get('src/storage/storage.service.ts')!;
    expect(service).toContain("'uploads'");
  });

  it('should use custom bucket name', () => {
    const files = generateFileStorageFiles(makeProject({ bucket: 'my-files' }));
    const service = files.get('src/storage/storage.service.ts')!;
    expect(service).toContain("'my-files'");
  });

  it('should generate S3 client with MinIO defaults', () => {
    const files = generateFileStorageFiles(makeProject());
    const service = files.get('src/storage/storage.service.ts')!;
    expect(service).toContain('S3Client');
    expect(service).toContain('forcePathStyle: true');
    expect(service).toContain('S3_ENDPOINT');
  });

  it('should generate controller with upload/download/delete endpoints', () => {
    const files = generateFileStorageFiles(makeProject());
    const controller = files.get('src/storage/storage.controller.ts')!;
    expect(controller).toContain("@Post('upload')");
    expect(controller).toContain("@Get(':key')");
    expect(controller).toContain("@Delete(':key')");
    expect(controller).toContain('FileInterceptor');
    expect(controller).toContain("@ApiTags('files')");
  });

  it('should use custom maxFileSize for validation', () => {
    const files = generateFileStorageFiles(makeProject({ maxFileSize: 10 }));
    const controller = files.get('src/storage/storage.controller.ts')!;
    // 10 MB = 10 * 1024 * 1024 = 10485760
    expect(controller).toContain('10485760');
  });

  it('should use default 5MB limit', () => {
    const files = generateFileStorageFiles(makeProject());
    const controller = files.get('src/storage/storage.controller.ts')!;
    // 5 MB = 5 * 1024 * 1024 = 5242880
    expect(controller).toContain('5242880');
  });

  it('should return correct dependencies', () => {
    const deps = getFileStorageDependencies();
    expect(deps).toHaveProperty('@aws-sdk/client-s3');
    expect(deps).toHaveProperty('@aws-sdk/s3-request-presigner');
    expect(deps).toHaveProperty('uuid');
  });

  it('should return correct dev dependencies', () => {
    const devDeps = getFileStorageDevDependencies();
    expect(devDeps).toHaveProperty('@types/multer');
    expect(devDeps).toHaveProperty('@types/uuid');
  });

  it('should return env vars with S3 config', () => {
    const env = getFileStorageEnvVars();
    expect(env).toContain('S3_ENDPOINT');
    expect(env).toContain('S3_ACCESS_KEY');
    expect(env).toContain('S3_SECRET_KEY');
    expect(env).toContain('S3_BUCKET');
  });

  it('should generate storage module with correct structure', () => {
    const files = generateFileStorageFiles(makeProject());
    const module = files.get('src/storage/storage.module.ts')!;
    expect(module).toContain('StorageService');
    expect(module).toContain('StorageController');
    expect(module).toContain('exports: [StorageService]');
  });
});
