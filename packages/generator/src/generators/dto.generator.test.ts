import { describe, it, expect } from 'vitest';
import { generateCreateDto, generateUpdateDto, collectFkFields } from './dto.generator.js';
import type { GyxerProject, Entity } from '@gyxer/schema';

const baseProject: GyxerProject = {
  name: 'test-app',
  version: '0.1.0',
  description: 'Test',
  entities: [],
  modules: [],
  settings: {
    port: 3000,
    database: 'postgresql',
    databaseUrl: 'postgresql://localhost:5432/test',
    enableSwagger: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: false,
    docker: false,
  },
};

function makeProject(entities: Entity[], modules: GyxerProject['modules'] = []): GyxerProject {
  return { ...baseProject, entities, modules };
}

// ─── collectFkFields ───────────────────────────────────────────

describe('collectFkFields', () => {
  it('should collect FK from inverse one-to-many relation', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([user, post]);
    const fks = collectFkFields(post, project);

    expect(fks).toHaveLength(1);
    expect(fks[0].name).toBe('authorId');
    expect(fks[0].targetEntity).toBe('User');
  });

  it('should use default FK name when foreignKey not specified', () => {
    const category: Entity = {
      name: 'Category',
      fields: [{ name: 'name', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'products', target: 'Product', type: 'one-to-many', onDelete: 'CASCADE' }],
    };
    const product: Entity = {
      name: 'Product',
      fields: [{ name: 'name', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([category, product]);
    const fks = collectFkFields(product, project);

    expect(fks).toHaveLength(1);
    expect(fks[0].name).toBe('categoryId');
  });

  it('should NOT add FK on the "one" side of one-to-many', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([user, post]);
    const fks = collectFkFields(user, project);

    expect(fks).toHaveLength(0);
  });

  it('should skip inverse FK if entity already has a back-reference relation', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [{ name: 'author', target: 'User', type: 'one-to-one', foreignKey: 'userId' }],
    };
    const project = makeProject([user, post]);
    const fks = collectFkFields(post, project);

    // Post has its own one-to-one relation creating userId FK from step 1.
    // The inverse FK from User→Post (authorId) should NOT be added because Post already
    // has a back-reference to User.
    expect(fks).toHaveLength(1);
    expect(fks[0].name).toBe('userId');
    // Should NOT have authorId (inverse from User's one-to-many was skipped)
    expect(fks.find((f) => f.name === 'authorId')).toBeUndefined();
  });

  it('should not duplicate FK if field already exists', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'authorId', type: 'int', required: true, unique: false, index: false },
      ],
      relations: [],
    };
    const project = makeProject([user, post]);
    const fks = collectFkFields(post, project);

    expect(fks).toHaveLength(0);
  });
});

// ─── generateCreateDto ─────────────────────────────────────────

describe('generateCreateDto', () => {
  it('should generate DTO with required string fields', () => {
    const entity: Entity = {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'content', type: 'text', required: true, unique: false, index: false },
      ],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('export class CreatePostDto');
    expect(dto).toContain('@ApiProperty()');
    expect(dto).toContain('@IsString()');
    expect(dto).toContain('@IsNotEmpty()');
    expect(dto).toContain('title: string;');
    expect(dto).toContain('content: string;');
  });

  it('should mark optional fields with ?', () => {
    const entity: Entity = {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'bio', type: 'text', required: false, unique: false, index: false },
      ],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('bio?: string;');
    expect(dto).toContain('ApiPropertyOptional');
    expect(dto).toContain('@IsOptional()');
  });

  it('should handle int fields', () => {
    const entity: Entity = {
      name: 'Product',
      fields: [{ name: 'stock', type: 'int', required: true, unique: false, index: false }],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('@IsInt()');
    expect(dto).toContain('stock: number;');
  });

  it('should handle float fields', () => {
    const entity: Entity = {
      name: 'Product',
      fields: [{ name: 'price', type: 'float', required: true, unique: false, index: false }],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('@IsNumber()');
    expect(dto).toContain('price: number;');
  });

  it('should handle boolean fields', () => {
    const entity: Entity = {
      name: 'User',
      fields: [
        { name: 'isActive', type: 'boolean', required: true, unique: false, index: false, default: true },
      ],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('@IsBoolean()');
    expect(dto).toContain('isActive: boolean;');
    expect(dto).toContain('default: true');
  });

  it('should handle enum fields', () => {
    const entity: Entity = {
      name: 'Order',
      fields: [
        {
          name: 'status',
          type: 'enum',
          required: true,
          unique: false,
          index: false,
          enumValues: ['PENDING', 'PAID', 'SHIPPED'],
        },
      ],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('@IsIn(');
    expect(dto).toContain("'PENDING'");
    expect(dto).toContain("'SHIPPED'");
    expect(dto).toContain('@prisma/client');
    expect(dto).toContain('OrderStatus');
  });

  it('should handle datetime fields', () => {
    const entity: Entity = {
      name: 'Event',
      fields: [{ name: 'startDate', type: 'datetime', required: true, unique: false, index: false }],
      relations: [],
    };
    const dto = generateCreateDto(entity, makeProject([entity]));

    expect(dto).toContain('@IsDateString()');
    expect(dto).toContain('startDate: string;');
  });

  it('should include FK fields from inverse relations', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([user, post]);
    const dto = generateCreateDto(post, project);

    expect(dto).toContain('authorId: number;');
    expect(dto).toContain("FK to User");
    expect(dto).toContain('@IsInt()');
  });

  it('should add password field for User with auth-jwt', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [],
    };
    const project = makeProject([user], [{ name: 'auth-jwt', enabled: true, options: {} }]);
    const dto = generateCreateDto(user, project);

    expect(dto).toContain('password: string;');
    expect(dto).toContain('will be hashed');
  });

  it('should NOT add password field for non-User entity with auth-jwt', () => {
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([post], [{ name: 'auth-jwt', enabled: true, options: {} }]);
    const dto = generateCreateDto(post, project);

    expect(dto).not.toContain('password');
  });
});

// ─── generateUpdateDto ─────────────────────────────────────────

describe('generateUpdateDto', () => {
  it('should make all fields optional', () => {
    const entity: Entity = {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', required: true, unique: false, index: false },
        { name: 'content', type: 'text', required: true, unique: false, index: false },
      ],
      relations: [],
    };
    const dto = generateUpdateDto(entity, makeProject([entity]));

    expect(dto).toContain('export class UpdatePostDto');
    expect(dto).toContain('title?: string;');
    expect(dto).toContain('content?: string;');
    expect(dto).toContain('@IsOptional()');
    expect(dto).toContain('ApiPropertyOptional');
    expect(dto).not.toContain('@ApiProperty(');
  });

  it('should make FK fields optional in update DTO', () => {
    const user: Entity = {
      name: 'User',
      fields: [{ name: 'email', type: 'string', required: true, unique: true, index: false }],
      relations: [{ name: 'posts', target: 'Post', type: 'one-to-many', foreignKey: 'authorId', onDelete: 'CASCADE' }],
    };
    const post: Entity = {
      name: 'Post',
      fields: [{ name: 'title', type: 'string', required: true, unique: false, index: false }],
      relations: [],
    };
    const project = makeProject([user, post]);
    const dto = generateUpdateDto(post, project);

    expect(dto).toContain('authorId?: number;');
  });
});
