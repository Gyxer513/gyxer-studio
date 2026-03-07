import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get cache module options from project config.
 */
function getCacheOptions(project: GyxerProject): { ttl: number; max: number } {
  const mod = project.modules?.find(
    (m) => m.name === 'cache' && m.enabled !== false,
  );
  return {
    ttl: (mod?.options?.ttl as number) || 300,
    max: (mod?.options?.maxItems as number) || 100,
  };
}

/**
 * Generate all files needed for the Cache module.
 */
export function generateCacheFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getCacheOptions(project);

  files.set('src/cache/cache.module.ts', generateCacheModule(opts));
  files.set('src/cache/cache.service.ts', generateCacheService());

  return files;
}

// ─── Cache Module ───────────────────────────────────────────

function generateCacheModule(opts: { ttl: number; max: number }): string {
  return `import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { Cacheable } from 'cacheable';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        // Primary: Redis, Secondary: In-memory fallback
        const primary = createKeyv(redisUrl);
        const secondary = new CacheableMemory({ ttl: ${opts.ttl} * 1000, lruSize: ${opts.max} });

        return {
          stores: [
            new Cacheable({ stores: [primary, secondary] }),
          ],
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheConfigModule {}
`;
}

// ─── Cache Service ──────────────────────────────────────────

function generateCacheService(): string {
  return `import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Get a value from cache.
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in cache with optional TTL (seconds).
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl ? ttl * 1000 : undefined);
  }

  /**
   * Delete a key from cache.
   */
  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  /**
   * Clear all cache entries.
   */
  async reset(): Promise<void> {
    await this.cache.clear();
  }
}
`;
}

// ─── Dependencies ───────────────────────────────────────────

export function getCacheDependencies(): Record<string, string> {
  return {
    '@nestjs/cache-manager': '^3.0.0',
    'cache-manager': '^6.0.0',
    'cacheable': '^1.0.0',
    '@keyv/redis': '^4.0.0',
  };
}

export function getCacheEnvVars(): string {
  return `REDIS_URL=redis://localhost:6379
`;
}
