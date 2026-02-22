import * as fs from 'fs-extra';
import * as path from 'path';
import type { GyxerProject } from '@gyxer/schema';
import { toKebabCase } from './utils.js';
import { generatePrismaSchema } from './generators/prisma.generator.js';
import { generateCreateDto, generateUpdateDto } from './generators/dto.generator.js';
import { generateService } from './generators/service.generator.js';
import { generateController } from './generators/controller.generator.js';
import { generateModule } from './generators/module.generator.js';
import {
  generateMain,
  generateAppModule,
  generatePrismaService,
  generatePrismaModule,
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
  log('  + src/prisma/prisma.service.ts');
  log('  + src/prisma/prisma.module.ts');

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
      generateService(entity),
      filesCreated,
    );

    // Controller
    await writeFile(
      path.join(entityDir, `${kebab}.controller.ts`),
      generateController(entity),
      filesCreated,
    );

    // Module
    await writeFile(
      path.join(entityDir, `${kebab}.module.ts`),
      generateModule(entity),
      filesCreated,
    );

    log(`  + src/${kebab}/ (module, controller, service, DTOs)`);
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
  }

  // ─── App bootstrap ─────────────────────────────────────
  const srcDir = path.join(outputDir, 'src');
  await fs.ensureDir(srcDir);

  await writeFile(path.join(srcDir, 'main.ts'), generateMain(project), filesCreated);
  await writeFile(path.join(srcDir, 'app.module.ts'), generateAppModule(project), filesCreated);
  log('  + src/main.ts');
  log('  + src/app.module.ts');

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
    path.join(outputDir, '.gitignore'),
    generateGitignore(),
    filesCreated,
  );
  log('  + package.json, tsconfig.json, .gitignore');

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
  await writeFile(path.join(outputDir, '.env'), envContent, filesCreated);
  await writeFile(path.join(outputDir, '.env.example'), envExampleContent, filesCreated);
  log('  + .env, .env.example');

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
  log('  npm run start:dev');

  return { outputDir, filesCreated, securityReport };
}

// ─── Helper generators ──────────────────────────────────────

function generatePackageJson(project: GyxerProject): string {
  const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);

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
    },
    devDependencies: {
      '@nestjs/cli': '^10.4.0',
      '@types/node': '^22.0.0',
      prisma: '^6.0.0',
      typescript: '^5.7.0',
      prettier: '^3.4.0',
      ...(hasAuthJwt ? getAuthDevDependencies() : {}),
    },
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
      exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
    },
    null,
    2,
  ) + '\n';
}

function generateGitignore(): string {
  return `node_modules/
dist/
.env
*.tsbuildinfo
coverage/
.DS_Store
`;
}

async function writeFile(filePath: string, content: string, files: string[]): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
  files.push(filePath);
}
