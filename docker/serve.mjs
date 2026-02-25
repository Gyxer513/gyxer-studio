/**
 * Lightweight static-file + API server for Gyxer Studio editor.
 * Zero npm dependencies — uses only Node.js built-in modules.
 *
 * ENV:
 *   PORT        — HTTP port (default: 4200)
 *   CONFIGS_DIR — directory for saved configs (default: /data/configs)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 4200;
const EDITOR_DIR = path.resolve('editor-dist');
const CONFIGS_DIR = process.env.CONFIGS_DIR || path.resolve('configs');

// ─── MIME types ──────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

// ─── Static file serving (SPA fallback) ──────────────────

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(EDITOR_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(EDITOR_DIR, 'index.html');
    }
  } catch {
    // File not found — SPA fallback to index.html
    filePath = path.join(EDITOR_DIR, 'index.html');
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

// ─── API: POST /api/save-config ──────────────────────────

function handleSaveConfig(req, res) {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const config = JSON.parse(body);
      const name = (config.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `${name}.json`;

      fs.mkdirSync(CONFIGS_DIR, { recursive: true });
      const filePath = path.join(CONFIGS_DIR, fileName);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

      console.log(`  Saved ${fileName} -> ${filePath}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, fileName, filePath }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  });
}

// ─── API: GET /api/configs ───────────────────────────────

function handleListConfigs(_req, res) {
  if (!fs.existsSync(CONFIGS_DIR)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ configs: [] }));
    return;
  }

  const files = fs.readdirSync(CONFIGS_DIR).filter((f) => f.endsWith('.json'));
  const configs = files.map((name) => {
    const stat = fs.statSync(path.join(CONFIGS_DIR, name));
    return { name, updatedAt: stat.mtime.toISOString() };
  });

  configs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ configs }));
}

// ─── HTTP Server ─────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/save-config') {
    return handleSaveConfig(req, res);
  }
  if (req.method === 'GET' && req.url === '/api/configs') {
    return handleListConfigs(req, res);
  }
  serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🎨 Gyxer Studio');
  console.log('  ══════════════════');
  console.log('');
  console.log(`  ▶ Open http://localhost:${PORT}`);
  console.log(`  💾 Configs: ${CONFIGS_DIR}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
