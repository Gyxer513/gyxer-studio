# @gyxer-studio/schema

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
