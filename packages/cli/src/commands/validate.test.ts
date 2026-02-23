import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateCommand } from './validate.js';

// Paths to example configs
const examplesDir = path.resolve(__dirname, '../../../../examples');
const blogJsonPath = path.join(examplesDir, 'blog.json');
const blogAuthJsonPath = path.join(examplesDir, 'blog-with-auth.json');

// Temp file helpers
const tmpDir = path.resolve(__dirname, '../../../../.tmp-test');
function writeTmpFile(name: string, content: string): string {
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('validate command', () => {
  let logOutput: string[];
  let errorOutput: string[];
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logOutput.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errorOutput.push(args.map(String).join(' '));
    });
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should validate a correct schema (blog.json)', async () => {
    await validateCommand(blogJsonPath);

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('Schema is valid!');
    expect(allOutput).toContain('3');      // 3 entities
    expect(allOutput).toContain('blog-api');
    expect(allOutput).toContain('postgresql');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should show modules when present (blog-with-auth.json)', async () => {
    await validateCommand(blogAuthJsonPath);

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('Schema is valid!');
    expect(allOutput).toContain('auth-jwt');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should fail when file does not exist', async () => {
    await expect(validateCommand('/nonexistent/path.json')).rejects.toThrow('process.exit');

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('File not found');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should fail on invalid JSON', async () => {
    const filePath = writeTmpFile('bad.json', 'not json {{{');

    await expect(validateCommand(filePath)).rejects.toThrow('process.exit');

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('Validation failed');
    expect(allOutput).toContain('Invalid JSON');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should fail on schema with empty entities', async () => {
    const filePath = writeTmpFile('empty.json', JSON.stringify({
      name: 'empty-app',
      entities: [],
    }));

    await expect(validateCommand(filePath)).rejects.toThrow('process.exit');

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('Validation failed');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should fail on relation targeting unknown entity', async () => {
    const filePath = writeTmpFile('bad-relation.json', JSON.stringify({
      name: 'test-app',
      entities: [
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string', required: true }],
          relations: [
            { name: 'author', type: 'one-to-many', target: 'Ghost', foreignKey: 'ghostId' },
          ],
        },
      ],
    }));

    await expect(validateCommand(filePath)).rejects.toThrow('process.exit');

    const allOutput = [...logOutput, ...errorOutput].join('\n');
    expect(allOutput).toContain('Validation failed');
    expect(allOutput).toContain('unknown entity');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
