# MCP Server

The `@gyxer-studio/mcp` package lets AI agents (Claude Code, Cursor, Windsurf) build Gyxer projects through the [Model Context Protocol](https://modelcontextprotocol.io/).

Instead of manually designing schemas in the editor, you describe what you want in natural language and the AI builds the project step by step using MCP tools.

## Setup

### Claude Code

Add to your MCP settings:

```json
{
  "mcpServers": {
    "gyxer": {
      "command": "npx",
      "args": ["-y", "@gyxer-studio/mcp"]
    }
  }
}
```

### Cursor / Windsurf

Add the same config to your editor's MCP settings file.

### From Source (development)

```bash
cd gyxer-studio
npm run build
node packages/mcp/dist/index.js
```

## Tools

The MCP server exposes 12 tools:

### Project Management

| Tool | Description |
|------|-------------|
| `create_project` | Create a new project (name, description, database) |
| `get_project` | Read current project schema |
| `generate_project` | Generate NestJS code from the schema |

### Entity Management

| Tool | Description |
|------|-------------|
| `add_entity` | Add a new entity with fields |
| `update_entity` | Rename entity or update description |
| `remove_entity` | Delete entity and clean up relations |
| `list_entities` | List all entities with fields and relations |

### Field & Relation Management

| Tool | Description |
|------|-------------|
| `add_field` | Add a field to an entity |
| `remove_field` | Remove a field from an entity |
| `add_relation` | Create a relation between entities |

### Module Management

| Tool | Description |
|------|-------------|
| `enable_module` | Enable a module (auth, storage, etc.) |
| `disable_module` | Disable a module |

## Resource

| Resource | URI | Description |
|----------|-----|-------------|
| `project` | `gyxer://project` | Current project schema as JSON |

## Prompt

| Prompt | Description |
|--------|-------------|
| `gyxer-architect` | System prompt with all field types, relation types, modules, and best practices |

## Workflow

A typical AI-driven workflow:

```
1. create_project  →  Initialize with name, database
2. add_entity      →  Add domain entities (User, Post, Comment)
3. add_field       →  Refine fields (add indexes, unique constraints)
4. add_relation    →  Connect entities (User → Posts, Post → Comments)
5. enable_module   →  Add auth, file storage, caching, etc.
6. generate_project →  Produce NestJS code
```

## Example Conversation

> **You:** Create a blog API with PostgreSQL. Add User and Post entities. User has email (unique), name, and bio. Post has title, content, slug (unique, indexed), and published (boolean, default false). Add a one-to-many relation from User to Posts. Enable JWT auth.

The AI will call:

1. `create_project({ name: "blog-api", database: "postgresql" })`
2. `add_entity({ name: "User", fields: [...] })`
3. `add_entity({ name: "Post", fields: [...] })`
4. `add_relation({ sourceEntity: "User", name: "posts", type: "one-to-many", target: "Post" })`
5. `enable_module({ moduleName: "auth-jwt" })`
6. `generate_project()`

## Business Rules

- **auth-oauth** requires **auth-jwt** to be enabled first
- **auth-keycloak** and **auth-jwt** are mutually exclusive
- Disabling **auth-jwt** automatically disables **auth-oauth**
- Entity names must be PascalCase
- Field names must be camelCase
- Project names must be kebab-case
- Every entity needs at least one field (id is auto-generated)
- Enum fields must include `enumValues` array

## Claude Code Skills

When working in the Gyxer Studio repository, these slash commands are available:

| Command | Description |
|---------|-------------|
| `/scaffold` | Create a complete project from a description |
| `/add-entity` | Add an entity with fields |
| `/add-module` | Enable a module |
| `/generate` | Generate NestJS code |
| `/describe` | Show current project state |
