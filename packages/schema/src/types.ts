import { z } from 'zod';

// ─── Field Types ──────────────────────────────────────────────

export const FieldType = z.enum([
  'string',
  'int',
  'float',
  'boolean',
  'datetime',
  'enum',
  'json',
  'text',
  'uuid',
]);
export type FieldType = z.infer<typeof FieldType>;

// ─── Relation Types ───────────────────────────────────────────

export const RelationType = z.enum(['one-to-one', 'one-to-many', 'many-to-many']);
export type RelationType = z.infer<typeof RelationType>;

export const OnDeleteAction = z.enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION']);
export type OnDeleteAction = z.infer<typeof OnDeleteAction>;

// ─── Field ────────────────────────────────────────────────────

export const FieldSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  type: FieldType,
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
  index: z.boolean().default(false),
  default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  enumValues: z.array(z.string()).optional(),
  description: z.string().optional(),
});
export type Field = z.infer<typeof FieldSchema>;

// ─── Relation ─────────────────────────────────────────────────

export const RelationSchema = z.object({
  name: z.string().min(1),
  type: RelationType,
  target: z.string().min(1),
  foreignKey: z.string().optional(),
  onDelete: OnDeleteAction.default('CASCADE'),
  description: z.string().optional(),
});
export type Relation = z.infer<typeof RelationSchema>;

// ─── Entity ───────────────────────────────────────────────────

export const EntitySchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Entity name must be PascalCase'),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1, 'Entity must have at least one field'),
  relations: z.array(RelationSchema).default([]),
});
export type Entity = z.infer<typeof EntitySchema>;

// ─── Module Config ────────────────────────────────────────────

export const ModuleName = z.enum([
  'auth-jwt',
  'auth-oauth',
  'auth-keycloak',
  'file-storage',
  'queues',
  'search',
  'cache',
  'websockets',
]);
export type ModuleName = z.infer<typeof ModuleName>;

export const ModuleConfigSchema = z.object({
  name: ModuleName,
  enabled: z.boolean().default(true),
  options: z.record(z.unknown()).default({}),
});
export type ModuleConfig = z.infer<typeof ModuleConfigSchema>;

// ─── Project Settings ─────────────────────────────────────────

export const DatabaseType = z.enum(['postgresql', 'mysql', 'sqlite']);
export type DatabaseType = z.infer<typeof DatabaseType>;

export const ProjectSettingsSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  database: DatabaseType.default('postgresql'),
  databaseUrl: z.string().default('postgresql://postgres:postgres@localhost:5432/app'),
  enableSwagger: z.boolean().default(true),
  enableCors: z.boolean().default(true),
  enableHelmet: z.boolean().default(true),
  enableRateLimit: z.boolean().default(true),
  rateLimitTtl: z.number().default(60),
  rateLimitMax: z.number().default(100),
  docker: z.boolean().default(true),
});
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

// ─── Gyxer Project (root schema) ─────────────────────────────

export const GyxerProjectSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, 'Project name must be kebab-case'),
  version: z.string().default('0.1.0'),
  description: z.string().default(''),
  entities: z.array(EntitySchema).min(1, 'Project must have at least one entity'),
  modules: z.array(ModuleConfigSchema).default([]),
  settings: ProjectSettingsSchema.default({}),
});
export type GyxerProject = z.infer<typeof GyxerProjectSchema>;
