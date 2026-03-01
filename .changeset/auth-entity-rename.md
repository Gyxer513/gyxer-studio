---
"@gyxer-studio/generator": minor
---

feat: support custom auth entity name and fix prisma module resolution

- Auth entity name is now dynamic via `options.entityName` (default: `'User'`)
- All generators use `getAuthEntityName()` instead of hardcoded `'User'`
- Prisma accessor, model name, seed, service, DTOs, and tests adapt to custom entity name
- Generate `nest-cli.json` with `deleteOutDir: true` to prevent stale build artifacts
- Exclude `prisma/` from `tsconfig.build.json` to fix `rootDir` calculation
- Fixes `Cannot find module './prisma/prisma.module'` runtime error
