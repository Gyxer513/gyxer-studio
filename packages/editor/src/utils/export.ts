import { useProjectStore } from '../store/project-store';

/**
 * Export the current editor state to a @gyxer/schema-compatible JSON object.
 */
export function exportToSchema(): Record<string, unknown> {
  const { entities, relations, settings } = useProjectStore.getState();

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

  return {
    name: settings.name,
    version: '0.1.0',
    description: settings.description,
    entities: schemaEntities,
    modules: [],
    settings: {
      port: settings.port,
      database: settings.database,
      enableSwagger: settings.enableSwagger,
      enableCors: settings.enableCors,
      enableHelmet: settings.enableHelmet,
      enableRateLimit: settings.enableRateLimit,
      docker: settings.docker,
    },
  };
}
