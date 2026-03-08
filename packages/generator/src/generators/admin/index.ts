import type { GyxerProject } from '@gyxer-studio/schema';
import { toKebabCase, toCamelCase, pluralize } from '../../utils.js';
import {
  generateAdminPackageJson,
  generateAdminViteConfig,
  generateAdminTailwindConfig,
  generateAdminPostcssConfig,
  generateAdminTsConfig,
  generateAdminIndexHtml,
  generateAdminMainTsx,
  generateAdminIndexCss,
  generateAdminUtils,
  generateAdminViteEnvDts,
} from './scaffold.generator.js';
import { generateComponentFiles } from './components.generator.js';
import { generateServiceFiles } from './services.generator.js';
import { generatePageFiles } from './pages.generator.js';
import { generateAuthFiles } from './auth.generator.js';

// ─── Layout Components ─────────────────────────────────────

function generateSidebar(project: GyxerProject): string {
  const links = project.entities
    .map((e) => {
      const kebab = toKebabCase(e.name);
      const plural = pluralize(e.name);
      return `        <NavLink
          to="/${kebab}s"
          className={({ isActive }) =>
            cn('flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100')
          }
        >
          <Database className="w-4 h-4" />
          ${plural}
        </NavLink>`;
    })
    .join('\n');

  return `import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-gray-200 bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">${project.name}</h1>
        <p className="text-xs text-gray-500">Admin Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn('flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100')
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

${links}
      </nav>
    </aside>
  );
}
`;
}

function generateHeader(hasAuth: boolean): string {
  if (hasAuth) {
    return `import { LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6 gap-3">
      {user && (
        <span className="text-sm text-gray-600">{user.email}</span>
      )}
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="w-4 h-4 mr-1" /> Logout
      </Button>
    </header>
  );
}
`;
  }

  return `export function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6">
      <span className="text-sm text-gray-500">Admin Panel</span>
    </header>
  );
}
`;
}

function generateRootLayout(): string {
  return `import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function RootLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`;
}

// ─── App.tsx ─────────────────────────────────────────────────

function generateAppTsx(project: GyxerProject, hasAuth: boolean): string {
  const lines: string[] = [];

  lines.push(`import { Routes, Route } from 'react-router-dom';`);
  lines.push(`import { RootLayout } from './components/layout/root-layout';`);
  lines.push(`import { DashboardPage } from './pages/dashboard';`);

  // Import entity pages
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    const plural = pluralize(entity.name);
    lines.push(`import { ${plural}ListPage } from './pages/${kebab}s/list';`);
    lines.push(`import { ${plural}CreatePage } from './pages/${kebab}s/create';`);
    lines.push(`import { ${plural}EditPage } from './pages/${kebab}s/edit';`);
  }

  if (hasAuth) {
    lines.push(`import { AuthProvider } from './lib/auth';`);
    lines.push(`import { ProtectedRoute } from './components/shared/protected-route';`);
    lines.push(`import { LoginPage } from './pages/login';`);
  }

  lines.push('');
  lines.push('export function App() {');
  lines.push('  return (');

  if (hasAuth) {
    lines.push('    <AuthProvider>');
    lines.push('      <Routes>');
    lines.push('        <Route path="/login" element={<LoginPage />} />');
    lines.push('        <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>');
    lines.push('          <Route index element={<DashboardPage />} />');
  } else {
    lines.push('    <Routes>');
    lines.push('      <Route element={<RootLayout />}>');
    lines.push('        <Route index element={<DashboardPage />} />');
  }

  const indent = hasAuth ? '          ' : '        ';
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    const plural = pluralize(entity.name);
    lines.push(`${indent}<Route path="/${kebab}s" element={<${plural}ListPage />} />`);
    lines.push(`${indent}<Route path="/${kebab}s/create" element={<${plural}CreatePage />} />`);
    lines.push(`${indent}<Route path="/${kebab}s/:id/edit" element={<${plural}EditPage />} />`);
  }

  if (hasAuth) {
    lines.push('        </Route>');
    lines.push('      </Routes>');
    lines.push('    </AuthProvider>');
  } else {
    lines.push('      </Route>');
    lines.push('    </Routes>');
  }

  lines.push('  );');
  lines.push('}');

  return lines.join('\n') + '\n';
}

// ─── Main entry point ─────────────────────────────────────

/**
 * Generate all admin dashboard files as a Map<relativePath, content>.
 * relativePath is relative to the admin/ directory in the generated project.
 */
export function generateAdminFiles(project: GyxerProject): Map<string, string> {
  const hasAuth = project.modules?.some(
    (m) => m.name === 'auth-jwt' && m.enabled !== false,
  ) ?? false;

  const files = new Map<string, string>();

  // ─── Scaffold ───────────────────────────────────
  files.set('package.json', generateAdminPackageJson(project));
  files.set('vite.config.ts', generateAdminViteConfig(project));
  files.set('tailwind.config.ts', generateAdminTailwindConfig());
  files.set('postcss.config.js', generateAdminPostcssConfig());
  files.set('tsconfig.json', generateAdminTsConfig());
  files.set('index.html', generateAdminIndexHtml(project));
  files.set('src/main.tsx', generateAdminMainTsx());
  files.set('src/index.css', generateAdminIndexCss());
  files.set('src/lib/utils.ts', generateAdminUtils());
  files.set('src/vite-env.d.ts', generateAdminViteEnvDts());

  // ─── UI Components ─────────────────────────────
  for (const [path, content] of generateComponentFiles()) {
    files.set(path, content);
  }

  // ─── Layout ─────────────────────────────────────
  files.set('src/components/layout/sidebar.tsx', generateSidebar(project));
  files.set('src/components/layout/header.tsx', generateHeader(hasAuth));
  files.set('src/components/layout/root-layout.tsx', generateRootLayout());

  // ─── Services ───────────────────────────────────
  for (const [path, content] of generateServiceFiles(project)) {
    files.set(path, content);
  }

  // ─── Pages ──────────────────────────────────────
  for (const [path, content] of generatePageFiles(project)) {
    files.set(path, content);
  }

  // ─── Auth (only if auth-jwt enabled) ────────────
  if (hasAuth) {
    for (const [path, content] of generateAuthFiles()) {
      files.set(path, content);
    }
  }

  // ─── App.tsx ────────────────────────────────────
  files.set('src/App.tsx', generateAppTsx(project, hasAuth));

  return files;
}
