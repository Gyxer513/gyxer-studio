# @gyxer-studio/cli

## 0.7.0

### Minor Changes

- 2702404: feat: `gyxer generate --force` overwrites an existing output directory without asking; without the flag in a non-interactive shell (CI, scripts) the command now fails fast with a clear message instead of hanging on a hidden prompt

### Patch Changes

- Updated dependencies [38258b2]
- Updated dependencies [2a68761]
  - @gyxer-studio/generator@0.7.0
  - @gyxer-studio/schema@0.7.0

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

### Patch Changes

- Updated dependencies [2f642b7]
- Updated dependencies [1083756]
  - @gyxer-studio/generator@0.6.0
  - @gyxer-studio/schema@0.6.0

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

### Patch Changes

- Updated dependencies [2f642b7]
  - @gyxer-studio/generator@0.6.0-alpha.1
  - @gyxer-studio/schema@0.6.0-alpha.1

## 0.6.0-alpha.0

### Minor Changes

- 1083756: feat: add 7 plugin modules — cache (Redis), queues (BullMQ), file-storage (S3/MinIO), websockets (Socket.IO), search (MeiliSearch), auth-oauth (Google/GitHub), auth-keycloak (SSO)

### Patch Changes

- Updated dependencies [1083756]
  - @gyxer-studio/generator@0.6.0-alpha.0
  - @gyxer-studio/schema@0.6.0-alpha.0

## 0.5.0

### Patch Changes

- Updated dependencies [beb824b]
  - @gyxer-studio/generator@0.5.0
  - @gyxer-studio/schema@0.5.0

## 0.4.5

### Patch Changes

- Updated dependencies [c6e1b70]
  - @gyxer-studio/generator@0.4.5
  - @gyxer-studio/schema@0.4.5

## 0.4.4

### Patch Changes

- fc610ae: fix: pass DB credentials (host, port, user, password) from editor to generated .env and docker-compose
  - Added `dbHost`, `dbPort`, `dbUser`, `dbPassword` to `ProjectSettingsSchema`
  - `generateEnvFile` now uses `${VAR}` references in `DATABASE_URL` (dotenv-expand) to avoid password duplication
  - `docker-compose` uses credentials from settings for `POSTGRES_USER`, `POSTGRES_PASSWORD`
  - CLI `new` command includes DB field defaults
  - Editor export passes DB fields to generated config

- Updated dependencies [fc610ae]
  - @gyxer-studio/schema@0.4.4
  - @gyxer-studio/generator@0.4.4

## 0.4.3

### Patch Changes

- Updated dependencies [090b970]
  - @gyxer-studio/generator@0.4.3
  - @gyxer-studio/schema@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies [8b43968]
  - @gyxer-studio/generator@0.4.2
  - @gyxer-studio/schema@0.4.2

## 0.4.1

### Patch Changes

- b3a8bcc: Bearer token auto-save in HTTP client, docs link in CLI output, http-store tests
- Updated dependencies [b3a8bcc]
  - @gyxer-studio/generator@0.4.1
  - @gyxer-studio/schema@0.4.1

## 0.4.0

### Minor Changes

- 01c7be9: Auto-fix entity/project naming, database connection settings UI, auth-jwt UX, generated test specs, Docker image

### Patch Changes

- Updated dependencies [01c7be9]
  - @gyxer-studio/generator@0.4.0
  - @gyxer-studio/schema@0.4.0

## 0.3.0

### Minor Changes

- d5d1772: Add validate command, FK fields editor, dynamic auth-jwt, multi-db support, social-network example

### Patch Changes

- Updated dependencies [d5d1772]
  - @gyxer-studio/generator@0.3.0
  - @gyxer-studio/schema@0.3.0

## 0.2.0

### Minor Changes

- feat: add `gyxer editor` command — local visual schema editor with config saving

### Patch Changes

- Updated dependencies
  - @gyxer-studio/schema@0.2.0
  - @gyxer-studio/generator@0.2.0

## 0.1.1

### Patch Changes

- fix: ESM import of fs-extra — `import * as fs` → `import fs` to resolve `fs.writeFile is not a function`
- Updated dependencies
  - @gyxer-studio/generator@0.1.1
  - @gyxer-studio/schema@0.1.1
