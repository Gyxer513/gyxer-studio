import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readProject, writeProject } from '../project-io.js';

export function registerRelationTools(server: McpServer): void {
  // ─── add_relation ──────────────────────────────────────────
  server.tool(
    'add_relation',
    {
      sourceEntity: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
      target: z.string().min(1),
      foreignKey: z.string().optional(),
      onDelete: z
        .enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION'])
        .default('CASCADE'),
    },
    async ({ sourceEntity, name, type, target, foreignKey, onDelete }) => {
      try {
        const project = await readProject();
        const entity = project.entities.find((e) => e.name === sourceEntity);
        if (!entity) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Source entity "${sourceEntity}" not found. Available: ${project.entities.map((e) => e.name).join(', ')}.`,
              },
            ],
            isError: true,
          };
        }

        if (!project.entities.some((e) => e.name === target)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Target entity "${target}" not found. Available: ${project.entities.map((e) => e.name).join(', ')}.`,
              },
            ],
            isError: true,
          };
        }

        if (entity.relations.some((r) => r.name === name)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Relation "${name}" already exists in "${sourceEntity}".`,
              },
            ],
            isError: true,
          };
        }

        entity.relations.push({
          name,
          type,
          target,
          foreignKey: foreignKey ?? `${name}Id`,
          onDelete,
        });

        const result = await writeProject(project);
        if (!result.success) {
          entity.relations.pop();
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
              text: `Relation "${name}" (${type}) added: ${sourceEntity} -> ${target}.`,
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
