import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { generateProject } from '@gyxer/generator';
import type { GyxerProject, ModuleConfig } from '@gyxer/schema';

/** Build a database URL based on database type and project name. */
function buildDatabaseUrl(db: string, projectName: string): string {
  const dbName = projectName.replace(/-/g, '_');
  switch (db) {
    case 'postgresql':
      return `postgresql://postgres:postgres@localhost:5432/${dbName}`;
    case 'mysql':
      return `mysql://root:root@localhost:3306/${dbName}`;
    case 'sqlite':
      return `file:./${dbName}.db`;
    default:
      return `postgresql://postgres:postgres@localhost:5432/${dbName}`;
  }
}

interface WizardAnswers {
  database: 'postgresql' | 'mysql' | 'sqlite';
  port: number;
  swagger: boolean;
  authJwt: boolean;
  docker: boolean;
  helmet: boolean;
  rateLimit: boolean;
}

export async function newCommand(name: string) {
  console.log('');
  console.log(chalk.bold('  \u{1F680} Gyxer \u2014 New Project'));
  console.log(chalk.dim('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550'));
  console.log('');

  // Validate project name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(chalk.red('  \u2716 Project name must be kebab-case (e.g., "my-app")'));
    process.exit(1);
  }

  const outputDir = path.resolve(name);
  if (fs.existsSync(outputDir)) {
    console.error(chalk.red(`  \u2716 Directory "${name}" already exists`));
    process.exit(1);
  }

  // ── Interactive wizard ──────────────────────────────────
  const answers = await inquirer.prompt<WizardAnswers>([
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: [
        { name: 'PostgreSQL', value: 'postgresql' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQLite', value: 'sqlite' },
      ],
      default: 'postgresql',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Port:',
      default: 3000,
    },
    {
      type: 'confirm',
      name: 'swagger',
      message: 'Enable Swagger?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'authJwt',
      message: 'Enable JWT Auth?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'Enable Docker?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'helmet',
      message: 'Enable Helmet?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'rateLimit',
      message: 'Enable Rate Limit?',
      default: true,
    },
  ]);

  console.log('');

  // ── Build project schema ────────────────────────────────
  const modules: ModuleConfig[] = [];
  if (answers.authJwt) {
    modules.push({ name: 'auth-jwt', enabled: true, options: {} });
  }

  const project: GyxerProject = {
    name,
    version: '0.1.0',
    description: `${name} API`,
    entities: [
      {
        name: 'User',
        fields: [
          { name: 'email', type: 'string', required: true, unique: true, index: true },
          { name: 'name', type: 'string', required: true, unique: false, index: false },
          { name: 'isActive', type: 'boolean', required: true, unique: false, index: false, default: true },
        ],
        relations: [],
      },
    ],
    modules,
    settings: {
      port: answers.port || 3000,
      database: answers.database,
      databaseUrl: buildDatabaseUrl(answers.database, name),
      enableSwagger: answers.swagger,
      enableCors: true,
      enableHelmet: answers.helmet,
      enableRateLimit: answers.rateLimit,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: answers.docker,
    },
  };

  // ── Generate with spinner ───────────────────────────────
  const spinner = ora('Generating project...').start();

  try {
    const result = await generateProject(project, { outputDir, silent: true });
    spinner.succeed(chalk.green('Project generated!'));

    console.log('');
    console.log(`  ${chalk.green('\u2705')} Project ${chalk.bold(`"${name}"`)} created!`);
    console.log(`  ${chalk.blue('\u{1F4C1}')} ${outputDir} \u2014 ${chalk.bold(String(result.filesCreated.length))} files`);

    // Security score
    const score = result.securityReport.score;
    const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.yellow('\u{1F6E1}\uFE0F')}  Security: ${scoreColor(`${score}%`)}`);

    console.log('');
    console.log(chalk.dim('  Next steps:'));
    console.log(chalk.cyan(`    cd ${name}`));
    console.log(chalk.cyan('    npm install'));
    console.log(chalk.cyan('    npx prisma migrate dev --name init'));
    console.log(chalk.cyan('    npm run start:dev'));
    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Generation failed'));
    console.error(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
