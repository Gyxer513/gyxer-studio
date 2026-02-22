import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { parseProjectJson } from '@gyxer/schema';
import { generateProject } from '@gyxer/generator';

interface GenerateOptions {
  output: string;
}

export async function generateCommand(schemaPath: string, options: GenerateOptions) {
  console.log('');
  console.log(chalk.bold('  \u26A1 Gyxer Generator'));
  console.log(chalk.dim('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550'));
  console.log('');

  // Read schema file
  const absolutePath = path.resolve(schemaPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`  \u2716 Schema file not found: ${absolutePath}`));
    process.exit(1);
  }

  const json = fs.readFileSync(absolutePath, 'utf-8');

  // Validate
  console.log(`  ${chalk.dim('Schema:')} ${absolutePath}`);
  const result = parseProjectJson(json);

  if (!result.success || !result.data) {
    console.error(chalk.red('  \u2716 Validation failed:'));
    for (const err of result.errors || []) {
      console.error(chalk.red(`    \u2022 ${err.path}: ${err.message}`));
    }
    process.exit(1);
  }

  console.log(`  ${chalk.dim('Project:')} ${result.data.name}`);
  console.log(`  ${chalk.dim('Entities:')} ${result.data.entities.length}`);
  console.log('');

  // Generate with spinner
  const outputDir = path.resolve(options.output);
  const spinner = ora('Generating project...').start();

  try {
    const genResult = await generateProject(result.data, { outputDir, silent: true });
    spinner.succeed(chalk.green('Project generated!'));

    console.log('');
    console.log(`  ${chalk.green('\u2705')} ${chalk.bold(String(genResult.filesCreated.length))} files created in ${chalk.cyan(outputDir)}`);

    // Security score
    const score = genResult.securityReport.score;
    const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.yellow('\u{1F6E1}\uFE0F')}  Security: ${scoreColor(`${score}%`)}`);

    console.log('');
    console.log(chalk.dim('  Next steps:'));
    console.log(chalk.cyan(`    cd ${outputDir}`));
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
