import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { parseProjectJson } from '@gyxer-studio/schema';

export async function validateCommand(schemaPath: string) {
  console.log('');
  console.log(chalk.bold('  🔍 Gyxer Validator'));
  console.log(chalk.dim('  ═════════════════'));
  console.log('');

  const resolvedPath = path.resolve(schemaPath);

  // Check file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`  ✖ File not found: ${resolvedPath}`));
    process.exit(1);
  }

  // Read and validate
  const json = fs.readFileSync(resolvedPath, 'utf-8');
  console.log(`  ${chalk.dim('File:')} ${path.relative(process.cwd(), resolvedPath)}`);
  console.log('');

  const result = parseProjectJson(json);

  if (!result.success || !result.data) {
    const errorCount = result.errors?.length || 0;
    console.error(chalk.red(`  ✖ Validation failed (${errorCount} error${errorCount !== 1 ? 's' : ''}):`));
    console.log('');
    for (const err of result.errors || []) {
      const loc = err.path ? chalk.dim(`${err.path} — `) : '';
      console.error(`    ${chalk.red('•')} ${loc}${err.message}`);
    }
    console.log('');
    process.exit(1);
  }

  // Success — print summary
  const { data } = result;
  const totalFields = data.entities.reduce((sum, e) => sum + e.fields.length, 0);
  const totalRelations = data.entities.reduce((sum, e) => sum + e.relations.length, 0);
  const enabledModules = data.modules.filter((m) => m.enabled);

  console.log(chalk.green('  ✔ Schema is valid!'));
  console.log('');
  console.log(`    ${chalk.dim('Project:')}   ${data.name} v${data.version}`);
  console.log(`    ${chalk.dim('Entities:')}  ${data.entities.length}`);
  console.log(`    ${chalk.dim('Fields:')}    ${totalFields}`);
  console.log(`    ${chalk.dim('Relations:')} ${totalRelations}`);

  if (enabledModules.length > 0) {
    console.log(`    ${chalk.dim('Modules:')}   ${enabledModules.map((m) => m.name).join(', ')}`);
  }

  console.log(`    ${chalk.dim('Database:')}  ${data.settings.database}`);
  console.log(`    ${chalk.dim('Docker:')}    ${data.settings.docker ? 'yes' : 'no'}`);
  console.log('');
}
