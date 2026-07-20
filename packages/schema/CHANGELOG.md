# @gyxer-studio/schema

## 0.6.0

### Minor Changes

- 2f642b7: feat: MCP server, Claude Code skills, admin FK relations, file upload, Gyxer branding
  - Add MCP server package with 14 tools for managing Gyxer projects (entities, fields, relations, modules)
  - Add 6 Claude Code skills (/scaffold, /generate, /add-entity, /add-module, /describe, /validate)
  - Admin: FK Select dropdowns for related entities (Author, Category, etc.)
  - Admin: FileUpload component for image/file fields when file-storage module is enabled
  - Admin: image preview in list tables for file-storage fields
  - Admin: embed SPA into NestJS container via @nestjs/serve-static (single Docker container)
  - Gyxer corporate branding: red accent #E53935, 3-petal logo, animated spinner
  - Fix English pluralization in API routes (Category → /api/categories)
  - Upgrade NestJS to v11 (@nestjs/core, @nestjs/platform-express, etc.)
  - New example: media-cms with Author, Category, Article, Tag + file-storage + auth-jwt

- 1083756: feat: add 7 plugin modules — cache (Redis), queues (BullMQ), file-storage (S3/MinIO), websockets (Socket.IO), search (MeiliSearch), auth-oauth (Google/GitHub), auth-keycloak (SSO)

## 0.6.0-alpha.1

### Minor Changes

- 2f642b7: feat: MCP server, Claude Code skills, admin FK relations, file upload, Gyxer branding
  - Add MCP server package with 14 tools for managing Gyxer projects (entities, fields, relations, modules)
  - Add 6 Claude Code skills (/scaffold, /generate, /add-entity, /add-module, /describe, /validate)
  - Admin: FK Select dropdowns for related entities (Author, Category, etc.)
  - Admin: FileUpload component for image/file fields when file-storage module is enabled
  - Admin: image preview in list tables for file-storage fields
  - Admin: embed SPA into NestJS container via @nestjs/serve-static (single Docker container)
  - Gyxer corporate branding: red accent #E53935, 3-petal logo, animated spinner
  - Fix English pluralization in API routes (Category → /api/categories)
  - Upgrade NestJS to v11 (@nestjs/core, @nestjs/platform-express, etc.)
  - New example: media-cms with Author, Category, Article, Tag + file-storage + auth-jwt

## 0.6.0-alpha.0

### Minor Changes

- 1083756: feat: add 7 plugin modules — cache (Redis), queues (BullMQ), file-storage (S3/MinIO), websockets (Socket.IO), search (MeiliSearch), auth-oauth (Google/GitHub), auth-keycloak (SSO)

## 0.5.0

## 0.4.5

## 0.4.4

### Patch Changes

- fc610ae: fix: pass DB credentials (host, port, user, password) from editor to generated .env and docker-compose
  - Added `dbHost`, `dbPort`, `dbUser`, `dbPassword` to `ProjectSettingsSchema`
  - `generateEnvFile` now uses `${VAR}` references in `DATABASE_URL` (dotenv-expand) to avoid password duplication
  - `docker-compose` uses credentials from settings for `POSTGRES_USER`, `POSTGRES_PASSWORD`
  - CLI `new` command includes DB field defaults
  - Editor export passes DB fields to generated config

## 0.4.3

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 01c7be9: Auto-fix entity/project naming, database connection settings UI, auth-jwt UX, generated test specs, Docker image

## 0.3.0

### Minor Changes

- d5d1772: Add validate command, FK fields editor, dynamic auth-jwt, multi-db support, social-network example

## 0.2.0

### Minor Changes

- feat: add `gyxer editor` command — local visual schema editor with config saving

## 0.1.1

### Patch Changes

- fix: ESM import of fs-extra — `import * as fs` → `import fs` to resolve `fs.writeFile is not a function`
