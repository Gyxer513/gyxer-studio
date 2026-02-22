import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

/** Vite plugin: saves/lists configs in the project root `configs/` directory. */
function gyxerConfigApi(): Plugin {
  const configsDir = path.resolve(__dirname, '../../configs');

  return {
    name: 'gyxer-config-api',
    configureServer(server) {
      // POST /api/save-config — save a config JSON to configs/
      server.middlewares.use('/api/save-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const config = JSON.parse(body);
            const name = config.name || 'project';
            const fileName = `${name}.json`;
            const filePath = path.join(configsDir, fileName);

            // Ensure configs/ directory exists
            if (!fs.existsSync(configsDir)) {
              fs.mkdirSync(configsDir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              fileName,
              filePath,
            }));
          } catch (err: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // GET /api/configs — list all saved configs
      server.middlewares.use('/api/configs', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          if (!fs.existsSync(configsDir)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ configs: [] }));
            return;
          }

          const files = fs.readdirSync(configsDir)
            .filter((f) => f.endsWith('.json'))
            .map((f) => {
              const stat = fs.statSync(path.join(configsDir, f));
              return { name: f, updatedAt: stat.mtime.toISOString() };
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ configs: files }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), gyxerConfigApi()],
  resolve: {
    alias: {
      '@gyxer/schema': path.resolve(__dirname, '../schema/src'),
      '@gyxer/generator': path.resolve(__dirname, '../generator/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
