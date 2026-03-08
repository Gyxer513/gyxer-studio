import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { validateProject } from '@gyxer-studio/schema';
import type { GyxerProject, ValidationResult } from '@gyxer-studio/schema';

const PROJECT_FILENAMES = ['gyxer.json', 'project.json'] as const;

/**
 * Resolve the project file path. Looks for gyxer.json first, then project.json.
 * Returns undefined if neither is found.
 */
export function resolveProjectPath(cwd?: string): string | undefined {
  const dir = cwd ?? process.cwd();
  for (const filename of PROJECT_FILENAMES) {
    const candidate = path.join(dir, filename);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Read the project file as raw JSON (no schema validation).
 * Throws if not found or invalid JSON.
 */
export async function readProjectRaw(cwd?: string): Promise<Record<string, unknown>> {
  const filePath = resolveProjectPath(cwd);
  if (!filePath) {
    throw new Error(
      'No project file found. Expected gyxer.json or project.json in the current directory. ' +
        'Use create_project to create one.',
    );
  }
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * Read and parse the project file. Returns the validated GyxerProject.
 * Throws a descriptive error if not found or invalid.
 */
export async function readProject(cwd?: string): Promise<GyxerProject> {
  const parsed = await readProjectRaw(cwd);
  const result = validateProject(parsed);
  if (!result.success || !result.data) {
    const msgs = (result.errors ?? []).map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Invalid project file: ${msgs}`);
  }
  return result.data;
}

/**
 * Write a GyxerProject to disk after validation.
 * Validates before writing. Returns the validation result.
 */
export async function writeProject(
  project: GyxerProject,
  cwd?: string,
): Promise<ValidationResult> {
  const result = validateProject(project);
  if (!result.success) {
    return result;
  }

  const filePath =
    resolveProjectPath(cwd) ?? path.join(cwd ?? process.cwd(), 'gyxer.json');
  await writeFile(filePath, JSON.stringify(result.data, null, 2) + '\n', 'utf-8');
  return result;
}

/**
 * Write a raw project object to disk WITHOUT validation.
 * Used for create_project (empty entities) and remove_entity (last entity removed).
 */
export async function writeProjectRaw(
  project: Record<string, unknown>,
  cwd?: string,
): Promise<void> {
  const filePath =
    resolveProjectPath(cwd) ?? path.join(cwd ?? process.cwd(), 'gyxer.json');
  await writeFile(filePath, JSON.stringify(project, null, 2) + '\n', 'utf-8');
}
