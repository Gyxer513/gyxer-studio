# CLI

The Gyxer CLI provides commands for visual editing, project generation, and schema validation.

## Quick Start

No installation needed — run directly with `npx`:

```bash
npx @gyxer-studio/cli editor      # visual editor
npx @gyxer-studio/cli new my-app  # interactive wizard
npx @gyxer-studio/cli generate config.json -o ./out  # generate from config
npx @gyxer-studio/cli validate config.json  # validate schema
```

## Commands

### `gyxer editor`

Opens the visual schema editor in your browser.

```bash
npx @gyxer-studio/cli editor
npx @gyxer-studio/cli editor --port 3000  # custom port
```

- Serves the editor at `http://localhost:4200`
- Configs save to `./configs/` in your working directory
- Auto-opens the browser

### `gyxer new <name>`

Interactive wizard for creating a new project.

```bash
npx @gyxer-studio/cli new my-app
```

The wizard asks 7 questions:

| # | Question | Type | Default |
|---|----------|------|---------|
| 1 | Database | PostgreSQL / MySQL / SQLite | PostgreSQL |
| 2 | Port | Number | 3000 |
| 3 | Enable Swagger? | Yes / No | Yes |
| 4 | Enable JWT Auth? | Yes / No | No |
| 5 | Enable Docker? | Yes / No | Yes |
| 6 | Enable Helmet? | Yes / No | Yes |
| 7 | Enable Rate Limit? | Yes / No | Yes |

After answering, the wizard:
1. Creates a project with a `User` entity (email, name, isActive)
2. Applies the selected settings and modules
3. Shows a spinner during generation
4. Reports the number of generated files and security score

#### Example Session

```
  🚀 Gyxer — New Project
  ══════════════════════

? Database: PostgreSQL
? Port: 3000
? Enable Swagger? Yes
? Enable JWT Auth? Yes
? Enable Docker? Yes
? Enable Helmet? Yes
? Enable Rate Limit? Yes

✔ Project generated!

  ✅ Project "my-app" created!
  📁 /path/to/my-app — 35 files
  🛡️  Security: 100%

  Next steps:
    cd my-app
    npm install
    npx prisma migrate dev --name init
    npm run start:dev
```

#### Project Name Rules

- Must be kebab-case: `my-app`, `blog-api`, `e-commerce`
- Regex: `^[a-z][a-z0-9-]*$`
- Target directory must not already exist

#### Database URL

Auto-generated based on database type and project name:

| Database | Generated URL |
|----------|--------------|
| PostgreSQL | `postgresql://postgres:postgres@localhost:5432/{name}` |
| MySQL | `mysql://root:root@localhost:3306/{name}` |
| SQLite | `file:./{name}.db` |

Hyphens in project name are replaced with underscores for the database name.

### `gyxer generate [schema]`

Generate a project from a JSON schema file. If no path is provided, the CLI searches for configs in `./configs/` and the current directory and offers interactive selection.

```bash
npx @gyxer-studio/cli generate configs/blog.json -o my-blog
npx @gyxer-studio/cli generate   # interactive file selection
```

Options:

| Flag | Default | Description |
|------|---------|-------------|
| `-o, --output <dir>` | `./<project-name>` | Output directory |

#### Example

```bash
npx @gyxer-studio/cli generate examples/blog-with-auth.json -o my-blog
```

```
  ⚡ Gyxer Generator
  ═════════════════

  Schema: /path/to/examples/blog-with-auth.json
  Project: blog-api
  Entities: 3

✔ Project generated!

  ✅ 35 files created in /path/to/my-blog
  🛡️  Security: 100%
```

### `gyxer validate <schema>`

Validate a JSON schema file without generating any code. Useful for checking configs before generation or in CI pipelines.

```bash
npx @gyxer-studio/cli validate configs/my-app.json
```

#### Valid schema

```
  🔍 Gyxer Validator
  ═════════════════

  File: configs/my-app.json

  ✔ Schema is valid!

    Project:   my-app v0.1.0
    Entities:  3
    Fields:    12
    Relations: 3
    Modules:   auth-jwt
    Database:  postgresql
    Docker:    yes
```

#### Invalid schema

```
  🔍 Gyxer Validator
  ═════════════════

  File: bad-config.json

  ✖ Validation failed (2 errors):

    • entities.User.fields.status — Enum field "status" must have enumValues
    • entities.Order.relations.items — Relation "items" targets unknown entity "LineItem"
```

Exit codes: `0` = valid, `1` = invalid or file not found.

## Technology

The CLI uses:
- [Commander.js](https://github.com/tj/commander.js/) — command parsing
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [Chalk](https://github.com/chalk/chalk) — styled terminal output
- [Ora](https://github.com/sindresorhus/ora) — loading spinners
- [sirv](https://github.com/lukeed/sirv) — static file serving (editor command)
