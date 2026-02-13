import { loadProject, getProjectSlug } from './project.js';
import { extractSymbols } from './symbols.js';
import { extractReferences } from './references.js';
import { extractDiagnostics } from './diagnostics.js';
import { extractDependencies } from './dependencies.js';
import { calculateMetrics } from './metrics.js';
import type { AnalysisResult } from '../lib/types.js';

/**
 * Run a complete analysis of a TypeScript project.
 */
export async function analyzeProject(
  projectPath: string,
  slug?: string
): Promise<AnalysisResult> {
  const projectSlug = slug || getProjectSlug(projectPath);

  console.error(`[analyze] Loading project: ${projectPath}`);
  const tsMorphProject = loadProject(projectPath);

  const sourceFiles = tsMorphProject.getSourceFiles().filter(
    (sf) => !sf.getFilePath().includes('node_modules')
  );

  console.error(`[analyze] Found ${sourceFiles.length} source files`);

  // Extract symbols from all files
  const allSymbols = sourceFiles.flatMap((sf) =>
    extractSymbols(sf, projectSlug, projectPath)
  );
  console.error(`[analyze] Extracted ${allSymbols.length} symbols`);

  // Extract references for exported symbols
  const allReferences = sourceFiles.flatMap((sf) =>
    extractReferences(sf, projectSlug, projectPath)
  );
  console.error(`[analyze] Found ${allReferences.length} references`);

  // Collect diagnostics
  const allDiagnostics = extractDiagnostics(tsMorphProject, projectSlug, projectPath);
  console.error(`[analyze] Found ${allDiagnostics.length} diagnostics`);

  // Parse dependencies
  const allDependencies = extractDependencies(projectPath, projectSlug);
  console.error(`[analyze] Found ${allDependencies.length} dependencies`);

  // Calculate metrics
  const metrics = calculateMetrics(
    tsMorphProject,
    projectSlug,
    projectPath,
    allSymbols,
    allDiagnostics,
    allDependencies
  );
  console.error(`[analyze] Metrics: ${metrics.total_files} files, ${metrics.total_loc} LOC`);

  return {
    project: projectSlug,
    symbols: allSymbols,
    references: allReferences,
    diagnostics: allDiagnostics,
    dependencies: allDependencies,
    metrics,
  };
}
