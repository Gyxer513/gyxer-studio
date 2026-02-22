# CLI

The Gyxer CLI provides two commands for project generation from the terminal.

## Installation

The CLI is part of the monorepo. From the project root:

```bash
npm run build -w packages/cli
```

## Commands

### `gyxer new <name>`

Interactive wizard for creating a new project.

```bash
npx gyxer new my-app
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

### `gyxer generate <schema>`

Generate a project from an existing JSON schema file.

```bash
npx gyxer generate schema.json -o ./output
```

Options:

| Flag | Default | Description |
|------|---------|-------------|
| `-o, --output <dir>` | `./output` | Output directory |

#### Example

```bash
npx gyxer generate examples/blog-with-auth.json -o my-blog
```

```
  ⚡ Gyxer Generator
  ═════════════════

  Schema: /path/to/examples/blog-with-auth.json
  Project: my-blog-auth
  Entities: 2

✔ Project generated!

  ✅ 35 files created in /path/to/my-blog
  🛡️  Security: 100%
```

### `gyxer studio`

Opens the visual editor (coming soon — currently shows a placeholder message).

## Technology

The CLI uses:
- [Commander.js](https://github.com/tj/commander.js/) — command parsing
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [Chalk](https://github.com/chalk/chalk) — styled terminal output
- [Ora](https://github.com/sindresorhus/ora) — loading spinners
