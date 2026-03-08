import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get search module options from project config.
 */
function getSearchOptions(project: GyxerProject): {
  indexableEntities: string[];
} {
  const mod = project.modules?.find(
    (m) => m.name === 'search' && m.enabled !== false,
  );
  const entities = (mod?.options?.indexableEntities as string[]) || [];
  // If no entities specified, index all entities by default
  return {
    indexableEntities: entities.length > 0 ? entities : project.entities.map((e) => e.name),
  };
}

/**
 * Generate all files needed for the Search module (MeiliSearch).
 */
export function generateSearchFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getSearchOptions(project);

  files.set('src/search/search.module.ts', generateSearchModule());
  files.set('src/search/search.service.ts', generateSearchService(opts));
  files.set('src/search/search.controller.ts', generateSearchController());

  return files;
}

// ─── Search Module ──────────────────────────────────────────

function generateSearchModule(): string {
  return `import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
`;
}

// ─── Search Service ─────────────────────────────────────────

function generateSearchService(opts: { indexableEntities: string[] }): string {
  const indexNames = opts.indexableEntities
    .map((e) => `'${e.toLowerCase()}'`)
    .join(', ');

  return `import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private readonly indexNames = [${indexNames}];

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY || '',
    });
  }

  async onModuleInit() {
    for (const indexName of this.indexNames) {
      try {
        await this.client.createIndex(indexName, { primaryKey: 'id' });
        this.logger.log(\`Index "\${indexName}" ready\`);
      } catch {
        this.logger.log(\`Index "\${indexName}" already exists\`);
      }
    }
  }

  /**
   * Search across a specific index.
   */
  async search(indexName: string, query: string, options?: { limit?: number; offset?: number }) {
    const index = this.client.index(indexName);
    return index.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  }

  /**
   * Add or update documents in an index.
   */
  async indexDocuments(indexName: string, documents: Record<string, unknown>[]) {
    const index = this.client.index(indexName);
    return index.addDocuments(documents);
  }

  /**
   * Remove a document from an index by ID.
   */
  async removeDocument(indexName: string, documentId: string | number) {
    const index = this.client.index(indexName);
    return index.deleteDocument(documentId);
  }

  /**
   * Reindex all documents for an index.
   */
  async reindex(indexName: string, documents: Record<string, unknown>[]) {
    const index = this.client.index(indexName);
    await index.deleteAllDocuments();
    return index.addDocuments(documents);
  }

  /**
   * Get all available index names.
   */
  getIndexNames(): string[] {
    return [...this.indexNames];
  }
}
`;
}

// ─── Search Controller ──────────────────────────────────────

function generateSearchController(): string {
  return `import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across an index' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'index', required: true, description: 'Index name' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('index') indexName: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.searchService.search(indexName, query, { limit, offset });
  }

  @Get('indexes')
  @ApiOperation({ summary: 'List available search indexes' })
  getIndexes() {
    return { indexes: this.searchService.getIndexNames() };
  }

  @Post(':index/reindex')
  @ApiOperation({ summary: 'Reindex all documents for an index' })
  async reindex(
    @Param('index') indexName: string,
    @Body() documents: Record<string, unknown>[],
  ) {
    return this.searchService.reindex(indexName, documents);
  }
}
`;
}

// ─── Dependencies ───────────────────────────────────────────

export function getSearchDependencies(): Record<string, string> {
  return {
    'meilisearch': '^0.55.0',
  };
}

export function getSearchEnvVars(): string {
  return `MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=
`;
}
