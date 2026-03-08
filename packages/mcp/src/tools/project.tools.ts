import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readProject, writeProjectRaw, resolveProjectPath } from '../project-io.js';
import { generateProject } from '@gyxer-studio/generator';

export function registerProjectTools(server: McpServer): void {
  // ─── create_project ────────────────────────────────────────
  server.tool(
    'create_project',
    {
      name: z
        .string()
        .min(1)
        .regex(/^[a-z][a-z0-9-]*$/, 'Project name must be kebab-case'),
      description: z.string().default(''),
      database: z
        .enum(['postgresql', 'mysql', 'sqlite'])
        .default('postgresql'),
    },
    async ({ name, description, database }) => {
      const existing = resolveProjectPath();
      if (existing) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Project file already exists at ${existing}. Use get_project to read it.`,
            },
          ],
          isError: true,
        };
      }

      const dbName = name.replace(/-/g, '_');
      let databaseUrl: string;
      let dbPort = 5432;
      let dbUser = 'postgres';
      let dbPassword = 'postgres';

      switch (database) {
        case 'mysql':
          databaseUrl = `mysql://root:root@localhost:3306/${dbName}`;
          dbPort = 3306;
          dbUser = 'root';
          dbPassword = 'root';
          break;
        case 'sqlite':
          databaseUrl = `file:./${dbName}.db`;
          dbPort = 0;
          dbUser = '';
          dbPassword = '';
          break;
        default:
          databaseUrl = `postgresql://postgres:postgres@localhost:5432/${dbName}`;
          break;
      }

      const project = {
        name,
        version: '0.1.0',
        description,
        entities: [],
        modules: [],
        settings: {
          port: 3000,
          database,
          databaseUrl,
          dbHost: 'localhost',
          dbPort,
          dbUser,
          dbPassword,
          enableSwagger: true,
          enableCors: true,
          enableHelmet: true,
          enableRateLimit: true,
          rateLimitTtl: 60,
          rateLimitMax: 100,
          docker: true,
        },
      };

      await writeProjectRaw(project);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Project "${name}" created (${database}). File: gyxer.json\n\nNext: use add_entity to add your first entity.`,
          },
        ],
      };
    },
  );

  // ─── get_project ───────────────────────────────────────────
  server.tool('get_project', {}, async () => {
    try {
      const project = await readProject();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }],
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

  // ─── generate_project ─────────────────────────────────────
  server.tool(
    'generate_project',
    {
      outputDir: z.string().optional(),
    },
    async ({ outputDir }) => {
      try {
        const project = await readProject();
        const resolvedOutput = outputDir ?? `./${project.name}`;

        const result = await generateProject(project, {
          outputDir: resolvedOutput,
          silent: true,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Project "${project.name}" generated successfully!`,
                `Output: ${result.outputDir}`,
                `Files created: ${result.filesCreated.length}`,
                `Security score: ${result.securityReport.score}%`,
                '',
                'Next steps:',
                `  cd ${resolvedOutput}`,
                '  npm install',
                '  npx prisma migrate dev --name init',
                '  npm run start:dev',
              ].join('\n'),
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
