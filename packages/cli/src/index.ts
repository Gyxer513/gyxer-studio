#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { newCommand } from './commands/new.js';
import { editorCommand } from './commands/editor.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('gyxer')
  .description('Gyxer CLI — generate production-ready NestJS backends')
  .version('0.2.0');

// gyxer generate [schema.json] — with or without a config path
program
  .command('generate [schema]')
  .description('Generate a NestJS project from a JSON schema (interactive if omitted)')
  .option('-o, --output <dir>', 'Output directory (defaults to ./<project-name>)')
  .action(generateCommand);

// gyxer new <name>
program
  .command('new <name>')
  .description('Create a new project with interactive wizard')
  .action(newCommand);

// gyxer editor
program
  .command('editor')
  .description('Open the visual schema editor in your browser')
  .option('-p, --port <number>', 'Port to run on', '4200')
  .action(editorCommand);

// gyxer validate <schema.json>
program
  .command('validate <schema>')
  .description('Validate a JSON schema without generating code')
  .action(validateCommand);

program.parse();
