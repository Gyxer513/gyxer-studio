import { describe, it, expect } from 'vitest';
import { validateProject, parseProjectJson } from './validators.js';
import * as fs from 'fs';
import * as path from 'path';

// Load the example blog.json
const blogJsonPath = path.resolve(__dirname, '../../../examples/blog.json');
const blogJson = fs.readFileSync(blogJsonPath, 'utf-8');
const blogData = JSON.parse(blogJson);

describe('@gyxer/schema validators', () => {
  describe('validateProject', () => {
    it('should validate a correct project', () => {
      const result = validateProject(blogData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('my-blog');
      expect(result.data!.entities).toHaveLength(3);
    });

    it('should apply default settings', () => {
      const result = validateProject({
        name: 'minimal',
        entities: [
          {
            name: 'Item',
            fields: [{ name: 'title', type: 'string' }],
          },
        ],
      });
      expect(result.success).toBe(true);
      expect(result.data!.settings.port).toBe(3000);
      expect(result.data!.settings.enableSwagger).toBe(true);
      expect(result.data!.settings.enableHelmet).toBe(true);
      expect(result.data!.settings.docker).toBe(true);
      expect(result.data!.modules).toEqual([]);
      expect(result.data!.version).toBe('0.1.0');
    });

    it('should reject project without name', () => {
      const result = validateProject({ entities: [{ name: 'A', fields: [{ name: 'x', type: 'string' }] }] });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject project without entities', () => {
      const result = validateProject({ name: 'empty' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid project name (not kebab-case)', () => {
      const result = validateProject({
        name: 'MyApp',
        entities: [{ name: 'Item', fields: [{ name: 'x', type: 'string' }] }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid entity name (not PascalCase)', () => {
      const result = validateProject({
        name: 'test',
        entities: [{ name: 'item', fields: [{ name: 'x', type: 'string' }] }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject entity with no fields', () => {
      const result = validateProject({
        name: 'test',
        entities: [{ name: 'Empty', fields: [] }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject duplicate entity names', () => {
      const result = validateProject({
        name: 'test',
        entities: [
          { name: 'User', fields: [{ name: 'name', type: 'string' }] },
          { name: 'User', fields: [{ name: 'email', type: 'string' }] },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.message.includes('Duplicate entity'))).toBe(true);
    });

    it('should reject duplicate field names within entity', () => {
      const result = validateProject({
        name: 'test',
        entities: [
          {
            name: 'User',
            fields: [
              { name: 'name', type: 'string' },
              { name: 'name', type: 'int' },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.message.includes('Duplicate field'))).toBe(true);
    });

    it('should reject enum field without enumValues', () => {
      const result = validateProject({
        name: 'test',
        entities: [
          {
            name: 'Item',
            fields: [{ name: 'status', type: 'enum', required: true }],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.message.includes('enumValues'))).toBe(true);
    });

    it('should reject relation targeting unknown entity', () => {
      const result = validateProject({
        name: 'test',
        entities: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            relations: [
              { name: 'author', type: 'one-to-many', target: 'Ghost' },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.message.includes('unknown entity'))).toBe(true);
    });

    it('should validate project with auth-jwt module', () => {
      const result = validateProject({
        name: 'auth-app',
        entities: [
          { name: 'User', fields: [{ name: 'email', type: 'string', unique: true }] },
        ],
        modules: [{ name: 'auth-jwt', enabled: true }],
      });
      expect(result.success).toBe(true);
      expect(result.data!.modules).toHaveLength(1);
      expect(result.data!.modules[0].name).toBe('auth-jwt');
    });
  });

  describe('parseProjectJson', () => {
    it('should parse valid JSON string', () => {
      const result = parseProjectJson(blogJson);
      expect(result.success).toBe(true);
      expect(result.data!.name).toBe('my-blog');
    });

    it('should reject invalid JSON', () => {
      const result = parseProjectJson('not json at all');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toBe('Invalid JSON');
    });

    it('should reject valid JSON but invalid schema', () => {
      const result = parseProjectJson('{"foo": "bar"}');
      expect(result.success).toBe(false);
    });
  });
});
