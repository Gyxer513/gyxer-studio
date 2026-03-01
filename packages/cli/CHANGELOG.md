# @gyxer-studio/cli

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
