import type { Project } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import type { MetricsRecord, SymbolRecord, DiagnosticRecord, DependencyRecord } from '../lib/types.js';

/**
 * Calculate aggregate metrics for the project.
 */
export function calculateMetrics(
  tsMorphProject: Project,
  projectSlug: string,
  projectRoot: string,
  symbols: SymbolRecord[],
  diagnostics: DiagnosticRecord[],
  dependencies: DependencyRecord[]
): MetricsRecord {
  const sourceFiles = tsMorphProject.getSourceFiles().filter(
    (sf) => !sf.getFilePath().includes('node_modules')
  );

  // Count LOC and language distribution
  let totalLoc = 0;
  const languages: Record<string, number> = {};

  for (const sf of sourceFiles) {
    const loc = sf.getFullText().split('\n').length;
    totalLoc += loc;

    const ext = path.extname(sf.getFilePath()).toLowerCase();
    const lang = extToLanguage(ext);
    languages[lang] = (languages[lang] || 0) + loc;
  }

  // Also count non-TS files (CSS, JSON, etc.) from src/
  const otherFiles = countOtherFiles(projectRoot);
  for (const [lang, loc] of Object.entries(otherFiles)) {
    languages[lang] = (languages[lang] || 0) + loc;
    totalLoc += loc;
  }

  return {
    project: projectSlug,
    total_files: sourceFiles.length + Object.keys(otherFiles).length,
    total_loc: totalLoc,
    languages,
    total_symbols: symbols.length,
    total_exports: symbols.filter((s) => s.exported).length,
    total_diagnostics_error: diagnostics.filter((d) => d.severity === 'error').length,
    total_diagnostics_warning: diagnostics.filter((d) => d.severity === 'warning').length,
    total_dependencies: dependencies.length,
  };
}

function extToLanguage(ext: string): string {
  const map: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.css': 'CSS',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.html': 'HTML',
    '.sql': 'SQL',
    '.py': 'Python',
  };
  return map[ext] || ext.replace('.', '').toUpperCase();
}

function countOtherFiles(projectRoot: string): Record<string, number> {
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) return {};

  const counts: Record<string, number> = {};
  const extensions = ['.css', '.json', '.html', '.md'];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            const content = fs.readFileSync(full, 'utf-8');
            const loc = content.split('\n').length;
            const lang = extToLanguage(ext);
            counts[lang] = (counts[lang] || 0) + loc;
          }
        }
      }
    } catch {
      // Permission errors, etc.
    }
  }

  walk(srcDir);
  return counts;
}
