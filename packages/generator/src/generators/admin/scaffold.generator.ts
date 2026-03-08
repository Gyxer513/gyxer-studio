import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Generate admin/package.json
 */
export function generateAdminPackageJson(project: GyxerProject): string {
  const pkg = {
    name: `${project.name}-admin`,
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'react-router-dom': '^7.0.0',
      axios: '^1.7.0',
      'react-hook-form': '^7.54.0',
      '@hookform/resolvers': '^3.9.0',
      zod: '^3.23.0',
      clsx: '^2.1.0',
      'tailwind-merge': '^2.6.0',
      'lucide-react': '^0.577.0',
      'date-fns': '^4.1.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.0',
      vite: '^6.0.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
      typescript: '^5.7.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Generate admin/vite.config.ts
 */
export function generateAdminViteConfig(project: GyxerProject): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:${project.settings.port}',
        changeOrigin: true,
      },
    },
  },
});
`;
}

/**
 * Generate admin/tailwind.config.ts
 */
export function generateAdminTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fde3e3',
          200: '#fccaca',
          300: '#f9a3a3',
          400: '#f47272',
          500: '#eb4c47',
          600: '#e53935',
          700: '#c62828',
          800: '#a52222',
          900: '#8b2020',
          950: '#4c0e0e',
        },
      },
    },
  },
  plugins: [],
};
`;
}

/**
 * Generate admin/postcss.config.js
 */
export function generateAdminPostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Generate admin/tsconfig.json
 */
export function generateAdminTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ['src'],
    },
    null,
    2,
  ) + '\n';
}

/**
 * Generate admin/index.html
 */
export function generateAdminIndexHtml(project: GyxerProject): string {
  const title = project.name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Admin</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

/**
 * Generate admin/src/main.tsx
 */
export function generateAdminMainTsx(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
`;
}

/**
 * Generate admin/src/index.css
 */
export function generateAdminIndexCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: 229 57 53;
}
`;
}

/**
 * Generate admin/src/lib/utils.ts
 */
export function generateAdminUtils(): string {
  return `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

/**
 * Generate admin/src/vite-env.d.ts
 */
export function generateAdminViteEnvDts(): string {
  return `/// <reference types="vite/client" />
`;
}
