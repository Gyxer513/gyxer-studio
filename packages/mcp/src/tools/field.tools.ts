import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readProject, writeProject } from '../project-io.js';

export function registerFieldTools(server: McpServer): void {
  // ─── add_field ─────────────────────────────────────────────
  server.tool(
    'add_field',
    {
      entityName: z.string().min(1),
      field: z.object({
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
      }),
    },
    async ({ entityName, field }) => {
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

        if (entity.fields.some((f) => f.name === field.name)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Field "${field.name}" already exists in "${entityName}".`,
              },
            ],
            isError: true,
          };
        }

        entity.fields.push(field as any);

        const result = await writeProject(project);
        if (!result.success) {
          entity.fields.pop();
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
              text: `Field "${field.name}" (${field.type}) added to "${entityName}". Total fields: ${entity.fields.length}.`,
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

  // ─── remove_field ──────────────────────────────────────────
  server.tool(
    'remove_field',
    {
      entityName: z.string().min(1),
      fieldName: z.string().min(1),
    },
    async ({ entityName, fieldName }) => {
      try {
        const project = await readProject();
        const entity = project.entities.find((e) => e.name === entityName);
        if (!entity) {
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

        const idx = entity.fields.findIndex((f) => f.name === fieldName);
        if (idx === -1) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Field "${fieldName}" not found in "${entityName}".`,
              },
            ],
            isError: true,
          };
        }

        if (entity.fields.length === 1) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: Cannot remove the last field. Entity must have at least one field.',
              },
            ],
            isError: true,
          };
        }

        entity.fields.splice(idx, 1);

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
              text: `Field "${fieldName}" removed from "${entityName}". Remaining: ${entity.fields.length}.`,
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
}
