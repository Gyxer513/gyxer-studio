import fs from 'fs-extra';
import * as path from 'path';
import type { GyxerProject } from '@gyxer-studio/schema';
import { toKebabCase } from './utils.js';
import { generatePrismaSchema } from './generators/prisma.generator.js';
import { generateCreateDto, generateUpdateDto } from './generators/dto.generator.js';
import { generateService } from './generators/service.generator.js';
import { generateController } from './generators/controller.generator.js';
import { generateModule } from './generators/module.generator.js';
import { generateServiceSpec, generateControllerSpec } from './generators/test.generator.js';
import {
  generateMain,
  generateAppModule,
  generateAppController,
  generateNestCliJson,
  generatePrismaService,
  generatePrismaModule,
  generatePrismaExceptionFilter,
  generatePrettierRc,
  generateEslintConfig,
} from './generators/app.generator.js';
import {
  generateDockerfile,
  generateDockerCompose,
  generateEnvFile,
  generateEnvExample,
} from './generators/docker.generator.js';
import { generateSecurityReport, formatSecurityReport } from './security/report.js';
import type { SecurityReport } from './security/report.js';
import {
  generateAuthJwtFiles,
  getAuthEnvVars,
  getAuthDependencies,
  getAuthDevDependencies,
} from './modules/auth-jwt.generator.js';
import { generateSeedFile } from './modules/seed.generator.js';
import {
  generateCacheFiles,
  getCacheDependencies,
  getCacheEnvVars,
} from './modules/cache.generator.js';
import {
  generateQueuesFiles,
  getQueuesDependencies,
  getQueuesEnvVars,
} from './modules/queues.generator.js';
import {
  generateFileStorageFiles,
  getFileStorageDependencies,
  getFileStorageDevDependencies,
  getFileStorageEnvVars,
} from './modules/file-storage.generator.js';
import {
  generateWebsocketsFiles,
  getWebsocketsDependencies,
} from './modules/websockets.generator.js';
import {
  generateSearchFiles,
  getSearchDependencies,
  getSearchEnvVars,
} from './modules/search.generator.js';
import {
  generateAuthOAuthFiles,
  getAuthOAuthDependencies,
  getAuthOAuthDevDependencies,
  getAuthOAuthEnvVars,
} from './modules/auth-oauth.generator.js';
import {
  generateAuthKeycloakFiles,
  getAuthKeycloakDependencies,
  getAuthKeycloakDevDependencies,
  getAuthKeycloakEnvVars,
} from './modules/auth-keycloak.generator.js';
import { generateAdminFiles } from './generators/admin/index.js';

export interface GenerateOptions {
  outputDir: string;
  silent?: boolean;
}

export interface GenerateResult {
  outputDir: string;
  filesCreated: string[];
  securityReport: SecurityReport;
}

/**
 * Generate a complete NestJS project from a GyxerProject schema.
 */
export async function generateProject(
  project: GyxerProject,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { outputDir, silent = false } = options;
  const filesCreated: string[] = [];

  const log = (msg: string) => {
    if (!silent) console.log(msg);
  };

  // Ensure output directory
  await fs.ensureDir(outputDir);

  log(`Generating project "${project.name}" in ${outputDir}...`);

  // ─── Prisma ───────────────────────────────────────────
  const prismaDir = path.join(outputDir, 'prisma');
  await fs.ensureDir(prismaDir);

  const prismaSchema = generatePrismaSchema(project);
  await writeFile(path.join(prismaDir, 'schema.prisma'), prismaSchema, filesCreated);
  log('  + prisma/schema.prisma');

  // ─── src/prisma (PrismaService + PrismaModule) ─────
  const srcPrismaDir = path.join(outputDir, 'src', 'prisma');
  await fs.ensureDir(srcPrismaDir);

  await writeFile(
    path.join(srcPrismaDir, 'prisma.service.ts'),
    generatePrismaService(),
    filesCreated,
  );
  await writeFile(
    path.join(srcPrismaDir, 'prisma.module.ts'),
    generatePrismaModule(),
    filesCreated,
  );
  await writeFile(
    path.join(srcPrismaDir, 'prisma-exception.filter.ts'),
    generatePrismaExceptionFilter(),
    filesCreated,
  );
  log('  + src/prisma/prisma.service.ts');
  log('  + src/prisma/prisma.module.ts');
  log('  + src/prisma/prisma-exception.filter.ts');

  // ─── Entity modules ───────────────────────────────────
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    const entityDir = path.join(outputDir, 'src', kebab);
    const dtoDir = path.join(entityDir, 'dto');
    await fs.ensureDir(dtoDir);

    // DTOs
    await writeFile(
      path.join(dtoDir, `create-${kebab}.dto.ts`),
      generateCreateDto(entity, project),
      filesCreated,
    );
    await writeFile(
      path.join(dtoDir, `update-${kebab}.dto.ts`),
      generateUpdateDto(entity, project),
      filesCreated,
    );

    // Service
    await writeFile(
      path.join(entityDir, `${kebab}.service.ts`),
      generateService(entity, project),
      filesCreated,
    );

    // Controller
    await writeFile(
      path.join(entityDir, `${kebab}.controller.ts`),
      generateController(entity, project),
      filesCreated,
    );

    // Module
    await writeFile(
      path.join(entityDir, `${kebab}.module.ts`),
      generateModule(entity),
      filesCreated,
    );

    // Spec files
    await writeFile(
      path.join(entityDir, `${kebab}.service.spec.ts`),
      generateServiceSpec(entity, project),
      filesCreated,
    );
    await writeFile(
      path.join(entityDir, `${kebab}.controller.spec.ts`),
      generateControllerSpec(entity, project),
      filesCreated,
    );

    log(`  + src/${kebab}/ (module, controller, service, DTOs, specs)`);
  }

  // ─── Auth JWT module ────────────────────────────────────
  const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
  if (hasAuthJwt) {
    const authFiles = generateAuthJwtFiles(project);
    for (const [relativePath, content] of authFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/auth/ (module, controller, service, DTOs, JWT strategy, guards, decorators)');

    // Seed file for test user
    const seedContent = generateSeedFile(project);
    await writeFile(path.join(prismaDir, 'seed.ts'), seedContent, filesCreated);
    log('  + prisma/seed.ts');
  }

  // ─── Auth OAuth module ─────────────────────────────────
  const hasAuthOAuth = project.modules.some((m) => m.name === 'auth-oauth' && m.enabled !== false);
  if (hasAuthOAuth && hasAuthJwt) {
    const oauthFiles = generateAuthOAuthFiles(project);
    for (const [relativePath, content] of oauthFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/auth/strategies/ (OAuth providers + controller)');
  }

  // ─── Auth Keycloak module ──────────────────────────────
  const hasAuthKeycloak = project.modules.some((m) => m.name === 'auth-keycloak' && m.enabled !== false);
  if (hasAuthKeycloak && !hasAuthJwt) {
    const keycloakFiles = generateAuthKeycloakFiles(project);
    for (const [relativePath, content] of keycloakFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/auth/ (Keycloak module, strategy, guard, decorators)');
  }

  // ─── Cache module ──────────────────────────────────────
  const hasCache = project.modules.some((m) => m.name === 'cache' && m.enabled !== false);
  if (hasCache) {
    const cacheFiles = generateCacheFiles(project);
    for (const [relativePath, content] of cacheFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/cache/ (module, service)');
  }

  // ─── Queues module ────────────────────────────────────
  const hasQueues = project.modules.some((m) => m.name === 'queues' && m.enabled !== false);
  if (hasQueues) {
    const queuesFiles = generateQueuesFiles(project);
    for (const [relativePath, content] of queuesFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/queues/ (module, service, processor, DTOs)');
  }

  // ─── File Storage module ──────────────────────────────────
  const hasFileStorage = project.modules.some((m) => m.name === 'file-storage' && m.enabled !== false);
  if (hasFileStorage) {
    const storageFiles = generateFileStorageFiles(project);
    for (const [relativePath, content] of storageFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/storage/ (module, service, controller, DTOs)');
  }

  // ─── WebSockets module ───────────────────────────────────
  const hasWebsockets = project.modules.some((m) => m.name === 'websockets' && m.enabled !== false);
  if (hasWebsockets) {
    const wsFiles = generateWebsocketsFiles(project);
    for (const [relativePath, content] of wsFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/websockets/ (module, gateway, DTOs)');
  }

  // ─── Search module ──────────────────────────────────────
  const hasSearch = project.modules.some((m) => m.name === 'search' && m.enabled !== false);
  if (hasSearch) {
    const searchFiles = generateSearchFiles(project);
    for (const [relativePath, content] of searchFiles) {
      const fullPath = path.join(outputDir, relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log('  + src/search/ (module, service, controller)');
  }

  // ─── App bootstrap ─────────────────────────────────────
  const srcDir = path.join(outputDir, 'src');
  await fs.ensureDir(srcDir);

  await writeFile(path.join(srcDir, 'main.ts'), generateMain(project), filesCreated);
  await writeFile(path.join(srcDir, 'app.module.ts'), generateAppModule(project), filesCreated);
  await writeFile(path.join(srcDir, 'app.controller.ts'), generateAppController(project), filesCreated);
  log('  + src/main.ts');
  log('  + src/app.module.ts');
  log('  + src/app.controller.ts (GET /health)');

  // ─── Project config files ──────────────────────────────
  await writeFile(
    path.join(outputDir, 'package.json'),
    generatePackageJson(project),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, 'tsconfig.json'),
    generateTsConfig(),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, 'tsconfig.build.json'),
    generateTsBuildConfig(),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, 'nest-cli.json'),
    generateNestCliJson(),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, '.gitignore'),
    generateGitignore(),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, '.prettierrc'),
    generatePrettierRc(),
    filesCreated,
  );
  await writeFile(
    path.join(outputDir, 'eslint.config.mjs'),
    generateEslintConfig(),
    filesCreated,
  );
  log('  + package.json, tsconfig.json, nest-cli.json, .gitignore, .prettierrc, eslint.config.mjs');

  // ─── Docker ────────────────────────────────────────────
  if (project.settings.docker) {
    await writeFile(path.join(outputDir, 'Dockerfile'), generateDockerfile(), filesCreated);
    await writeFile(
      path.join(outputDir, 'docker-compose.yml'),
      generateDockerCompose(project),
      filesCreated,
    );
    log('  + Dockerfile, docker-compose.yml');
  }

  // ─── Environment ───────────────────────────────────────
  let envContent = generateEnvFile(project);
  let envExampleContent = generateEnvExample(project);
  if (hasAuthJwt) {
    envContent += getAuthEnvVars();
    envExampleContent += 'JWT_SECRET=your-secret-key\nJWT_EXPIRES_IN=15m\nJWT_REFRESH_SECRET=your-refresh-secret\nJWT_REFRESH_EXPIRES_IN=7d\n';
  }
  if (hasCache) {
    envContent += getCacheEnvVars();
    envExampleContent += 'REDIS_URL=redis://localhost:6379\n';
  }
  if (hasQueues) {
    // Only add Redis env if cache didn't already add it
    if (!hasCache) {
      envContent += getQueuesEnvVars();
      envExampleContent += 'REDIS_HOST=localhost\nREDIS_PORT=6379\n';
    }
  }
  if (hasFileStorage) {
    envContent += getFileStorageEnvVars();
    envExampleContent += 'S3_ENDPOINT=http://localhost:9000\nS3_REGION=us-east-1\nS3_ACCESS_KEY=minioadmin\nS3_SECRET_KEY=minioadmin\nS3_BUCKET=uploads\n';
  }
  if (hasSearch) {
    envContent += getSearchEnvVars();
    envExampleContent += 'MEILISEARCH_HOST=http://localhost:7700\nMEILISEARCH_API_KEY=\n';
  }
  if (hasAuthOAuth && hasAuthJwt) {
    const oauthProviders = ((project.modules.find((m) => m.name === 'auth-oauth')?.options?.providers as string[]) || ['google']) as any;
    envContent += getAuthOAuthEnvVars(oauthProviders);
    envExampleContent += getAuthOAuthEnvVars(oauthProviders);
  }
  if (hasAuthKeycloak && !hasAuthJwt) {
    envContent += getAuthKeycloakEnvVars();
    envExampleContent += 'KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080\nKEYCLOAK_REALM=master\nKEYCLOAK_CLIENT_ID=nestjs-app\n';
  }
  await writeFile(path.join(outputDir, '.env'), envContent, filesCreated);
  await writeFile(path.join(outputDir, '.env.example'), envExampleContent, filesCreated);
  log('  + .env, .env.example');

  // ─── Admin Dashboard ────────────────────────────────────
  const hasAdminDashboard = project.modules.some(
    (m) => m.name === 'admin-dashboard' && m.enabled !== false,
  );
  if (hasAdminDashboard) {
    const adminFiles = generateAdminFiles(project);
    for (const [relativePath, content] of adminFiles) {
      const fullPath = path.join(outputDir, 'admin', relativePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFile(fullPath, content, filesCreated);
    }
    log(`  + admin/ (React admin dashboard — ${adminFiles.size} files)`);
  }

  // ─── Security Report ───────────────────────────────────
  const securityReport = generateSecurityReport(project);
  await writeFile(
    path.join(outputDir, 'security-report.json'),
    JSON.stringify(securityReport, null, 2),
    filesCreated,
  );
  log(formatSecurityReport(securityReport));

  log('');
  log(`Done! ${filesCreated.length} files created.`);
  log('');
  log('Next steps:');
  log(`  cd ${outputDir}`);
  log('  npm install');
  log('  npx prisma migrate dev --name init');
  if (hasAuthJwt) {
    log('  npx prisma db seed');
  }
  log('  npm run start:dev');
  log('');
  log('Docs: https://gyxer513.github.io/gyxer-studio/');

  return { outputDir, filesCreated, securityReport };
}

// ─── Helper generators ──────────────────────────────────────

function generatePackageJson(project: GyxerProject): string {
  const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
  const hasCache = project.modules.some((m) => m.name === 'cache' && m.enabled !== false);
  const hasQueues = project.modules.some((m) => m.name === 'queues' && m.enabled !== false);
  const hasFileStorage = project.modules.some((m) => m.name === 'file-storage' && m.enabled !== false);
  const hasWebsockets = project.modules.some((m) => m.name === 'websockets' && m.enabled !== false);
  const hasSearch = project.modules.some((m) => m.name === 'search' && m.enabled !== false);
  const hasAuthOAuth = project.modules.some((m) => m.name === 'auth-oauth' && m.enabled !== false);
  const hasAuthKeycloak = project.modules.some((m) => m.name === 'auth-keycloak' && m.enabled !== false);

  const pkg = {
    name: project.name,
    version: project.version,
    description: project.description,
    private: true,
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:debug': 'nest start --debug --watch',
      'start:prod': 'node dist/main',
      lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:cov': 'jest --coverage',
    },
    dependencies: {
      '@nestjs/common': '^10.4.0',
      '@nestjs/core': '^10.4.0',
      '@nestjs/platform-express': '^10.4.0',
      '@nestjs/swagger': '^8.0.0',
      '@prisma/client': '^6.0.0',
      'class-transformer': '^0.5.1',
      'class-validator': '^0.14.1',
      helmet: '^8.0.0',
      'reflect-metadata': '^0.2.0',
      rxjs: '^7.8.0',
      ...(project.settings.enableRateLimit
        ? { '@nestjs/throttler': '^6.0.0' }
        : {}),
      ...(hasAuthJwt ? getAuthDependencies() : {}),
      ...(hasCache ? getCacheDependencies() : {}),
      ...(hasQueues ? getQueuesDependencies() : {}),
      ...(hasFileStorage ? getFileStorageDependencies() : {}),
      ...(hasWebsockets ? getWebsocketsDependencies() : {}),
      ...(hasSearch ? getSearchDependencies() : {}),
      ...(hasAuthOAuth && hasAuthJwt ? getAuthOAuthDependencies(
        ((project.modules.find((m) => m.name === 'auth-oauth')?.options?.providers as string[]) || ['google']) as any
      ) : {}),
      ...(hasAuthKeycloak && !hasAuthJwt ? getAuthKeycloakDependencies() : {}),
    },
    devDependencies: {
      '@nestjs/cli': '^10.4.0',
      '@nestjs/testing': '^10.4.0',
      '@types/express': '^5.0.0',
      '@types/jest': '^29.5.0',
      '@types/node': '^22.0.0',
      jest: '^29.7.0',
      prisma: '^6.0.0',
      'ts-jest': '^29.2.0',
      typescript: '^5.7.0',
      '@eslint/js': '^9.17.0',
      eslint: '^9.17.0',
      'typescript-eslint': '^8.18.0',
      prettier: '^3.4.0',
      ...(hasAuthJwt ? { 'ts-node': '^10.9.0', ...getAuthDevDependencies() } : {}),
      ...(hasFileStorage ? getFileStorageDevDependencies() : {}),
      ...(hasAuthOAuth && hasAuthJwt ? getAuthOAuthDevDependencies(
        ((project.modules.find((m) => m.name === 'auth-oauth')?.options?.providers as string[]) || ['google']) as any
      ) : {}),
    },
    jest: {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
      testEnvironment: 'node',
    },
    ...(hasAuthJwt
      ? { prisma: { seed: 'ts-node prisma/seed.ts' } }
      : {}),
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2021',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: true,
        noImplicitAny: true,
        strictBindCallApply: true,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
      },
    },
    null,
    2,
  ) + '\n';
}

function generateTsBuildConfig(): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      exclude: ['node_modules', 'test', 'dist', 'prisma', '**/*spec.ts'],
    },
    null,
    2,
  ) + '\n';
}

function generateGitignore(): string {
  return `node_modules/
dist/
.env
.env.local
*.tsbuildinfo
coverage/
prisma/*.db
prisma/*.db-journal
.DS_Store
`;
}

async function writeFile(filePath: string, content: string, files: string[]): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
  files.push(filePath);
}
