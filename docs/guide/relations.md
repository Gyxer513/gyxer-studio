# Relations

Gyxer supports three relation types between entities.

## Relation Types

### One-to-Many (1:N)

The most common type. One record has many related records.

```json
// User has many Posts
{ "name": "posts", "type": "one-to-many", "target": "Post", "onDelete": "CASCADE" }

// Post belongs to User (with foreign key)
{ "name": "author", "type": "one-to-many", "target": "User", "foreignKey": "authorId" }
```

Generated Prisma:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

### One-to-One (1:1)

One record is linked to exactly one other record.

```json
{ "name": "profile", "type": "one-to-one", "target": "Profile", "foreignKey": "userId" }
```

The side with `foreignKey` gets a `@unique` constraint on the FK column.

### Many-to-Many (N:M)

Both sides have arrays. Prisma creates an implicit join table.

```json
{ "name": "tags", "type": "many-to-many", "target": "Tag" }
```

Generated Prisma:

```prisma
model Post {
  tags Tag[]
}

model Tag {
  posts Post[]
}
```

## OnDelete Actions

| Action | Behavior |
|--------|----------|
| `CASCADE` | Delete related records (default) |
| `SET_NULL` | Set foreign key to null |
| `RESTRICT` | Prevent deletion if related records exist |
| `NO_ACTION` | Database handles it (similar to RESTRICT) |

## Foreign Key

The `foreignKey` property specifies which side holds the FK column:

- **With `foreignKey`** — this entity gets an FK column (e.g., `authorId Int`)
- **Without `foreignKey`** — this entity holds the array side of the relation

::: tip
In a 1:N relation, define the relation on **both** entities: the "one" side without `foreignKey` (array), and the "many" side with `foreignKey` (column).
:::

## Visual Editor

In the editor:

1. Drag from a connection handle on one entity to another
2. Click the edge label to configure the relation
3. Options: type, onDelete action, foreign key name
4. Delete a relation from the edge context or the right panel

## Validation

- The `target` must reference an existing entity name in the project
- Entity names and relation targets are cross-validated on generation
- Invalid targets produce a validation error
