import { describe, it, expect } from 'vitest';
import { generateAdminFiles } from './index.js';
import type { GyxerProject } from '@gyxer-studio/schema';

function createProject(overrides: Partial<GyxerProject> = {}): GyxerProject {
  return {
    name: 'test-app',
    version: '0.1.0',
    description: 'Test project',
    entities: [
      {
        name: 'Post',
        fields: [
          { name: 'title', type: 'string', required: true, unique: false, index: false },
          { name: 'content', type: 'text', required: false, unique: false, index: false },
          { name: 'published', type: 'boolean', required: true, unique: false, index: false },
        ],
        relations: [],
      },
      {
        name: 'Category',
        fields: [
          { name: 'name', type: 'string', required: true, unique: true, index: false },
        ],
        relations: [],
      },
    ],
    modules: [],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/app',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: 'postgres',
      dbPassword: 'postgres',
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: true,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: true,
    },
    ...overrides,
  };
}

describe('admin dashboard generator', () => {
  it('should generate all scaffold files', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('package.json')).toBe(true);
    expect(files.has('vite.config.ts')).toBe(true);
    expect(files.has('tailwind.config.ts')).toBe(true);
    expect(files.has('postcss.config.js')).toBe(true);
    expect(files.has('tsconfig.json')).toBe(true);
    expect(files.has('index.html')).toBe(true);
    expect(files.has('src/main.tsx')).toBe(true);
    expect(files.has('src/index.css')).toBe(true);
    expect(files.has('src/lib/utils.ts')).toBe(true);
    expect(files.has('src/vite-env.d.ts')).toBe(true);
  });

  it('should generate UI component files', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    const uiComponents = [
      'button', 'input', 'label', 'textarea', 'select',
      'switch', 'badge', 'card', 'table', 'dialog',
    ];
    for (const comp of uiComponents) {
      expect(files.has(`src/components/ui/${comp}.tsx`)).toBe(true);
    }
  });

  it('should generate layout components', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('src/components/layout/sidebar.tsx')).toBe(true);
    expect(files.has('src/components/layout/header.tsx')).toBe(true);
    expect(files.has('src/components/layout/root-layout.tsx')).toBe(true);
  });

  it('should generate entity pages for each entity', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    // Post pages
    expect(files.has('src/pages/posts/list.tsx')).toBe(true);
    expect(files.has('src/pages/posts/create.tsx')).toBe(true);
    expect(files.has('src/pages/posts/edit.tsx')).toBe(true);

    // Category pages
    expect(files.has('src/pages/categorys/list.tsx')).toBe(true);
    expect(files.has('src/pages/categorys/create.tsx')).toBe(true);
    expect(files.has('src/pages/categorys/edit.tsx')).toBe(true);
  });

  it('should generate entity services for each entity', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('src/services/post.service.ts')).toBe(true);
    expect(files.has('src/services/category.service.ts')).toBe(true);
  });

  it('should generate dashboard page', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('src/pages/dashboard.tsx')).toBe(true);
    const dashboard = files.get('src/pages/dashboard.tsx')!;
    expect(dashboard).toContain('DashboardPage');
    expect(dashboard).toContain('postService');
    expect(dashboard).toContain('categoryService');
  });

  it('should generate App.tsx with routes', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('src/App.tsx')).toBe(true);
    const app = files.get('src/App.tsx')!;
    expect(app).toContain('DashboardPage');
    expect(app).toContain('PostsListPage');
    expect(app).toContain('CategoriesListPage');
    expect(app).toContain('/posts');
    expect(app).toContain('/categorys');
  });

  it('should NOT generate auth files when auth-jwt is not enabled', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    expect(files.has('src/lib/auth.tsx')).toBe(false);
    expect(files.has('src/pages/login.tsx')).toBe(false);
    expect(files.has('src/components/shared/protected-route.tsx')).toBe(false);

    const app = files.get('src/App.tsx')!;
    expect(app).not.toContain('AuthProvider');
    expect(app).not.toContain('ProtectedRoute');
    expect(app).not.toContain('LoginPage');
  });

  it('should generate auth files when auth-jwt is enabled', () => {
    const project = createProject({
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    });
    const files = generateAdminFiles(project);

    expect(files.has('src/lib/auth.tsx')).toBe(true);
    expect(files.has('src/pages/login.tsx')).toBe(true);
    expect(files.has('src/components/shared/protected-route.tsx')).toBe(true);

    const app = files.get('src/App.tsx')!;
    expect(app).toContain('AuthProvider');
    expect(app).toContain('ProtectedRoute');
    expect(app).toContain('LoginPage');
    expect(app).toContain('/login');
  });

  it('should include auth interceptor in api.ts when auth-jwt is enabled', () => {
    const project = createProject({
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    });
    const files = generateAdminFiles(project);

    const api = files.get('src/lib/api.ts')!;
    expect(api).toContain('interceptors.request');
    expect(api).toContain('Authorization');
    expect(api).toContain('access_token');
  });

  it('should NOT include auth interceptor when no auth module', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    const api = files.get('src/lib/api.ts')!;
    expect(api).not.toContain('interceptors.request');
  });

  it('should proxy API requests to the correct port', () => {
    const project = createProject({
      settings: {
        port: 4000,
        database: 'postgresql',
        databaseUrl: 'postgresql://postgres:postgres@localhost:5432/app',
        dbHost: 'localhost',
        dbPort: 5432,
        dbUser: 'postgres',
        dbPassword: 'postgres',
        enableSwagger: true,
        enableCors: true,
        enableHelmet: true,
        enableRateLimit: true,
        rateLimitTtl: 60,
        rateLimitMax: 100,
        docker: true,
      },
    });
    const files = generateAdminFiles(project);
    const viteConfig = files.get('vite.config.ts')!;
    expect(viteConfig).toContain('http://localhost:4000');
    expect(viteConfig).toContain('rewrite');
    expect(viteConfig).toContain("path.replace(/^\\/api/, '')");
  });

  it('should generate correct package.json with project name', () => {
    const project = createProject();
    const files = generateAdminFiles(project);
    const pkg = JSON.parse(files.get('package.json')!);
    expect(pkg.name).toBe('test-app-admin');
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-router-dom']).toBeDefined();
    expect(pkg.dependencies.axios).toBeDefined();
  });

  it('should include header with logout when auth is enabled', () => {
    const project = createProject({
      modules: [{ name: 'auth-jwt', enabled: true, options: {} }],
    });
    const files = generateAdminFiles(project);
    const header = files.get('src/components/layout/header.tsx')!;
    expect(header).toContain('useAuth');
    expect(header).toContain('logout');
    expect(header).toContain('LogOut');
  });

  it('should generate correct field types in forms', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    const createPage = files.get('src/pages/posts/create.tsx')!;
    // title: string → Input
    expect(createPage).toContain("register('title')");
    // content: text → Textarea
    expect(createPage).toContain('Textarea');
    // published: boolean → Switch
    expect(createPage).toContain('Switch');
  });

  it('should generate sidebar with entity links', () => {
    const project = createProject();
    const files = generateAdminFiles(project);
    const sidebar = files.get('src/components/layout/sidebar.tsx')!;
    expect(sidebar).toContain('/posts');
    expect(sidebar).toContain('Posts');
    expect(sidebar).toContain('/categorys');
    expect(sidebar).toContain('Categories');
    expect(sidebar).toContain('Dashboard');
  });

  it('should generate total correct number of files', () => {
    const project = createProject();
    const files = generateAdminFiles(project);

    // Scaffold: 10, UI: 10, Layout: 3, Services: 3 (api + 2 entities),
    // Pages: 7 (dashboard + 2*3 entity pages), App.tsx: 1
    // Total: 34
    expect(files.size).toBe(34);
  });

  it('should generate more files with auth enabled', () => {
    const noAuth = generateAdminFiles(createProject());
    const withAuth = generateAdminFiles(
      createProject({ modules: [{ name: 'auth-jwt', enabled: true, options: {} }] }),
    );
    // Auth adds: auth.tsx, login.tsx, protected-route.tsx = 3 extra files
    expect(withAuth.size).toBe(noAuth.size + 3);
  });
});
