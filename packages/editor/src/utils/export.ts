import { useProjectStore } from '../store/project-store';

/** Build DATABASE_URL from project settings. */
function buildDatabaseUrl(settings: {
  database: string;
  name: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
}): string {
  const dbName = settings.name.replace(/-/g, '_');
  switch (settings.database) {
    case 'sqlite':
      return 'file:./prisma/dev.db';
    case 'mysql':
      return `mysql://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort}/${dbName}`;
    case 'postgresql':
    default:
      return `postgresql://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort}/${dbName}`;
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
      ...(entity.authOverride && entity.authOverride !== 'default' ? { authOverride: entity.authOverride } : {}),
    };
  });

  // Build modules array from toggle flags
  const schemaModules: Array<{ name: string; enabled: boolean; options: Record<string, unknown> }> = [];
  if (modules.authJwt) {
    const options: Record<string, unknown> = {};
    if (modules.seedUsers?.length) {
      options.seedUsers = modules.seedUsers.map((u) => ({
        email: u.email,
        password: u.password,
        ...(Object.keys(u.extraFields).length > 0 ? u.extraFields : {}),
      }));
    }
    // Resolve auth entity name from ID; only write if non-default
    if (modules.authEntityId) {
      const authEntity = entities.find((e) => e.id === modules.authEntityId);
      if (authEntity && authEntity.name !== 'User') {
        options.entityName = authEntity.name;
      }
    }
    schemaModules.push({ name: 'auth-jwt', enabled: true, options });
  }
  if (modules.cache) {
    const options: Record<string, unknown> = {};
    if (modules.cacheTtl !== 300) options.ttl = modules.cacheTtl;
    if (modules.cacheMaxItems !== 100) options.maxItems = modules.cacheMaxItems;
    schemaModules.push({ name: 'cache', enabled: true, options });
  }
  if (modules.queues) {
    const options: Record<string, unknown> = {};
    if (modules.queuesName !== 'default') options.queueName = modules.queuesName;
    if (modules.queuesConcurrency !== 5) options.concurrency = modules.queuesConcurrency;
    schemaModules.push({ name: 'queues', enabled: true, options });
  }
  if (modules.fileStorage) {
    const options: Record<string, unknown> = {};
    if (modules.fileStorageProvider !== 'minio') options.provider = modules.fileStorageProvider;
    if (modules.fileStorageBucket !== 'uploads') options.bucket = modules.fileStorageBucket;
    if (modules.fileStorageMaxSize !== 5) options.maxFileSize = modules.fileStorageMaxSize;
    schemaModules.push({ name: 'file-storage', enabled: true, options });
  }
  if (modules.websockets) {
    const options: Record<string, unknown> = {};
    if (modules.websocketsNamespace !== '/') options.namespace = modules.websocketsNamespace;
    schemaModules.push({ name: 'websockets', enabled: true, options });
  }
  if (modules.search) {
    schemaModules.push({ name: 'search', enabled: true, options: {} });
  }
  if (modules.authOAuth && modules.authJwt) {
    const options: Record<string, unknown> = {};
    if (modules.authOAuthProviders.length > 0) options.providers = modules.authOAuthProviders;
    schemaModules.push({ name: 'auth-oauth', enabled: true, options });
  }
  if (modules.authKeycloak && !modules.authJwt) {
    const options: Record<string, unknown> = {};
    if (modules.authKeycloakRealm !== 'master') options.realm = modules.authKeycloakRealm;
    if (modules.authKeycloakServerUrl !== 'http://localhost:8080') options.authServerUrl = modules.authKeycloakServerUrl;
    if (modules.authKeycloakClientId !== 'nestjs-app') options.clientId = modules.authKeycloakClientId;
    schemaModules.push({ name: 'auth-keycloak', enabled: true, options });
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
      databaseUrl: buildDatabaseUrl(settings),
      dbHost: settings.dbHost,
      dbPort: settings.dbPort,
      dbUser: settings.dbUser,
      dbPassword: settings.dbPassword,
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
