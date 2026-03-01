---
'@gyxer-studio/schema': patch
'@gyxer-studio/generator': patch
'@gyxer-studio/cli': patch
---

fix: pass DB credentials (host, port, user, password) from editor to generated .env and docker-compose

- Added `dbHost`, `dbPort`, `dbUser`, `dbPassword` to `ProjectSettingsSchema`
- `generateEnvFile` now uses `${VAR}` references in `DATABASE_URL` (dotenv-expand) to avoid password duplication
- `docker-compose` uses credentials from settings for `POSTGRES_USER`, `POSTGRES_PASSWORD`
- CLI `new` command includes DB field defaults
- Editor export passes DB fields to generated config
