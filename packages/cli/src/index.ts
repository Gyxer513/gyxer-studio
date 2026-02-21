#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { newCommand } from './commands/new.js';

const program = new Command();

program
  .name('gyxer')
  .description('Gyxer CLI — generate production-ready NestJS backends')
  .version('0.1.0');

// gyxer generate <schema.json> [output]
program
  .command('generate <schema>')
  .description('Generate a NestJS project from a JSON schema file')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(generateCommand);

// gyxer new <name>
program
  .command('new <name>')
  .description('Create a new project with interactive wizard')
  .action(newCommand);

// gyxer studio (placeholder)
program
  .command('studio')
  .description('Open the visual editor (coming soon)')
  .action(() => {
    console.log('Gyxer Studio visual editor is coming soon!');
    console.log('For now, use the editor package: npm run dev -w packages/editor');
  });

program.parse();
