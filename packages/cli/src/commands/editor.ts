import http from 'node:http';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import chalk from 'chalk';
import open from 'open';

interface EditorOptions {
  port?: string;
}

/** Directory where configs are saved (cwd/configs/) */
function getConfigsDir(): string {
  return path.resolve(process.cwd(), 'configs');
}

/** Handle POST /api/save-config — save schema JSON to configs/ directory */
function handleSaveConfig(req: http.IncomingMessage, res: http.ServerResponse): void {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const config = JSON.parse(body);
      const name = (config.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `${name}.json`;
      const configsDir = getConfigsDir();

      fs.mkdirSync(configsDir, { recursive: true });

      const filePath = path.join(configsDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

      console.log(`  ${chalk.green('💾')} Saved ${chalk.cyan(fileName)} → ${chalk.dim(filePath)}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, fileName, filePath }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  });
}

/** Handle GET /api/configs — list saved configs */
function handleListConfigs(_req: http.IncomingMessage, res: http.ServerResponse): void {
  const configsDir = getConfigsDir();

  if (!fs.existsSync(configsDir)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ configs: [] }));
    return;
  }

  const files = fs.readdirSync(configsDir).filter((f) => f.endsWith('.json'));
  const configs = files.map((name) => {
    const stat = fs.statSync(path.join(configsDir, name));
    return { name, updatedAt: stat.mtime.toISOString() };
  });

  configs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ configs }));
}

export async function editorCommand(options: EditorOptions) {
  const port = Number(options.port) || 4200;

  // Resolve editor-dist relative to this compiled file
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const editorDir = path.join(__dirname, '..', 'editor-dist');

  if (!fs.existsSync(editorDir)) {
    console.error(chalk.red('  ✖ Editor files not found.'));
    console.error(chalk.dim(`    Expected at: ${editorDir}`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold('  🎨 Gyxer Studio'));
  console.log(chalk.dim('  ══════════════════'));
  console.log('');

  const serve = sirv(editorDir, { single: true });

  const server = http.createServer((req, res) => {
    // API routes — handle before static files
    if (req.method === 'POST' && req.url === '/api/save-config') {
      return handleSaveConfig(req, res);
    }
    if (req.method === 'GET' && req.url === '/api/configs') {
      return handleListConfigs(req, res);
    }

    // Static files — editor SPA
    serve(req, res);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`  ${chalk.green('▶')} Running at ${chalk.cyan.underline(url)}`);
    console.log(`  ${chalk.dim('💾 Configs save to:')} ${chalk.cyan(getConfigsDir())}`);
    console.log('');
    console.log(chalk.dim('  Press Ctrl+C to stop'));
    console.log('');
    open(url);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(chalk.red(`  ✖ Port ${port} is already in use.`));
      console.error(chalk.dim(`    Try: gyxer editor --port ${port + 1}`));
      process.exit(1);
    }
    throw err;
  });
}
