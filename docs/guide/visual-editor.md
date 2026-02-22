# Visual Editor

The Gyxer visual editor is a browser-based tool for designing backend data models.

## Layout

The editor has three areas:

- **Toolbar** (top) — Add Entity, Import/Export JSON, Generate, theme toggle, language switch
- **Canvas** (center) — React Flow canvas with draggable entity cards
- **Right Panel** (right) — Schema editor or HTTP client, toggled via tabs

## Working with Entities

### Adding Entities

Click **Add Entity** in the toolbar. A new entity card appears on the canvas with a default `name` field.

### Editing Entity Details

Click an entity card to select it. The right panel shows:

- **Entity name** — must be PascalCase (e.g., `Product`, `OrderItem`)
- **Fields list** — each field has name, type, and options
- **Add field** button

### Entity Card

Each card displays:
- Entity name in the header
- List of fields with type badges
- Connection handles on left and right edges for creating relations

### Deleting Entities

Select an entity and click the delete button. All associated relations are removed automatically.

## Working with Fields

Each field has these properties:

| Property | Description |
|----------|------------|
| **Name** | Valid identifier (`camelCase` recommended) |
| **Type** | One of [9 field types](/guide/field-types) |
| **Required** | Is the field required? (default: true) |
| **Unique** | Unique constraint (default: false) |
| **Index** | Database index (default: false) |
| **Default** | Optional default value |
| **Enum Values** | Required for `enum` type |

## Creating Relations

1. Drag from an entity's connection handle to another entity
2. A relation edge appears between them
3. Click the edge to configure:
   - **Type** — one-to-one, one-to-many, many-to-many
   - **On Delete** — CASCADE, SET_NULL, RESTRICT, NO_ACTION
   - **Foreign Key** — custom FK column name

See [Relations](/guide/relations) for details.

## Import / Export

### Export JSON

Click **Export JSON** in the toolbar to download the current project as a `.json` file compatible with `@gyxer/schema`.

### Import JSON

Click **Import JSON** to load a previously exported schema. Supports both:
- Schema format (relations inside entities)
- Editor store format (relations as a top-level array)

## Generation

Click **Generate** to create your NestJS project:

- **To folder...** — writes files directly to a directory (Chromium browsers with File System Access API)
- **Download ZIP** — downloads the project as a ZIP archive (works in all browsers)

The schema is validated before generation. Errors are shown if validation fails.

## Tabs

The right panel has two tabs:

- **Schema** — entity and relation editing (default)
- **HTTP** — built-in [HTTP client](/guide/http-client) for testing APIs

## Theme & Language

- **Dark mode** — toggle in the toolbar, persisted to localStorage
- **Language** — switch between English and Russian
