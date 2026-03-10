import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get auth-keycloak module options from project config.
 */
function getKeycloakOptions(project: GyxerProject): {
  realm: string;
  authServerUrl: string;
  clientId: string;
} {
  const mod = project.modules?.find(
    (m) => m.name === 'auth-keycloak' && m.enabled !== false,
  );
  return {
    realm: (mod?.options?.realm as string) || 'master',
    authServerUrl: (mod?.options?.authServerUrl as string) || 'http://localhost:8080',
    clientId: (mod?.options?.clientId as string) || 'nestjs-app',
  };
}

/**
 * Generate all files needed for the Keycloak auth module.
 * This is an alternative to auth-jwt — uses Keycloak as the IdP.
 */
export function generateAuthKeycloakFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getKeycloakOptions(project);

  files.set('src/auth/auth-keycloak.module.ts', generateKeycloakModule());
  files.set('src/auth/strategies/keycloak.strategy.ts', generateKeycloakStrategy(opts));
  files.set('src/auth/guards/keycloak-auth.guard.ts', generateKeycloakGuard());
  files.set('src/auth/decorators/public.decorator.ts', generatePublicDecorator());

  return files;
}

// ─── Keycloak Module ────────────────────────────────────────

function generateKeycloakModule(): string {
  return `import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakStrategy } from './strategies/keycloak.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'keycloak' })],
  providers: [KeycloakStrategy],
  exports: [PassportModule],
})
export class AuthKeycloakModule {}
`;
}

// ─── Keycloak Strategy ──────────────────────────────────────

function generateKeycloakStrategy(opts: { realm: string; authServerUrl: string; clientId: string }): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    const realm = process.env.KEYCLOAK_REALM || '${opts.realm}';
    const authServerUrl = process.env.KEYCLOAK_AUTH_SERVER_URL || '${opts.authServerUrl}';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: process.env.KEYCLOAK_CLIENT_ID || '${opts.clientId}',
      issuer: \`\${authServerUrl}/realms/\${realm}\`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: \`\${authServerUrl}/realms/\${realm}/protocol/openid-connect/certs\`,
      }),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.preferred_username,
      roles: payload.realm_access?.roles || [],
    };
  }
}
`;
}

// ─── Keycloak Guard ─────────────────────────────────────────

function generateKeycloakGuard(): string {
  return `import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('keycloak') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
`;
}

// ─── Public Decorator ───────────────────────────────────────

function generatePublicDecorator(): string {
  return `import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`;
}

// ─── Dependencies ───────────────────────────────────────────

export function getAuthKeycloakDependencies(): Record<string, string> {
  return {
    '@nestjs/passport': '^11.0.0',
    'passport': '^0.7.0',
    'passport-jwt': '^4.0.1',
    'jwks-rsa': '^3.1.0',
  };
}

export function getAuthKeycloakDevDependencies(): Record<string, string> {
  return {
    '@types/passport-jwt': '^4.0.0',
  };
}

export function getAuthKeycloakEnvVars(): string {
  return `KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=nestjs-app
`;
}
