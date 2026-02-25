# @gyxer-studio/cli

[![npm version](https://img.shields.io/npm/v/@gyxer-studio/cli?color=blue)](https://www.npmjs.com/package/@gyxer-studio/cli)
[![CI](https://github.com/Gyxer513/gyxer-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Gyxer513/gyxer-studio/actions/workflows/ci.yml)

CLI tool for generating production-ready NestJS projects from Gyxer schema configs.

## Commands

### Visual Editor

```bash
npx @gyxer-studio/cli editor
```

Opens the visual schema editor at `http://localhost:4200`. Design your data models, configure relations, then click **Generate** — the config saves to `./configs/`.

Options: `--port <number>` (default: 4200)

### Generate from config

```bash
npx @gyxer-studio/cli generate my-app.json -o ./my-app
```

Or if installed globally:

```bash
gyxer generate my-app.json -o ./my-app
```

### Interactive wizard

```bash
npx @gyxer-studio/cli new my-app
```

The wizard walks you through choosing:
- Database (PostgreSQL, MySQL, SQLite)
- Port
- Swagger
- JWT Authentication
- Docker
- Helmet & Rate Limiting

### Auto-discovery

The `generate` command automatically searches for config files in:
- `./configs/`
- Current directory

```bash
gyxer generate
# shows a list of found configs to choose from
```

## Full Workflow

```bash
# 1. Open editor — design your schema visually
npx @gyxer-studio/cli editor

# 2. Click Generate in the editor → saves to ./configs/my-app.json

# 3. Generate the NestJS project
npx @gyxer-studio/cli generate configs/my-app.json -o ./my-app

# 4. Run
cd my-app && npm install && npm run start:dev
```

## Global Installation

```bash
npm install -g @gyxer-studio/cli
```

## Example Configs

See [examples/](https://github.com/Gyxer513/gyxer-studio/tree/master/examples) for ready-to-use configs:

- `blog.json` — Blog with users, posts, comments
- `blog-with-auth.json` — Same blog + JWT authentication
- `shop.json` — E-commerce with 6 entities and enums

## Docker Alternative

Run the editor without installing Node.js:

```bash
docker run -p 4200:4200 gyxer513/studio
```

With persistent configs:

```bash
docker run -p 4200:4200 -v gyxer-configs:/data/configs gyxer513/studio
```

## Part of [Gyxer Studio](https://github.com/Gyxer513/gyxer-studio)

MIT License
