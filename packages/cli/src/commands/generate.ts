import * as fs from 'fs';
import * as path from 'path';
import { parseProjectJson } from '@gyxer/schema';
import { generateProject } from '@gyxer/generator';

interface GenerateOptions {
  output: string;
}

export async function generateCommand(schemaPath: string, options: GenerateOptions) {
  console.log('');
  console.log('  Gyxer Generator');
  console.log('  ===============');
  console.log('');

  // Read schema file
  const absolutePath = path.resolve(schemaPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`  Error: Schema file not found: ${absolutePath}`);
    process.exit(1);
  }

  const json = fs.readFileSync(absolutePath, 'utf-8');

  // Validate
  console.log(`  Schema: ${absolutePath}`);
  const result = parseProjectJson(json);

  if (!result.success || !result.data) {
    console.error('  Validation failed:');
    for (const err of result.errors || []) {
      console.error(`    - ${err.path}: ${err.message}`);
    }
    process.exit(1);
  }

  console.log(`  Project: ${result.data.name}`);
  console.log(`  Entities: ${result.data.entities.length}`);
  console.log('');

  // Generate
  const outputDir = path.resolve(options.output);
  await generateProject(result.data, { outputDir });
}
