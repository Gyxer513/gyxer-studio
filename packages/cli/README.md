# @gyxer-studio/cli

CLI tool for generating production-ready NestJS projects from Gyxer schema configs.

## Usage

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
- `./examples/`
- Current directory

```bash
# If my-app.json exists in ./configs/
gyxer generate my-app
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

## Part of [Gyxer Studio](https://github.com/Gyxer513/gyxer-studio)

MIT License
