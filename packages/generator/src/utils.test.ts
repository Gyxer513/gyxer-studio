import { describe, it, expect } from 'vitest';
import { toKebabCase, toCamelCase, toSnakeCase, toScreamingSnake, pluralize } from './utils.js';

describe('utils', () => {
  describe('toKebabCase', () => {
    it('converts PascalCase', () => expect(toKebabCase('BlogPost')).toBe('blog-post'));
    it('converts single word', () => expect(toKebabCase('User')).toBe('user'));
    it('converts multi-word', () => expect(toKebabCase('UserProfile')).toBe('user-profile'));
    it('handles acronyms', () => expect(toKebabCase('HTMLParser')).toBe('html-parser'));
  });

  describe('toCamelCase', () => {
    it('converts PascalCase', () => expect(toCamelCase('BlogPost')).toBe('blogPost'));
    it('converts single word', () => expect(toCamelCase('User')).toBe('user'));
  });

  describe('toSnakeCase', () => {
    it('converts PascalCase', () => expect(toSnakeCase('BlogPost')).toBe('blog_post'));
    it('converts single word', () => expect(toSnakeCase('User')).toBe('user'));
  });

  describe('toScreamingSnake', () => {
    it('converts PascalCase', () => expect(toScreamingSnake('BlogPost')).toBe('BLOG_POST'));
  });

  describe('pluralize', () => {
    it('adds s', () => expect(pluralize('post')).toBe('posts'));
    it('handles y → ies', () => expect(pluralize('category')).toBe('categories'));
    it('handles s → ses', () => expect(pluralize('status')).toBe('statuses'));
    it('handles ch → ches', () => expect(pluralize('match')).toBe('matches'));
    it('keeps ey', () => expect(pluralize('key')).toBe('keys'));
  });
});
