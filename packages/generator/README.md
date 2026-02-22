# @gyxer-studio/generator

NestJS project code generator. Takes a Gyxer schema and generates a complete, production-ready NestJS application with Prisma ORM.

## Installation

```bash
npm install @gyxer-studio/generator
```

## Usage

```typescript
import { generateProject } from '@gyxer-studio/generator';
import type { GyxerProject } from '@gyxer-studio/schema';

const project: GyxerProject = {
  name: 'my-app',
  version: '0.1.0',
  entities: [/* ... */],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    // ...
  },
};

const files = generateProject(project);
// files is a Map<string, string> of filepath → content

for (const [path, content] of files) {
  // write files to disk
}
```

## What Gets Generated

- **Prisma schema** with models, relations, and enums
- **NestJS modules** with controllers, services, and DTOs
- **CRUD endpoints** with Swagger decorators and validation
- **JWT auth** (when `auth-jwt` module is enabled)
- **Docker** files (Dockerfile + docker-compose.yml)
- **Security report** with best practices assessment

## Individual Generators

```typescript
import {
  generatePrismaSchema,
  generateCreateDto,
  generateUpdateDto,
  generateController,
  generateService,
  generateModule,
  generateDockerfile,
  generateDockerCompose,
} from '@gyxer-studio/generator';
```

## Part of [Gyxer Studio](https://github.com/Gyxer513/gyxer-studio)

MIT License
