/**
 * Utility functions for code generation.
 */

/** Convert PascalCase to kebab-case: "BlogPost" → "blog-post" */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** Convert PascalCase to camelCase: "BlogPost" → "blogPost" */
export function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/** Convert PascalCase to SCREAMING_SNAKE: "BlogPost" → "BLOG_POST" */
export function toScreamingSnake(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

/** Convert to snake_case: "BlogPost" → "blog_post" */
export function toSnakeCase(str: string): string {
  return toScreamingSnake(str).toLowerCase();
}

/** Pluralize a word (simple English rules) */
export function pluralize(str: string): string {
  if (str.endsWith('y') && !str.endsWith('ay') && !str.endsWith('ey') && !str.endsWith('oy')) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

/** Indent each line of a multi-line string */
export function indent(str: string, spaces: number = 2): string {
  const pad = ' '.repeat(spaces);
  return str
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
}
