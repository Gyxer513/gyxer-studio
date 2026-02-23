import { useProjectStore } from '../store/project-store';

/** Build DATABASE_URL based on the chosen database type. */
function buildDatabaseUrl(db: string, dbName: string): string {
  switch (db) {
    case 'sqlite':
      return 'file:./prisma/dev.db';
    case 'mysql':
      return `mysql://root:root@localhost:3306/${dbName}`;
    case 'postgresql':
    default:
      return `postgresql://postgres:postgres@localhost:5432/${dbName}`;
  }
}

/**
 * Export the current editor state to a @gyxer-studio/schema-compatible JSON object.
 */
export function exportToSchema(): Record<string, unknown> {
  const { entities, relations, settings, modules } = useProjectStore.getState();

  const schemaEntities = entities.map((entity) => {
    // Find relations where this entity is the source
    const entityRelations = relations
      .filter((r) => r.sourceEntityId === entity.id)
      .map((r) => {
        const target = entities.find((e) => e.id === r.targetEntityId);
        return {
          name: r.name,
          type: r.type,
          target: target?.name || 'Unknown',
          ...(r.foreignKey ? { foreignKey: r.foreignKey } : {}),
          onDelete: r.onDelete,
        };
      });

    return {
      name: entity.name,
      fields: entity.fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        unique: f.unique,
        index: f.index,
        ...(f.default !== undefined ? { default: f.default } : {}),
        ...(f.enumValues ? { enumValues: f.enumValues } : {}),
      })),
      relations: entityRelations,
    };
  });

  // Build modules array from toggle flags
  const schemaModules: Array<{ name: string; enabled: boolean; options: Record<string, unknown> }> = [];
  if (modules.authJwt) {
    schemaModules.push({ name: 'auth-jwt', enabled: true, options: {} });
  }

  return {
    name: settings.name,
    version: '0.1.0',
    description: settings.description,
    entities: schemaEntities,
    modules: schemaModules,
    settings: {
      port: settings.port,
      database: settings.database,
      databaseUrl: buildDatabaseUrl(settings.database, settings.name.replace(/-/g, '_')),
      enableSwagger: settings.enableSwagger,
      enableCors: settings.enableCors,
      enableHelmet: settings.enableHelmet,
      enableRateLimit: settings.enableRateLimit,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: settings.docker,
    },
  };
}
