import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readProject, writeProject } from '../project-io.js';

const MODULE_NAMES = [
  'auth-jwt',
  'auth-oauth',
  'auth-keycloak',
  'file-storage',
  'queues',
  'search',
  'cache',
  'websockets',
  'admin-dashboard',
] as const;

export function registerModuleTools(server: McpServer): void {
  // ─── enable_module ─────────────────────────────────────────
  server.tool(
    'enable_module',
    {
      moduleName: z.enum(MODULE_NAMES),
      options: z.record(z.unknown()).optional(),
    },
    async ({ moduleName, options }) => {
      try {
        const project = await readProject();

        // Business rule: auth-oauth requires auth-jwt
        if (moduleName === 'auth-oauth') {
          const hasJwt = project.modules.some(
            (m) => m.name === 'auth-jwt' && m.enabled !== false,
          );
          if (!hasJwt) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Error: auth-oauth requires auth-jwt to be enabled first.',
                },
              ],
              isError: true,
            };
          }
        }

        // Business rule: auth-keycloak and auth-jwt are mutually exclusive
        if (moduleName === 'auth-keycloak') {
          const hasJwt = project.modules.some(
            (m) => m.name === 'auth-jwt' && m.enabled !== false,
          );
          if (hasJwt) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Error: auth-keycloak cannot be used with auth-jwt. Disable auth-jwt first.',
                },
              ],
              isError: true,
            };
          }
        }
        if (moduleName === 'auth-jwt') {
          const hasKeycloak = project.modules.some(
            (m) => m.name === 'auth-keycloak' && m.enabled !== false,
          );
          if (hasKeycloak) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Error: auth-jwt cannot be used with auth-keycloak. Disable auth-keycloak first.',
                },
              ],
              isError: true,
            };
          }
        }

        // Check if already in modules array
        const existing = project.modules.find((m) => m.name === moduleName);
        if (existing) {
          existing.enabled = true;
          if (options) existing.options = options;
        } else {
          project.modules.push({
            name: moduleName,
            enabled: true,
            options: options ?? {},
          });
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
            { type: 'text' as const, text: `Module "${moduleName}" enabled.` },
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

  // ─── disable_module ────────────────────────────────────────
  server.tool(
    'disable_module',
    {
      moduleName: z.enum(MODULE_NAMES),
    },
    async ({ moduleName }) => {
      try {
        const project = await readProject();
        const existing = project.modules.find((m) => m.name === moduleName);

        if (!existing) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Module "${moduleName}" is not in the project. Nothing to disable.`,
              },
            ],
          };
        }

        // Cascade: disabling auth-jwt also disables auth-oauth
        let cascadeMsg = '';
        if (moduleName === 'auth-jwt') {
          const oauthModule = project.modules.find(
            (m) => m.name === 'auth-oauth',
          );
          if (oauthModule && oauthModule.enabled !== false) {
            oauthModule.enabled = false;
            cascadeMsg = ' (auth-oauth also disabled — it depends on auth-jwt)';
          }
        }

        existing.enabled = false;

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
              text: `Module "${moduleName}" disabled.${cascadeMsg}`,
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
