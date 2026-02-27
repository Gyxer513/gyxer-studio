import { create } from 'zustand';

// ─── Types (local, matching @gyxer-studio/schema) ─────────

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

export type AuthOverride = 'default' | 'public' | 'protected';

export interface SeedUser {
  email: string;
  password: string;
  extraFields: Record<string, string | number | boolean>;
}

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
  authOverride?: AuthOverride;
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
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  enableSwagger: boolean;
  enableCors: boolean;
  enableHelmet: boolean;
  enableRateLimit: boolean;
  docker: boolean;
}

export interface ModulesConfig {
  authJwt: boolean;
  seedUsers: SeedUser[];
}

// ─── Store ──────────────────────────────────────────

interface ProjectStore {
  entities: EntityData[];
  relations: RelationData[];
  settings: ProjectSettings;
  modules: ModulesConfig;
  selectedEntityId: string | null;
  selectedRelationId: string | null;

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
  selectRelation: (id: string | null) => void;

  // Selection
  clearSelection: () => void;

  // Auth helper
  addUserEntity: () => void;

  // Import
  importProject: (json: any) => void;

  // Settings & modules
  updateSettings: (data: Partial<ProjectSettings>) => void;
  toggleModule: (module: keyof ModulesConfig, enabled: boolean) => void;

  // Seed users
  addSeedUser: () => void;
  updateSeedUser: (index: number, data: Partial<SeedUser>) => void;
  removeSeedUser: (index: number) => void;
  updateSeedUserExtra: (index: number, field: string, value: string | number | boolean) => void;
}

let entityCounter = 0;
let relationCounter = 0;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  entities: [],
  relations: [],
  selectedEntityId: null,
  selectedRelationId: null,
  settings: {
    name: 'my-app',
    description: '',
    port: 3000,
    database: 'postgresql',
    dbHost: 'localhost',
    dbPort: 5432,
    dbUser: 'postgres', // pragma: allowlist secret
    dbPassword: 'postgres', // pragma: allowlist secret
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    docker: true,
  },
  modules: {
    authJwt: false,
    seedUsers: [{ email: 'admin@example.com', password: 'password123', extraFields: {} }], // pragma: allowlist secret
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
    set((state) => ({
      entities: [...state.entities, newEntity],
      selectedEntityId: newEntity.id,
    }));
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

  selectEntity: (id) => set({ selectedEntityId: id, selectedRelationId: null }),

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
      selectedRelationId: state.selectedRelationId === id ? null : state.selectedRelationId,
    }));
  },

  selectRelation: (id) => set({ selectedRelationId: id, selectedEntityId: null }),

  clearSelection: () => set({ selectedEntityId: null, selectedRelationId: null }),

  addUserEntity: () => {
    const state = get();
    if (state.entities.some((e) => e.name === 'User')) return;
    entityCounter++;
    const newEntity: EntityData = {
      id: `entity-${entityCounter}`,
      name: 'User',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true, index: true },
        { name: 'name', type: 'string', required: true, unique: false, index: false },
      ],
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    };
    set((s) => ({
      entities: [...s.entities, newEntity],
      selectedEntityId: newEntity.id,
    }));
  },

  importProject: (json: any) => {
    try {
      const ts = Date.now();

      // Build entities with IDs and positions
      const entities: EntityData[] = (json.entities || []).map((e: any, i: number) => ({
        id: e.id || `entity-${ts}-${i}`,
        name: e.name || `Entity${i + 1}`,
        fields: (e.fields || []).map((f: any) => ({
          name: f.name || 'field',
          type: f.type || 'string',
          required: f.required ?? true,
          unique: f.unique ?? false,
          index: f.index ?? false,
          default: f.default,
          enumValues: f.enumValues,
        })),
        position: e.position || { x: 100 + (i % 3) * 350, y: 100 + Math.floor(i / 3) * 300 },
        ...(e.authOverride ? { authOverride: e.authOverride } : {}),
      }));

      // Build a name → id lookup for resolving relations
      const nameToId: Record<string, string> = {};
      entities.forEach((e) => { nameToId[e.name] = e.id; });

      // Extract relations — they can be top-level OR embedded in entities
      const relations: RelationData[] = [];
      let relCounter = 0;

      if (json.relations && Array.isArray(json.relations)) {
        // Top-level relations array (store format)
        for (const r of json.relations) {
          relCounter++;
          relations.push({
            id: r.id || `relation-${ts}-${relCounter}`,
            name: r.name || '',
            type: r.type || 'one-to-many',
            sourceEntityId: r.sourceEntityId || '',
            targetEntityId: r.targetEntityId || '',
            foreignKey: r.foreignKey,
            onDelete: r.onDelete || 'CASCADE',
          });
        }
      } else {
        // Relations embedded in entities (exported schema format)
        for (const entity of entities) {
          const jsonEntity = (json.entities || []).find((e: any) => e.name === entity.name);
          if (!jsonEntity?.relations) continue;
          for (const r of jsonEntity.relations) {
            relCounter++;
            const targetId = nameToId[r.target] || '';
            if (!targetId) continue;
            relations.push({
              id: `relation-${ts}-${relCounter}`,
              name: r.name || `${r.target?.toLowerCase() || 'rel'}s`,
              type: r.type || 'one-to-many',
              sourceEntityId: entity.id,
              targetEntityId: targetId,
              foreignKey: r.foreignKey,
              onDelete: r.onDelete || 'CASCADE',
            });
          }
        }
      }

      const db = json.settings?.database || 'postgresql';
      const settings: ProjectSettings = {
        name: json.settings?.name || json.name || 'my-app',
        description: json.settings?.description || json.description || '',
        port: json.settings?.port || 3000,
        database: db,
        dbHost: json.settings?.dbHost || (db === 'sqlite' ? '' : 'localhost'),
        dbPort: json.settings?.dbPort || (db === 'mysql' ? 3306 : db === 'sqlite' ? 0 : 5432),
        dbUser: json.settings?.dbUser || (db === 'mysql' ? 'root' : db === 'sqlite' ? '' : 'postgres'), // pragma: allowlist secret
        dbPassword: json.settings?.dbPassword || (db === 'mysql' ? 'root' : db === 'sqlite' ? '' : 'postgres'), // pragma: allowlist secret
        enableSwagger: json.settings?.enableSwagger ?? true,
        enableCors: json.settings?.enableCors ?? true,
        enableHelmet: json.settings?.enableHelmet ?? true,
        enableRateLimit: json.settings?.enableRateLimit ?? true,
        docker: json.settings?.docker ?? true,
      };

      // Handle modules — can be array (schema format) or object (store format)
      let authJwt = false;
      let seedUsers: SeedUser[] = [{ email: 'admin@example.com', password: 'password123', extraFields: {} }]; // pragma: allowlist secret
      if (Array.isArray(json.modules)) {
        const authMod = json.modules.find((m: any) => m.name === 'auth-jwt' && m.enabled);
        authJwt = !!authMod;
        if (authMod?.options?.seedUsers?.length) {
          seedUsers = (authMod.options.seedUsers as any[]).map((u: any) => ({
            email: u.email || '',
            password: u.password || '',
            extraFields: u.extraFields || {},
          }));
        }
      } else if (json.modules && typeof json.modules === 'object') {
        authJwt = json.modules.authJwt ?? false;
        if (json.modules.seedUsers?.length) {
          seedUsers = json.modules.seedUsers;
        }
      }
      const modules: ModulesConfig = { authJwt, seedUsers };

      // Update counters to avoid ID conflicts
      entityCounter = entities.length;
      relationCounter = relCounter;

      set({
        entities,
        relations,
        settings,
        modules,
        selectedEntityId: null,
        selectedRelationId: null,
      });
    } catch (err) {
      console.error('Failed to import project:', err);
    }
  },

  // ── Settings ────────────────────────────────────

  updateSettings: (data) => {
    set((state) => {
      let merged = { ...state.settings, ...data };

      // When database type changes, set sensible defaults
      if (data.database && data.database !== state.settings.database) {
        const dbDefaults: Record<string, { dbHost: string; dbPort: number; dbUser: string; dbPassword: string }> = {
          postgresql: { dbHost: 'localhost', dbPort: 5432, dbUser: 'postgres', dbPassword: 'postgres' }, // pragma: allowlist secret
          mysql: { dbHost: 'localhost', dbPort: 3306, dbUser: 'root', dbPassword: 'root' }, // pragma: allowlist secret
          sqlite: { dbHost: '', dbPort: 0, dbUser: '', dbPassword: '' },
        };
        merged = { ...merged, ...dbDefaults[data.database] };
      }

      return { settings: merged };
    });
  },

  toggleModule: (module, enabled) => {
    set((state) => ({
      modules: { ...state.modules, [module]: enabled },
    }));
    // Auto-create User entity when auth-jwt is enabled
    if (module === 'authJwt' && enabled) {
      const state = get();
      if (!state.entities.some((e) => e.name === 'User')) {
        state.addUserEntity();
      }
    }
  },

  // ── Seed Users ────────────────────────────────

  addSeedUser: () => {
    set((state) => ({
      modules: {
        ...state.modules,
        seedUsers: [...state.modules.seedUsers, { email: '', password: '', extraFields: {} }],
      },
    }));
  },

  updateSeedUser: (index, data) => {
    set((state) => ({
      modules: {
        ...state.modules,
        seedUsers: state.modules.seedUsers.map((u, i) => (i === index ? { ...u, ...data } : u)),
      },
    }));
  },

  removeSeedUser: (index) => {
    set((state) => ({
      modules: {
        ...state.modules,
        seedUsers: state.modules.seedUsers.filter((_, i) => i !== index),
      },
    }));
  },

  updateSeedUserExtra: (index, field, value) => {
    set((state) => ({
      modules: {
        ...state.modules,
        seedUsers: state.modules.seedUsers.map((u, i) =>
          i === index ? { ...u, extraFields: { ...u.extraFields, [field]: value } } : u,
        ),
      },
    }));
  },
}));
