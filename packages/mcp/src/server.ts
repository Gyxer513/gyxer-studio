import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProjectTools } from './tools/project.tools.js';
import { registerEntityTools } from './tools/entity.tools.js';
import { registerFieldTools } from './tools/field.tools.js';
import { registerRelationTools } from './tools/relation.tools.js';
import { registerModuleTools } from './tools/module.tools.js';
import { readProject } from './project-io.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'gyxer',
    version,
  });

  // ─── Tools ────────────────────────────────────────────────
  registerProjectTools(server);
  registerEntityTools(server);
  registerFieldTools(server);
  registerRelationTools(server);
  registerModuleTools(server);

  // ─── Resource: gyxer://project ────────────────────────────
  server.resource('project', 'gyxer://project', async (uri) => {
    try {
      const project = await readProject();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  });

  // ─── Prompt: gyxer-architect ──────────────────────────────
  server.prompt('gyxer-architect', {}, () => ({
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `You are an expert backend architect using Gyxer Studio to generate NestJS backends.

## Available Field Types
- string: Short text (VARCHAR)
- text: Long text (TEXT)
- int: Integer number
- float: Floating point number
- boolean: True/false
- datetime: Date and time (ISO 8601)
- enum: One of a fixed set of values (must specify enumValues)
- json: Arbitrary JSON data
- uuid: UUID v4

## Available Relation Types
- one-to-one: Each record relates to exactly one other record
- one-to-many: One record relates to many records (e.g., User has many Posts)
- many-to-many: Many records relate to many records (e.g., Posts have many Tags)

## OnDelete Actions
CASCADE (delete children), SET_NULL (nullify FK), RESTRICT (prevent deletion), NO_ACTION

## Available Modules
- auth-jwt: JWT authentication with access/refresh tokens, user registration, login
- auth-oauth: OAuth2 providers (Google, GitHub, Facebook) — requires auth-jwt
- auth-keycloak: Keycloak SSO integration — mutually exclusive with auth-jwt
- file-storage: S3-compatible file upload/download with Multer
- queues: BullMQ job queues with Redis
- search: MeiliSearch full-text search integration
- cache: Redis caching layer
- websockets: Socket.IO real-time communication
- admin-dashboard: React admin panel with CRUD UI

## Database Options
postgresql (recommended), mysql, sqlite

## Best Practices
1. Entity names must be PascalCase (e.g., User, BlogPost, OrderItem)
2. Field names must be camelCase valid identifiers (e.g., firstName, isActive)
3. Project names must be kebab-case (e.g., my-api, blog-platform)
4. Every entity needs at least one field (id is auto-generated)
5. Enum fields must include enumValues array
6. Relations should reference existing entities
7. Use index: true on fields you will query/filter by
8. Use unique: true for natural keys (email, slug, etc.)
9. Enable auth-jwt before auth-oauth (OAuth depends on JWT)
10. Do not enable both auth-jwt and auth-keycloak simultaneously

## Workflow
1. create_project — initialize with name, description, database
2. add_entity — add domain entities one by one
3. add_field / add_relation — refine entity structure
4. enable_module — add auth, file storage, etc.
5. generate_project — produce NestJS code

Use the available MCP tools to build the project step by step.`,
        },
      },
    ],
  }));

  return server;
}
