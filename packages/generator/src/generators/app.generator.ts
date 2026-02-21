import type { GyxerProject } from '@gyxer/schema';
import { toKebabCase } from '../utils.js';

/**
 * Generate main.ts bootstrap file.
 */
export function generateMain(project: GyxerProject): string {
  const lines: string[] = [];

  lines.push(`import { NestFactory } from '@nestjs/core';`);
  lines.push(`import { ValidationPipe } from '@nestjs/common';`);

  if (project.settings.enableSwagger) {
    lines.push(`import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';`);
  }
  if (project.settings.enableHelmet) {
    lines.push(`import helmet from 'helmet';`);
  }

  lines.push(`import { AppModule } from './app.module';`);
  lines.push('');
  lines.push('async function bootstrap() {');
  lines.push('  const app = await NestFactory.create(AppModule);');
  lines.push('');

  // Helmet
  if (project.settings.enableHelmet) {
    lines.push('  // Security headers');
    lines.push('  app.use(helmet());');
    lines.push('');
  }

  // CORS
  if (project.settings.enableCors) {
    lines.push('  // CORS');
    lines.push('  app.enableCors();');
    lines.push('');
  }

  // Validation
  lines.push('  // Global validation pipe');
  lines.push('  app.useGlobalPipes(');
  lines.push('    new ValidationPipe({');
  lines.push('      whitelist: true,');
  lines.push('      forbidNonWhitelisted: true,');
  lines.push('      transform: true,');
  lines.push('    }),');
  lines.push('  );');
  lines.push('');

  // Swagger
  if (project.settings.enableSwagger) {
    lines.push('  // Swagger API documentation');
    const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
    lines.push('  const config = new DocumentBuilder()');
    lines.push(`    .setTitle('${project.name}')`);
    lines.push(`    .setDescription('${project.description || 'API documentation'}')`);
    lines.push(`    .setVersion('${project.version}')`);
    if (hasAuthJwt) {
      lines.push("    .addBearerAuth()");
    }
    lines.push('    .build();');
    lines.push('  const document = SwaggerModule.createDocument(app, config);');
    lines.push("  SwaggerModule.setup('api/docs', app, document);");
    lines.push('');
  }

  lines.push(`  await app.listen(process.env.PORT ?? ${project.settings.port});`);
  lines.push(
    `  console.log(\`Application is running on: \${await app.getUrl()}\`);`,
  );

  if (project.settings.enableSwagger) {
    lines.push(
      `  console.log(\`Swagger docs: \${await app.getUrl()}/api/docs\`);`,
    );
  }

  lines.push('}');
  lines.push('bootstrap();');

  return lines.join('\n') + '\n';
}

/**
 * Generate app.module.ts with all entity modules imported.
 */
export function generateAppModule(project: GyxerProject): string {
  const hasAuthJwt = project.modules.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
  const needsAppGuard = project.settings.enableRateLimit || hasAuthJwt;

  const imports: string[] = [];
  const moduleNames: string[] = [];

  // Prisma module
  imports.push(`import { PrismaModule } from './prisma/prisma.module';`);
  moduleNames.push('PrismaModule');

  // Rate limiting
  if (project.settings.enableRateLimit) {
    imports.push(`import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';`);
  }

  // Auth JWT
  if (hasAuthJwt) {
    imports.push(`import { AuthModule } from './auth/auth.module';`);
    imports.push(`import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';`);
    moduleNames.push('AuthModule');
  }

  if (needsAppGuard) {
    imports.push(`import { APP_GUARD } from '@nestjs/core';`);
  }

  // Entity modules
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    imports.push(`import { ${entity.name}Module } from './${kebab}/${kebab}.module';`);
    moduleNames.push(`${entity.name}Module`);
  }

  const lines: string[] = [];
  lines.push(`import { Module } from '@nestjs/common';`);
  for (const imp of imports) {
    lines.push(imp);
  }
  lines.push('');
  lines.push('@Module({');
  lines.push('  imports: [');

  if (project.settings.enableRateLimit) {
    lines.push('    ThrottlerModule.forRoot([{');
    lines.push(`      ttl: ${project.settings.rateLimitTtl * 1000},`);
    lines.push(`      limit: ${project.settings.rateLimitMax},`);
    lines.push('    }]),');
  }

  for (const mod of moduleNames) {
    lines.push(`    ${mod},`);
  }

  lines.push('  ],');

  if (needsAppGuard) {
    lines.push('  providers: [');
    if (project.settings.enableRateLimit) {
      lines.push('    {');
      lines.push('      provide: APP_GUARD,');
      lines.push('      useClass: ThrottlerGuard,');
      lines.push('    },');
    }
    if (hasAuthJwt) {
      lines.push('    // Global JWT guard — all routes protected by default');
      lines.push('    // Use @Public() decorator to make specific routes public');
      lines.push('    {');
      lines.push('      provide: APP_GUARD,');
      lines.push('      useClass: JwtAuthGuard,');
      lines.push('    },');
    }
    lines.push('  ],');
  }

  lines.push('})');
  lines.push('export class AppModule {}');

  return lines.join('\n') + '\n';
}

/**
 * Generate PrismaService and PrismaModule.
 */
export function generatePrismaService(): string {
  return `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
}

export function generatePrismaModule(): string {
  return `import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;
}
