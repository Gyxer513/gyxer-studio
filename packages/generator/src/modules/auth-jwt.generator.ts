import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Generate all files needed for JWT authentication module.
 */
export function generateAuthJwtFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();

  // Auth module
  files.set('src/auth/auth.module.ts', generateAuthModule());
  files.set('src/auth/auth.service.ts', generateAuthService());
  files.set('src/auth/auth.controller.ts', generateAuthController());

  // DTOs
  files.set('src/auth/dto/register.dto.ts', generateRegisterDto());
  files.set('src/auth/dto/login.dto.ts', generateLoginDto());
  files.set('src/auth/dto/auth-response.dto.ts', generateAuthResponseDto());
  files.set('src/auth/dto/refresh-token.dto.ts', generateRefreshTokenDto());

  // JWT strategy & guard
  files.set('src/auth/strategies/jwt.strategy.ts', generateJwtStrategy());
  files.set('src/auth/guards/jwt-auth.guard.ts', generateJwtAuthGuard());

  // Decorators
  files.set('src/auth/decorators/current-user.decorator.ts', generateCurrentUserDecorator());
  files.set('src/auth/decorators/public.decorator.ts', generatePublicDecorator());

  return files;
}

// ─── Auth Module ────────────────────────────────────────────

function generateAuthModule(): string {
  return `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
`;
}

// ─── Auth Service ───────────────────────────────────────────

function generateAuthService(): string {
  return `import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateTokens(userId: number, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }
}
`;
}

// ─── Auth Controller ────────────────────────────────────────

function generateAuthController(): string {
  return `import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }
}
`;
}

// ─── DTOs ───────────────────────────────────────────────────

function generateRegisterDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
`;
}

function generateLoginDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
`;
}

function generateAuthResponseDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (short-lived)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (long-lived)' })
  refreshToken: string;
}
`;
}

function generateRefreshTokenDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from login/register response' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
`;
}

// ─── JWT Strategy ───────────────────────────────────────────

function generateJwtStrategy(): string {
  return `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { sub: user.id, email: user.email };
  }
}
`;
}

// ─── Guards ─────────────────────────────────────────────────

function generateJwtAuthGuard(): string {
  return `import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
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

// ─── Decorators ─────────────────────────────────────────────

function generateCurrentUserDecorator(): string {
  return `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current authenticated user from the request.
 *
 * Usage:
 *   @CurrentUser() user          — full user payload { sub, email }
 *   @CurrentUser('sub') userId   — just the user ID
 *   @CurrentUser('email') email  — just the email
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
`;
}

function generatePublicDecorator(): string {
  return `import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as public (no JWT required).
 *
 * Usage:
 *   @Public()
 *   @Get('health')
 *   healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`;
}

// ─── Extra Prisma fields for User entity when auth is enabled ──

/**
 * Returns the additional Prisma fields that need to be added to the User model
 * when auth-jwt module is enabled.
 */
export function getAuthPrismaFields(): string {
  return `  passwordHash  String  @map("password_hash")`;
}

/**
 * Returns additional env variables needed for auth-jwt.
 */
export function getAuthEnvVars(): string {
  return `JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
`;
}

/**
 * Returns additional npm dependencies for auth-jwt.
 */
export function getAuthDependencies(): Record<string, string> {
  return {
    '@nestjs/jwt': '^10.2.0',
    '@nestjs/passport': '^10.0.0',
    'passport': '^0.7.0',
    'passport-jwt': '^4.0.1',
    'bcrypt': '^5.1.0',
  };
}

export function getAuthDevDependencies(): Record<string, string> {
  return {
    '@types/passport-jwt': '^4.0.0',
    '@types/bcrypt': '^5.0.0',
  };
}
