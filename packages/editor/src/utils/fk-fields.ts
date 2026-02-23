import type { EntityData, RelationData } from '../store/project-store';

export interface ComputedFkField {
  name: string;
  /** Name of the entity this FK points to. */
  targetEntityName: string;
}

/**
 * Compute FK (foreign key) fields for a given entity based on relations.
 * Mirrors the logic from @gyxer-studio/generator's collectFkFields (dto.generator.ts).
 *
 * Rules:
 *   - one-to-many: FK goes on the TARGET (many) side.
 *   - one-to-one with explicit foreignKey: FK goes on the SOURCE.
 *   - one-to-one without foreignKey: FK goes on the TARGET.
 *   - many-to-many: no FK on either side (join table).
 */
export function computeFkFields(
  entityId: string,
  entities: EntityData[],
  relations: RelationData[],
): ComputedFkField[] {
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) return [];

  const fkFields: ComputedFkField[] = [];
  const existingNames = new Set(entity.fields.map((f) => f.name));

  // 1. Relations where this entity is SOURCE with type one-to-one + explicit foreignKey
  //    (this entity owns the FK column)
  for (const rel of relations) {
    if (rel.sourceEntityId !== entityId) continue;
    if (rel.type === 'one-to-many') continue; // FK goes on target
    if (rel.type === 'many-to-many') continue; // no FK

    if (rel.type === 'one-to-one' && rel.foreignKey && !existingNames.has(rel.foreignKey)) {
      const targetEntity = entities.find((e) => e.id === rel.targetEntityId);
      if (targetEntity) {
        fkFields.push({ name: rel.foreignKey, targetEntityName: targetEntity.name });
        existingNames.add(rel.foreignKey);
      }
    }
  }

  // 2. Relations where this entity is TARGET (other entity points here)
  for (const rel of relations) {
    if (rel.targetEntityId !== entityId) continue;

    const sourceEntity = entities.find((e) => e.id === rel.sourceEntityId);
    if (!sourceEntity) continue;

    // Skip if this entity already has a back-reference relation to the source
    const hasBackRef = relations.some(
      (r) => r.sourceEntityId === entityId && r.targetEntityId === rel.sourceEntityId,
    );
    if (hasBackRef) continue;

    const sourceName = sourceEntity.name.charAt(0).toLowerCase() + sourceEntity.name.slice(1);

    if (rel.type === 'one-to-many') {
      // Source is "one" side -> this entity is "many" side -> needs FK
      const fk = rel.foreignKey || `${sourceName}Id`;
      if (!existingNames.has(fk)) {
        fkFields.push({ name: fk, targetEntityName: sourceEntity.name });
        existingNames.add(fk);
      }
    } else if (rel.type === 'one-to-one' && !rel.foreignKey) {
      // Source has optional ref -> this entity needs FK
      const fk = `${sourceName}Id`;
      if (!existingNames.has(fk)) {
        fkFields.push({ name: fk, targetEntityName: sourceEntity.name });
        existingNames.add(fk);
      }
    }
    // many-to-many -> no FK on either side (join table)
    // one-to-one WITH foreignKey -> source owns FK, not this entity
  }

  return fkFields;
}
