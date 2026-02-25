import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { generateProject } from './project-generator.js';
import type { GyxerProject } from '@gyxer-studio/schema';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gyxer-e2e-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ─── Minimal project (no auth, no docker) ──────────────────────

const minimalProject: GyxerProject = {
  name: 'minimal-api',
  version: '0.1.0',
  description: 'Minimal test project',
  entities: [
    {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'content', type: 'text', required: true, unique: false, index: false },
      ],
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
    enableRateLimit: false,
    docker: false,
  },
};

// ─── Blog project (auth + docker + relations) ──────────────────

const blogProject: GyxerProject = {
  name: 'blog-api',
  version: '0.1.0',
  description: 'Blog platform API',
  entities: [
    {
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true, index: true },
        { name: 'name', type: 'string', required: true, unique: false, index: false },
        { name: 'bio', type: 'text', required: false, unique: false, index: false },
      ],
      relations: [
        { name: 'posts', target: 'Post', type: 'one-to-many', onDelete: 'CASCADE', foreignKey: 'authorId' },
      ],
    },
    {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: true },
        { name: 'content', type: 'text', required: true, unique: false, index: false },
        { name: 'published', type: 'boolean', required: true, unique: false, index: false, default: false },
      ],
      relations: [
        { name: 'comments', target: 'Comment', type: 'one-to-many', onDelete: 'CASCADE', foreignKey: 'postId' },
      ],
    },
    {
      name: 'Comment',
      fields: [
        { name: 'text', type: 'text', required: true, unique: false, index: false },
      ],
      relations: [],
    },
  ],
  modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://postgres:postgres@localhost:5432/blog_api',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: true,
  },
};

// ─── Shop project (enums, 6 entities, no auth) ─────────────────

const shopProject: GyxerProject = {
  name: 'shop-api',
  version: '0.1.0',
  description: 'Mini online shop API',
  entities: [
    {
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true, index: true },
        { name: 'name', type: 'string', required: true, unique: false, index: false },
      ],
      relations: [
        { name: 'orders', target: 'Order', type: 'one-to-many', foreignKey: 'userId', onDelete: 'CASCADE' },
      ],
    },
    {
      name: 'Category',
      fields: [
        { name: 'name', type: 'string', required: true, unique: true, index: true },
      ],
      relations: [
        { name: 'products', target: 'Product', type: 'one-to-many', foreignKey: 'categoryId', onDelete: 'RESTRICT' },
      ],
    },
    {
      name: 'Product',
      fields: [
        { name: 'name', type: 'string', required: true, unique: false, index: true },
        { name: 'price', type: 'float', required: true, unique: false, index: false },
        { name: 'stock', type: 'int', required: true, unique: false, index: false, default: 0 },
      ],
      relations: [],
    },
    {
      name: 'Order',
      fields: [
        {
          name: 'status',
          type: 'enum',
          required: true,
          unique: false,
          index: true,
          default: 'PENDING',
          enumValues: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        },
        { name: 'totalPrice', type: 'float', required: true, unique: false, index: false },
      ],
      relations: [],
    },
  ],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://postgres:postgres@localhost:5432/shop_api',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitTtl: 60,
    rateLimitMax: 100,
    docker: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe('E2E: generateProject', () => {
  describe('minimal project (no auth, no docker)', () => {
    it('should generate all core files', async () => {
      const result = await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      // Core files always present
      expect(result.filesCreated).toContain(path.join(tmpDir, 'prisma', 'schema.prisma'));
      expect(result.filesCreated).toContain(path.join(tmpDir, 'src', 'main.ts'));
      expect(result.filesCreated).toContain(path.join(tmpDir, 'src', 'app.module.ts'));
      expect(result.filesCreated).toContain(path.join(tmpDir, 'package.json'));
      expect(result.filesCreated).toContain(path.join(tmpDir, 'tsconfig.json'));
      expect(result.filesCreated).toContain(path.join(tmpDir, '.gitignore'));
      expect(result.filesCreated).toContain(path.join(tmpDir, '.env'));
      expect(result.filesCreated).toContain(path.join(tmpDir, '.env.example'));
      expect(result.filesCreated).toContain(path.join(tmpDir, 'security-report.json'));
    });

    it('should generate entity module files', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      // Post entity files
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'post.service.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'post.controller.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'post.module.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'dto', 'create-post.dto.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'dto', 'update-post.dto.ts'))).toBe(true);
    });

    it('should generate spec files for each entity', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'post.service.spec.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'post', 'post.controller.spec.ts'))).toBe(true);
    });

    it('should include jest config and test deps in package.json', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      const pkg = JSON.parse(await fs.readFile(path.join(tmpDir, 'package.json'), 'utf-8'));
      expect(pkg.scripts.test).toBe('jest');
      expect(pkg.scripts['test:cov']).toBe('jest --coverage');
      expect(pkg.devDependencies['jest']).toBeDefined();
      expect(pkg.devDependencies['ts-jest']).toBeDefined();
      expect(pkg.devDependencies['@nestjs/testing']).toBeDefined();
      expect(pkg.devDependencies['@types/jest']).toBeDefined();
      expect(pkg.jest).toBeDefined();
      expect(pkg.jest.testRegex).toContain('spec');
    });

    it('should NOT generate Docker files when docker is false', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'Dockerfile'))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, 'docker-compose.yml'))).toBe(false);
    });

    it('should NOT generate auth files when no auth module', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth'))).toBe(false);
    });

    it('should generate Prisma infrastructure', async () => {
      await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'src', 'prisma', 'prisma.service.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'prisma', 'prisma.module.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'prisma', 'prisma-exception.filter.ts'))).toBe(true);
    });

    it('should return correct file count', async () => {
      const result = await generateProject(minimalProject, { outputDir: tmpDir, silent: true });

      // prisma/schema.prisma + src/prisma/{service,module,filter} + entity files (5) +
      // src/{main,app.module} + config files (4) + env files (2) + security-report
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('blog project (auth + docker + relations)', () => {
    it('should generate all entity modules', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      for (const entity of ['user', 'post', 'comment']) {
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.service.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.controller.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.module.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, 'dto', `create-${entity}.dto.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, 'dto', `update-${entity}.dto.ts`))).toBe(true);
      }
    });

    it('should generate auth module files', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'auth.module.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'auth.service.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'auth.controller.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'strategies', 'jwt.strategy.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'guards', 'jwt-auth.guard.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'decorators', 'public.decorator.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth', 'decorators', 'current-user.decorator.ts'))).toBe(true);
    });

    it('should generate Docker files', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'Dockerfile'))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, 'docker-compose.yml'))).toBe(true);
    });

    it('should include auth env vars in .env', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const env = await fs.readFile(path.join(tmpDir, '.env'), 'utf-8');
      expect(env).toContain('JWT_SECRET');
      expect(env).toContain('JWT_REFRESH_SECRET');
    });

    it('should include auth dependencies in package.json', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const pkg = JSON.parse(await fs.readFile(path.join(tmpDir, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['@nestjs/jwt']).toBeDefined();
      expect(pkg.dependencies['@nestjs/passport']).toBeDefined();
      expect(pkg.dependencies['bcrypt']).toBeDefined();
    });

    it('should include rate limit deps in package.json', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const pkg = JSON.parse(await fs.readFile(path.join(tmpDir, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['@nestjs/throttler']).toBeDefined();
    });

    it('should generate valid Prisma schema with relations', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const prisma = await fs.readFile(path.join(tmpDir, 'prisma', 'schema.prisma'), 'utf-8');
      expect(prisma).toContain('model User');
      expect(prisma).toContain('model Post');
      expect(prisma).toContain('model Comment');
      expect(prisma).toContain('posts');
      expect(prisma).toContain('authorId');
      expect(prisma).toContain('passwordHash');
    });

    it('should generate main.ts with all features', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const main = await fs.readFile(path.join(tmpDir, 'src', 'main.ts'), 'utf-8');
      expect(main).toContain('helmet');
      expect(main).toContain('enableCors');
      expect(main).toContain('SwaggerModule');
      expect(main).toContain('ValidationPipe');
      expect(main).toContain('PrismaExceptionFilter');
      expect(main).toContain('addBearerAuth');
    });

    it('should generate app.module.ts with all imports', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const appModule = await fs.readFile(path.join(tmpDir, 'src', 'app.module.ts'), 'utf-8');
      expect(appModule).toContain('PrismaModule');
      expect(appModule).toContain('AuthModule');
      expect(appModule).toContain('UserModule');
      expect(appModule).toContain('PostModule');
      expect(appModule).toContain('CommentModule');
      expect(appModule).toContain('ThrottlerModule');
      expect(appModule).toContain('JwtAuthGuard');
    });

    it('should generate User service with password hashing', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const service = await fs.readFile(path.join(tmpDir, 'src', 'user', 'user.service.ts'), 'utf-8');
      expect(service).toContain('bcrypt');
      expect(service).toContain('hash');
      expect(service).toContain('passwordHash');
    });

    it('should generate CreateUserDto with password field', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const dto = await fs.readFile(path.join(tmpDir, 'src', 'user', 'dto', 'create-user.dto.ts'), 'utf-8');
      expect(dto).toContain('password');
      expect(dto).toContain('IsNotEmpty');
    });

    it('should generate controllers with auth decorators', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const ctrl = await fs.readFile(path.join(tmpDir, 'src', 'post', 'post.controller.ts'), 'utf-8');
      expect(ctrl).toContain('@Public()');
      expect(ctrl).toContain('@ApiBearerAuth()');
    });

    it('should generate spec files for all entities', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      for (const entity of ['user', 'post', 'comment']) {
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.service.spec.ts`))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.controller.spec.ts`))).toBe(true);
      }
    });

    it('should generate User spec with bcrypt mock', async () => {
      await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      const spec = await fs.readFile(path.join(tmpDir, 'src', 'user', 'user.service.spec.ts'), 'utf-8');
      expect(spec).toContain("jest.mock('bcrypt'");
      expect(spec).toContain('passwordHash');
    });

    it('should include security report', async () => {
      const result = await generateProject(blogProject, { outputDir: tmpDir, silent: true });

      expect(result.securityReport).toBeDefined();
      expect(result.securityReport.score).toBeDefined();
      expect(result.securityReport.checks.length).toBeGreaterThan(0);
    });
  });

  describe('shop project (enums, many entities, no auth)', () => {
    it('should generate all 4 entity modules', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      for (const entity of ['user', 'category', 'product', 'order']) {
        expect(await fs.pathExists(path.join(tmpDir, 'src', entity, `${entity}.module.ts`))).toBe(true);
      }
    });

    it('should handle enum fields in DTO', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const dto = await fs.readFile(path.join(tmpDir, 'src', 'order', 'dto', 'create-order.dto.ts'), 'utf-8');
      expect(dto).toContain('PENDING');
      expect(dto).toContain('CANCELLED');
      expect(dto).toContain('@IsIn');
    });

    it('should handle enum fields in Prisma schema', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const prisma = await fs.readFile(path.join(tmpDir, 'prisma', 'schema.prisma'), 'utf-8');
      expect(prisma).toContain('enum OrderStatus');
      expect(prisma).toContain('PENDING');
      expect(prisma).toContain('DELIVERED');
    });

    it('should generate FK fields in DTOs for inverse relations', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      // Product gets categoryId from Category→Product one-to-many
      const productDto = await fs.readFile(
        path.join(tmpDir, 'src', 'product', 'dto', 'create-product.dto.ts'),
        'utf-8',
      );
      expect(productDto).toContain('categoryId');

      // Order gets userId from User→Order one-to-many
      const orderDto = await fs.readFile(
        path.join(tmpDir, 'src', 'order', 'dto', 'create-order.dto.ts'),
        'utf-8',
      );
      expect(orderDto).toContain('userId');
    });

    it('should NOT generate auth files', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      expect(await fs.pathExists(path.join(tmpDir, 'src', 'auth'))).toBe(false);
    });

    it('should generate docker-compose with correct db name', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const compose = await fs.readFile(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
      expect(compose).toContain('shop_api');
    });

    it('should generate Dockerfile with prisma db push', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const dockerfile = await fs.readFile(path.join(tmpDir, 'Dockerfile'), 'utf-8');
      expect(dockerfile).toContain('prisma db push');
    });

    it('should generate valid tsconfig.json', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const tsconfig = JSON.parse(await fs.readFile(path.join(tmpDir, 'tsconfig.json'), 'utf-8'));
      expect(tsconfig.compilerOptions.target).toBe('ES2021');
      expect(tsconfig.compilerOptions.experimentalDecorators).toBe(true);
      expect(tsconfig.compilerOptions.emitDecoratorMetadata).toBe(true);
    });

    it('should generate .gitignore with node_modules and .env', async () => {
      await generateProject(shopProject, { outputDir: tmpDir, silent: true });

      const gitignore = await fs.readFile(path.join(tmpDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('dist/');
    });
  });
});
