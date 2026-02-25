import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { parseProjectJson } from '@gyxer-studio/schema';
import { generateProject } from '@gyxer-studio/generator';

interface GenerateOptions {
  output?: string;
}

/**
 * Search for config files in known locations:
 * - ./configs/
 * - Current directory (.json files, excluding package.json / tsconfig)
 */
function findConfigFiles(): { name: string; path: string; modified: Date }[] {
  const configs: { name: string; path: string; modified: Date }[] = [];

  // 1. Look in configs/ directory (relative to cwd)
  const configsDir = path.resolve('configs');
  if (fs.existsSync(configsDir)) {
    const files = fs.readdirSync(configsDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(configsDir, file);
      const stat = fs.statSync(filePath);
      configs.push({ name: file, path: filePath, modified: stat.mtime });
    }
  }

  // 2. Look in current directory for .json files (root level only)
  const cwdFiles = fs.readdirSync(process.cwd()).filter(
    (f) =>
      f.endsWith('.json') &&
      !f.startsWith('package') &&
      !f.startsWith('tsconfig') &&
      f !== '.gitkeep',
  );
  for (const file of cwdFiles) {
    const filePath = path.resolve(file);
    // Avoid duplicates if configs/ is in cwd
    if (!configs.some((c) => c.path === filePath)) {
      const stat = fs.statSync(filePath);
      configs.push({ name: file, path: filePath, modified: stat.mtime });
    }
  }

  // Sort by modification date (newest first)
  configs.sort((a, b) => b.modified.getTime() - a.modified.getTime());

  return configs;
}

/**
 * Interactive config selection — called when no schema path is provided.
 */
async function selectConfigInteractive(): Promise<string> {
  console.log('');
  console.log(chalk.bold('  \u26A1 Gyxer Generator'));
  console.log(chalk.dim('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550'));
  console.log('');

  const configs = findConfigFiles();

  if (configs.length === 0) {
    console.log(chalk.yellow('  \u26A0 No config files found.'));
    console.log('');
    console.log(chalk.dim('  Place .json configs in one of these locations:'));
    console.log(chalk.cyan('    ./configs/*.json'));
    console.log(chalk.cyan('    ./*.json'));
    console.log('');
    console.log(chalk.dim('  Or specify a path directly:'));
    console.log(chalk.cyan('    gyxer generate <path-to-schema.json>'));
    console.log('');
    process.exit(1);
  }

  console.log(chalk.dim(`  Found ${configs.length} config(s):`));
  console.log('');

  const choices = configs.map((c) => {
    const relPath = path.relative(process.cwd(), c.path);
    const date = c.modified.toLocaleString();
    return {
      name: `${c.name}  ${chalk.dim(`\u2014 ${relPath}  (${date})`)}`,
      value: c.path,
    };
  });

  const { selectedConfig } = await inquirer.prompt<{ selectedConfig: string }>([
    {
      type: 'list',
      name: 'selectedConfig',
      message: 'Select a config to generate:',
      choices,
    },
  ]);

  return selectedConfig;
}

export async function generateCommand(schemaPath: string | undefined, options: GenerateOptions) {
  // If no schema path provided — interactive selection
  const resolvedPath = schemaPath
    ? path.resolve(schemaPath)
    : await selectConfigInteractive();

  if (schemaPath) {
    console.log('');
    console.log(chalk.bold('  \u26A1 Gyxer Generator'));
    console.log(chalk.dim('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550'));
    console.log('');
  }

  // Read schema file
  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`  \u2716 Schema file not found: ${resolvedPath}`));
    process.exit(1);
  }

  const json = fs.readFileSync(resolvedPath, 'utf-8');

  // Validate
  console.log(`  ${chalk.dim('Schema:')} ${resolvedPath}`);
  const result = parseProjectJson(json);

  if (!result.success || !result.data) {
    console.error(chalk.red('  \u2716 Validation failed:'));
    for (const err of result.errors || []) {
      console.error(chalk.red(`    \u2022 ${err.path}: ${err.message}`));
    }
    process.exit(1);
  }

  const projectName = result.data.name;
  console.log(`  ${chalk.dim('Project:')} ${projectName}`);
  console.log(`  ${chalk.dim('Entities:')} ${result.data.entities.length}`);
  console.log('');

  // Determine output directory
  const outputDir = path.resolve(options.output || `./${projectName}`);

  // If output dir exists, ask for confirmation
  if (fs.existsSync(outputDir)) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow(`Directory "${path.relative(process.cwd(), outputDir)}" already exists. Overwrite?`),
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.dim('  Cancelled.'));
      process.exit(0);
    }
    console.log('');
  }

  // Generate with spinner
  const spinner = ora('Generating project...').start();

  try {
    const genResult = await generateProject(result.data, { outputDir, silent: true });
    spinner.succeed(chalk.green('Project generated!'));

    console.log('');
    console.log(`  ${chalk.green('\u2705')} ${chalk.bold(String(genResult.filesCreated.length))} files created in ${chalk.cyan(outputDir)}`);

    // Security score
    const score = genResult.securityReport.score;
    const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.yellow('\uD83D\uDEE1\uFE0F')}  Security: ${scoreColor(`${score}%`)}`);

    console.log('');
    console.log(chalk.dim('  Next steps:'));
    console.log(chalk.cyan(`    cd ${path.relative(process.cwd(), outputDir)}`));
    console.log(chalk.cyan('    npm install'));
    console.log(chalk.cyan('    npx prisma migrate dev --name init'));
    console.log(chalk.cyan('    npm run start:dev'));
    console.log('');
    console.log(chalk.dim(`  📖 Docs: ${chalk.blue('https://gyxer513.github.io/gyxer-studio/')}`));
  } catch (error) {
    spinner.fail(chalk.red('Generation failed'));
    console.error(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
