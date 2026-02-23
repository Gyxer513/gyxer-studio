export { generateProject } from './project-generator.js';
export type { GenerateOptions, GenerateResult } from './project-generator.js';

// Individual generators (for advanced usage)
export { generatePrismaSchema } from './generators/prisma.generator.js';
export { generateCreateDto, generateUpdateDto } from './generators/dto.generator.js';
export { generateService } from './generators/service.generator.js';
export { generateController } from './generators/controller.generator.js';
export { generateModule } from './generators/module.generator.js';
export {
  generateMain,
  generateAppModule,
  generatePrismaService,
  generatePrismaModule,
  generatePrismaExceptionFilter,
} from './generators/app.generator.js';
export {
  generateDockerfile,
  generateDockerCompose,
  generateEnvFile,
  generateEnvExample,
  buildDatabaseUrl,
} from './generators/docker.generator.js';

// Modules
export { generateAuthJwtFiles } from './modules/auth-jwt.generator.js';

// Security
export { generateSecurityReport, formatSecurityReport } from './security/report.js';
export type { SecurityCheck, SecurityReport } from './security/report.js';

// Utils
export { toKebabCase, toCamelCase, toSnakeCase, pluralize } from './utils.js';
