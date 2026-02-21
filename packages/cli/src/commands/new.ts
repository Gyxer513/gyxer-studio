import * as fs from 'fs';
import * as path from 'path';
import { generateProject } from '@gyxer/generator';
import type { GyxerProject } from '@gyxer/schema';

export async function newCommand(name: string) {
  console.log('');
  console.log('  Gyxer — New Project');
  console.log('  ===================');
  console.log('');

  // Validate project name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('  Error: Project name must be kebab-case (e.g., "my-app")');
    process.exit(1);
  }

  const outputDir = path.resolve(name);
  if (fs.existsSync(outputDir)) {
    console.error(`  Error: Directory "${name}" already exists`);
    process.exit(1);
  }

  // Create a default project with a sample entity
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
    modules: [],
    settings: {
      port: 3000,
      database: 'postgresql',
      databaseUrl: `postgresql://postgres:postgres@localhost:5432/${name.replace(/-/g, '_')}`,
      enableSwagger: true,
      enableCors: true,
      enableHelmet: true,
      enableRateLimit: true,
      rateLimitTtl: 60,
      rateLimitMax: 100,
      docker: true,
    },
  };

  console.log(`  Creating project: ${name}`);
  console.log(`  Output: ${outputDir}`);
  console.log('');

  await generateProject(project, { outputDir });
}
