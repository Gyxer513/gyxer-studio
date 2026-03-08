import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  readProject,
  readProjectRaw,
  writeProject,
  writeProjectRaw,
  resolveProjectPath,
} from '../project-io.js';
import type { GyxerProject, Entity, Field } from '@gyxer-studio/schema';

const FieldSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  type: z.enum([
    'string',
    'int',
    'float',
    'boolean',
    'datetime',
    'enum',
    'json',
    'text',
    'uuid',
  ]),
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
  index: z.boolean().default(false),
  default: z
    .union([z.string(), z.number(), z.boolean(), z.null()])
    .optional(),
  enumValues: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export function registerEntityTools(server: McpServer): void {
  // ─── add_entity ────────────────────────────────────────────
  server.tool(
    'add_entity',
    {
      name: z
        .string()
        .min(1)
        .regex(
          /^[A-Z][a-zA-Z0-9]*$/,
          'Entity name must be PascalCase',
        ),
      fields: z
        .array(FieldSchema)
        .min(1, 'Entity must have at least one field'),
      description: z.string().optional(),
    },
    async ({ name, fields, description }) => {
      try {
        // Read raw — might have empty entities which fails validation
        let project: Record<string, unknown>;
        try {
          project = await readProjectRaw();
        } catch (err) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
            isError: true,
          };
        }

        const entities = project.entities as Entity[];

        if (entities.some((e) => e.name === name)) {
          return {
            content: [
              { type: 'text' as const, text: `Error: Entity "${name}" already exists.` },
            ],
            isError: true,
          };
        }

        const entity: Entity = {
          name,
          fields: fields as Field[],
          relations: [],
          ...(description ? { description } : {}),
        };

        entities.push(entity);

        // Now that we have >= 1 entity, use validated write
        const result = await writeProject(project as GyxerProject);
        if (!result.success) {
          entities.pop();
          const msgs = (result.errors ?? [])
            .map((e) => `${e.path}: ${e.message}`)
            .join('\n');
          return {
            content: [{ type: 'text' as const, text: `Validation failed:\n${msgs}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Entity "${name}" added with ${fields.length} field(s). Total entities: ${entities.length}.`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── update_entity ─────────────────────────────────────────
  server.tool(
    'update_entity',
    {
      entityName: z.string().min(1),
      newName: z
        .string()
        .regex(/^[A-Z][a-zA-Z0-9]*$/)
        .optional(),
      description: z.string().optional(),
    },
    async ({ entityName, newName, description }) => {
      try {
        const project = await readProject();
        const entity = project.entities.find((e) => e.name === entityName);
        if (!entity) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Entity "${entityName}" not found. Available: ${project.entities.map((e) => e.name).join(', ')}.`,
              },
            ],
            isError: true,
          };
        }

        if (newName) {
          if (
            project.entities.some(
              (e) => e.name === newName && e.name !== entityName,
            )
          ) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Entity "${newName}" already exists.`,
                },
              ],
              isError: true,
            };
          }
          // Cascade rename in relations
          for (const e of project.entities) {
            for (const r of e.relations) {
              if (r.target === entityName) {
                r.target = newName;
              }
            }
          }
          entity.name = newName;
        }
        if (description !== undefined) {
          entity.description = description;
        }

        const result = await writeProject(project);
        if (!result.success) {
          const msgs = (result.errors ?? [])
            .map((e) => `${e.path}: ${e.message}`)
            .join('\n');
          return {
            content: [{ type: 'text' as const, text: `Validation failed:\n${msgs}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Entity "${entityName}" updated${newName ? ` (renamed to "${newName}")` : ''}.`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── remove_entity ─────────────────────────────────────────
  server.tool(
    'remove_entity',
    {
      entityName: z.string().min(1),
    },
    async ({ entityName }) => {
      try {
        const raw = await readProjectRaw();
        const entities = raw.entities as Entity[];
        const idx = entities.findIndex((e) => e.name === entityName);

        if (idx === -1) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Entity "${entityName}" not found.`,
              },
            ],
            isError: true,
          };
        }

        entities.splice(idx, 1);

        // Clean up dangling relations
        for (const e of entities) {
          e.relations = e.relations.filter((r) => r.target !== entityName);
        }

        if (entities.length === 0) {
          await writeProjectRaw(raw);
        } else {
          const result = await writeProject(raw as GyxerProject);
          if (!result.success) {
            const msgs = (result.errors ?? [])
              .map((e) => `${e.path}: ${e.message}`)
              .join('\n');
            return {
              content: [
                { type: 'text' as const, text: `Validation failed:\n${msgs}` },
              ],
              isError: true,
            };
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Entity "${entityName}" removed. Remaining: ${entities.length}.`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── list_entities ─────────────────────────────────────────
  server.tool('list_entities', {}, async () => {
    try {
      let entities: Entity[];
      try {
        const project = await readProject();
        entities = project.entities;
      } catch {
        // Might fail on empty entities — try raw
        const filePath = resolveProjectPath();
        if (!filePath) {
          return {
            content: [{ type: 'text' as const, text: 'No project file found.' }],
            isError: true,
          };
        }
        const raw = await readProjectRaw();
        entities = (raw.entities as Entity[]) ?? [];
      }

      if (entities.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No entities defined yet. Use add_entity to create one.',
            },
          ],
        };
      }

      const summary = entities
        .map((e) => {
          const fields = e.fields
            .map(
              (f) =>
                `    ${f.name}: ${f.type}${f.required ? '' : '?'}${f.unique ? ' (unique)' : ''}${f.index ? ' (indexed)' : ''}`,
            )
            .join('\n');
          const relations =
            e.relations.length > 0
              ? '\n  Relations:\n' +
                e.relations
                  .map((r) => `    ${r.name} -> ${r.target} (${r.type})`)
                  .join('\n')
              : '';
          return `  ${e.name}:\n${fields}${relations}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Entities (${entities.length}):\n\n${summary}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });
}
