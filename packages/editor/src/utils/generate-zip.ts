import JSZip from 'jszip';
import type { GyxerProject } from '@gyxer/schema';

// Import pure generators (no Node.js deps) via Vite alias
import { generatePrismaSchema } from '@gyxer/generator/generators/prisma.generator';
import { generateCreateDto, generateUpdateDto } from '@gyxer/generator/generators/dto.generator';
import { generateService } from '@gyxer/generator/generators/service.generator';
import { generateController } from '@gyxer/generator/generators/controller.generator';
import { generateModule } from '@gyxer/generator/generators/module.generator';
import {
  generateMain,
  generateAppModule,
  generatePrismaService,
  generatePrismaModule,
} from '@gyxer/generator/generators/app.generator';
import {
  generateDockerfile,
  generateDockerCompose,
  generateEnvFile,
  generateEnvExample,
} from '@gyxer/generator/generators/docker.generator';
import {
  generateAuthJwtFiles,
  getAuthEnvVars,
  getAuthDependencies,
  getAuthDevDependencies,
} from '@gyxer/generator/modules/auth-jwt.generator';
import { generateSecurityReport } from '@gyxer/generator/security/report';
import { toKebabCase } from '@gyxer/generator/utils';

// ─── Collect all project files into a Map<path, content> ───────

function collectProjectFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);

  // Prisma
  files.set('prisma/schema.prisma', generatePrismaSchema(project));

  // src/prisma
  files.set('src/prisma/prisma.service.ts', generatePrismaService());
  files.set('src/prisma/prisma.module.ts', generatePrismaModule());

  // Entity modules
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    files.set(`src/${kebab}/dto/create-${kebab}.dto.ts`, generateCreateDto(entity));
    files.set(`src/${kebab}/dto/update-${kebab}.dto.ts`, generateUpdateDto(entity));
    files.set(`src/${kebab}/${kebab}.service.ts`, generateService(entity));
    files.set(`src/${kebab}/${kebab}.controller.ts`, generateController(entity));
    files.set(`src/${kebab}/${kebab}.module.ts`, generateModule(entity));
  }

  // Auth JWT module
  if (hasAuthJwt) {
    const authFiles = generateAuthJwtFiles(project);
    for (const [relativePath, content] of authFiles) {
      files.set(relativePath, content);
    }
  }

  // App bootstrap
  files.set('src/main.ts', generateMain(project));
  files.set('src/app.module.ts', generateAppModule(project));

  // Project config
  files.set('package.json', generatePackageJson(project));
  files.set('tsconfig.json', generateTsConfig());
  files.set('tsconfig.build.json', generateTsBuildConfig());
  files.set('.gitignore', generateGitignore());
  files.set('nest-cli.json', generateNestCli());

  // Docker
  if (project.settings.docker) {
    files.set('Dockerfile', generateDockerfile());
    files.set('docker-compose.yml', generateDockerCompose(project));
  }

  // Environment
  let envContent = generateEnvFile(project);
  let envExampleContent = generateEnvExample(project);
  if (hasAuthJwt) {
    envContent += getAuthEnvVars();
    envExampleContent +=
      'JWT_SECRET=your-secret-key\nJWT_EXPIRES_IN=15m\nJWT_REFRESH_SECRET=your-refresh-secret\nJWT_REFRESH_EXPIRES_IN=7d\n';
  }
  files.set('.env', envContent);
  files.set('.env.example', envExampleContent);

  // Security Report
  const securityReport = generateSecurityReport(project);
  files.set('security-report.json', JSON.stringify(securityReport, null, 2));

  // README
  files.set('README.md', generateReadme(project, securityReport));

  return files;
}

// ─── Output: ZIP download ──────────────────────────────────────

export async function generateProjectZip(project: GyxerProject): Promise<Blob> {
  const files = collectProjectFiles(project);
  const zip = new JSZip();
  const root = project.name;

  for (const [path, content] of files) {
    zip.file(`${root}/${path}`, content);
  }

  return zip.generateAsync({ type: 'blob' });
}

// ─── Output: Write to directory (File System Access API) ───────

/**
 * Check if the browser supports the File System Access API.
 */
export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Helper to get or create a nested subdirectory from a FileSystemDirectoryHandle.
 * e.g. ensureSubDir(root, "src/user/dto") creates src → user → dto.
 */
async function ensureSubDir(
  root: FileSystemDirectoryHandle,
  dirPath: string,
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  const parts = dirPath.split('/').filter(Boolean);
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

/**
 * Generate a project and write it to a user-selected directory.
 * Returns the number of files written.
 */
export async function generateProjectToDirectory(
  project: GyxerProject,
): Promise<{ filesWritten: number; dirName: string }> {
  // Show native folder picker
  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

  // Create project subdirectory
  const projectDir = await dirHandle.getDirectoryHandle(project.name, { create: true });

  const files = collectProjectFiles(project);
  let filesWritten = 0;

  for (const [filePath, content] of files) {
    // Split into directory parts and filename
    const parts = filePath.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    // Ensure parent directory exists
    const parentDir = dirPath ? await ensureSubDir(projectDir, dirPath) : projectDir;

    // Write the file
    const fileHandle = await parentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    filesWritten++;
  }

  return { filesWritten, dirName: project.name };
}

// ─── Helper generators (browser-compatible) ────────────────────

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
      ...(project.settings.enableRateLimit ? { '@nestjs/throttler': '^6.0.0' } : {}),
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
  return (
    JSON.stringify(
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
    ) + '\n'
  );
}

function generateTsBuildConfig(): string {
  return (
    JSON.stringify(
      {
        extends: './tsconfig.json',
        exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
      },
      null,
      2,
    ) + '\n'
  );
}

function generateNestCli(): string {
  return (
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/nest-cli',
        collection: '@nestjs/schematics',
        sourceRoot: 'src',
        compilerOptions: { deleteOutDir: true },
      },
      null,
      2,
    ) + '\n'
  );
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

function generateReadme(
  project: GyxerProject,
  securityReport: { score: number; passed: number; failed: number },
): string {
  const lines = [
    `# ${project.name}`,
    '',
    project.description || 'Generated by Gyxer Studio',
    '',
    `> Security Score: ${securityReport.score}% (${securityReport.passed} passed, ${securityReport.failed} failed)`,
    '',
    '## Quick Start',
    '',
    '```bash',
    'npm install',
    'npx prisma migrate dev --name init',
    'npm run start:dev',
    '```',
    '',
  ];

  if (project.settings.docker) {
    lines.push('## Docker', '', '```bash', 'docker-compose up -d', '```', '');
  }

  if (project.settings.enableSwagger) {
    lines.push(
      '## API Docs',
      '',
      `Swagger UI available at \`http://localhost:${project.settings.port}/api\``,
      '',
    );
  }

  lines.push(
    '## Entities',
    '',
    ...project.entities.map(
      (e) => `- **${e.name}** — ${e.fields.length} fields`,
    ),
    '',
    '---',
    '',
    'Generated with [Gyxer Studio](https://gyxer.com)',
  );

  return lines.join('\n');
}
