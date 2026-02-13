import * as fs from 'fs';
import * as path from 'path';
import type { DependencyRecord } from '../lib/types.js';

/**
 * Parse package.json to extract all dependencies.
 */
export function extractDependencies(
  projectPath: string,
  projectSlug: string
): DependencyRecord[] {
  const pkgJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return [];

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const records: DependencyRecord[] = [];

  const depSections: [string, string][] = [
    ['dependencies', 'production'],
    ['devDependencies', 'dev'],
    ['peerDependencies', 'peer'],
    ['optionalDependencies', 'optional'],
  ];

  for (const [section, depType] of depSections) {
    const deps = pkgJson[section];
    if (!deps || typeof deps !== 'object') continue;

    for (const [name, version] of Object.entries(deps)) {
      records.push({
        project: projectSlug,
        name,
        version: String(version),
        dep_type: depType,
      });
    }
  }

  return records;
}
