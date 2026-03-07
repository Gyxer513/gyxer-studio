import type { GyxerProject } from '@gyxer-studio/schema';

type OAuthProvider = 'google' | 'github';

/**
 * Get auth-oauth module options from project config.
 */
function getOAuthOptions(project: GyxerProject): {
  providers: OAuthProvider[];
  callbackUrl: string;
} {
  const mod = project.modules?.find(
    (m) => m.name === 'auth-oauth' && m.enabled !== false,
  );
  return {
    providers: (mod?.options?.providers as OAuthProvider[]) || ['google'],
    callbackUrl: (mod?.options?.callbackUrl as string) || 'http://localhost:3000/auth',
  };
}

/**
 * Generate all files needed for the OAuth module.
 * This extends the existing auth-jwt module — it does NOT replace it.
 */
export function generateAuthOAuthFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getOAuthOptions(project);

  if (opts.providers.includes('google')) {
    files.set('src/auth/strategies/google.strategy.ts', generateGoogleStrategy(opts));
  }
  if (opts.providers.includes('github')) {
    files.set('src/auth/strategies/github.strategy.ts', generateGithubStrategy(opts));
  }
  files.set('src/auth/auth-oauth.controller.ts', generateOAuthController(opts));

  return files;
}

// ─── Google Strategy ────────────────────────────────────────

function generateGoogleStrategy(opts: { callbackUrl: string }): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '${opts.callbackUrl}/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, displayName, photos } = profile;
    const user = {
      email: emails?.[0]?.value || '',
      name: displayName,
      picture: photos?.[0]?.value,
      provider: 'google',
      providerId: profile.id,
      accessToken,
    };
    done(null, user);
  }
}
`;
}

// ─── GitHub Strategy ────────────────────────────────────────

function generateGithubStrategy(opts: { callbackUrl: string }): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: '${opts.callbackUrl}/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any) => void,
  ): Promise<void> {
    const { emails, displayName, photos, username } = profile;
    const user = {
      email: emails?.[0]?.value || '',
      name: displayName || username || '',
      picture: photos?.[0]?.value,
      provider: 'github',
      providerId: profile.id,
      accessToken,
    };
    done(null, user);
  }
}
`;
}

// ─── OAuth Controller ───────────────────────────────────────

function generateOAuthController(opts: { providers: OAuthProvider[] }): string {
  const lines: string[] = [];

  lines.push(`import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';`);
  lines.push(`import { AuthGuard } from '@nestjs/passport';`);
  lines.push(`import { ApiTags, ApiOperation } from '@nestjs/swagger';`);
  lines.push(`import { Public } from './decorators/public.decorator';`);
  lines.push(`import { Request, Response } from 'express';`);
  lines.push('');
  lines.push(`@ApiTags('auth')`);
  lines.push(`@Controller('auth')`);
  lines.push('export class AuthOAuthController {');

  if (opts.providers.includes('google')) {
    lines.push('');
    lines.push("  @Get('google')");
    lines.push("  @Public()");
    lines.push("  @ApiOperation({ summary: 'Initiate Google OAuth login' })");
    lines.push("  @UseGuards(AuthGuard('google'))");
    lines.push("  googleLogin() {");
    lines.push("    // Guard redirects to Google");
    lines.push('  }');
    lines.push('');
    lines.push("  @Get('google/callback')");
    lines.push("  @Public()");
    lines.push("  @ApiOperation({ summary: 'Google OAuth callback' })");
    lines.push("  @UseGuards(AuthGuard('google'))");
    lines.push('  googleCallback(@Req() req: Request, @Res() res: Response) {');
    lines.push('    // req.user contains the authenticated user from Google strategy');
    lines.push("    res.json({ message: 'Google auth successful', user: req.user });");
    lines.push('  }');
  }

  if (opts.providers.includes('github')) {
    lines.push('');
    lines.push("  @Get('github')");
    lines.push("  @Public()");
    lines.push("  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })");
    lines.push("  @UseGuards(AuthGuard('github'))");
    lines.push('  githubLogin() {');
    lines.push("    // Guard redirects to GitHub");
    lines.push('  }');
    lines.push('');
    lines.push("  @Get('github/callback')");
    lines.push("  @Public()");
    lines.push("  @ApiOperation({ summary: 'GitHub OAuth callback' })");
    lines.push("  @UseGuards(AuthGuard('github'))");
    lines.push('  githubCallback(@Req() req: Request, @Res() res: Response) {');
    lines.push('    // req.user contains the authenticated user from GitHub strategy');
    lines.push("    res.json({ message: 'GitHub auth successful', user: req.user });");
    lines.push('  }');
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── Dependencies ───────────────────────────────────────────

export function getAuthOAuthDependencies(providers: OAuthProvider[]): Record<string, string> {
  const deps: Record<string, string> = {};
  if (providers.includes('google')) {
    deps['passport-google-oauth20'] = '^2.0.0';
  }
  if (providers.includes('github')) {
    deps['passport-github2'] = '^0.1.12';
  }
  return deps;
}

export function getAuthOAuthDevDependencies(providers: OAuthProvider[]): Record<string, string> {
  const deps: Record<string, string> = {};
  if (providers.includes('google')) {
    deps['@types/passport-google-oauth20'] = '^2.0.0';
  }
  if (providers.includes('github')) {
    deps['@types/passport-github2'] = '^1.2.0';
  }
  return deps;
}

export function getAuthOAuthEnvVars(providers: OAuthProvider[]): string {
  const lines: string[] = [];
  if (providers.includes('google')) {
    lines.push('GOOGLE_CLIENT_ID=your-google-client-id');
    lines.push('GOOGLE_CLIENT_SECRET=your-google-client-secret');
  }
  if (providers.includes('github')) {
    lines.push('GITHUB_CLIENT_ID=your-github-client-id');
    lines.push('GITHUB_CLIENT_SECRET=your-github-client-secret');
  }
  return lines.length ? lines.join('\n') + '\n' : '';
}
