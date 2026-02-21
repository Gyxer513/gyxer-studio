import { create } from 'zustand';

// ─── Types (local, matching @gyxer/schema) ─────────

export type FieldType =
  | 'string'
  | 'int'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'enum'
  | 'json'
  | 'text'
  | 'uuid';

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface FieldData {
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  index: boolean;
  default?: string | number | boolean | null;
  enumValues?: string[];
}

export interface EntityData {
  id: string;
  name: string;
  fields: FieldData[];
  position: { x: number; y: number };
}

export interface RelationData {
  id: string;
  name: string;
  type: RelationType;
  sourceEntityId: string;
  targetEntityId: string;
  foreignKey?: string;
  onDelete: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
}

export interface ProjectSettings {
  name: string;
  description: string;
  port: number;
  database: 'postgresql' | 'mysql' | 'sqlite';
  enableSwagger: boolean;
  enableCors: boolean;
  enableHelmet: boolean;
  enableRateLimit: boolean;
  docker: boolean;
}

// ─── Store ──────────────────────────────────────────

interface ProjectStore {
  entities: EntityData[];
  relations: RelationData[];
  settings: ProjectSettings;
  selectedEntityId: string | null;

  // Entity actions
  addEntity: (position: { x: number; y: number }) => void;
  updateEntity: (id: string, data: Partial<EntityData>) => void;
  removeEntity: (id: string) => void;
  selectEntity: (id: string | null) => void;

  // Field actions
  addField: (entityId: string) => void;
  updateField: (entityId: string, fieldIndex: number, data: Partial<FieldData>) => void;
  removeField: (entityId: string, fieldIndex: number) => void;

  // Relation actions
  addRelation: (sourceId: string, targetId: string) => void;
  updateRelation: (id: string, data: Partial<RelationData>) => void;
  removeRelation: (id: string) => void;

  // Settings
  updateSettings: (data: Partial<ProjectSettings>) => void;
}

let entityCounter = 0;
let relationCounter = 0;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  entities: [],
  relations: [],
  selectedEntityId: null,
  settings: {
    name: 'my-app',
    description: '',
    port: 3000,
    database: 'postgresql',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    docker: true,
  },

  // ── Entity ──────────────────────────────────────

  addEntity: (position) => {
    entityCounter++;
    const newEntity: EntityData = {
      id: `entity-${entityCounter}`,
      name: `Entity${entityCounter}`,
      fields: [
        { name: 'name', type: 'string', required: true, unique: false, index: false },
      ],
      position,
    };
    set((state) => ({ entities: [...state.entities, newEntity] }));
  },

  updateEntity: (id, data) => {
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  },

  removeEntity: (id) => {
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relations: state.relations.filter(
        (r) => r.sourceEntityId !== id && r.targetEntityId !== id,
      ),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    }));
  },

  selectEntity: (id) => set({ selectedEntityId: id }),

  // ── Fields ──────────────────────────────────────

  addField: (entityId) => {
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        return {
          ...e,
          fields: [
            ...e.fields,
            {
              name: `field${e.fields.length + 1}`,
              type: 'string' as FieldType,
              required: true,
              unique: false,
              index: false,
            },
          ],
        };
      }),
    }));
  },

  updateField: (entityId, fieldIndex, data) => {
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        const fields = [...e.fields];
        fields[fieldIndex] = { ...fields[fieldIndex], ...data };
        return { ...e, fields };
      }),
    }));
  },

  removeField: (entityId, fieldIndex) => {
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        return { ...e, fields: e.fields.filter((_, i) => i !== fieldIndex) };
      }),
    }));
  },

  // ── Relations ───────────────────────────────────

  addRelation: (sourceId, targetId) => {
    relationCounter++;
    const source = get().entities.find((e) => e.id === sourceId);
    const target = get().entities.find((e) => e.id === targetId);
    if (!source || !target) return;

    const newRelation: RelationData = {
      id: `relation-${relationCounter}`,
      name: `${target.name.toLowerCase()}s`,
      type: 'one-to-many',
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      onDelete: 'CASCADE',
    };
    set((state) => ({ relations: [...state.relations, newRelation] }));
  },

  updateRelation: (id, data) => {
    set((state) => ({
      relations: state.relations.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  removeRelation: (id) => {
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));
  },

  // ── Settings ────────────────────────────────────

  updateSettings: (data) => {
    set((state) => ({
      settings: { ...state.settings, ...data },
    }));
  },
}));
