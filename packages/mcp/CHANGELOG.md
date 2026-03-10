# @gyxer-studio/mcp

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
