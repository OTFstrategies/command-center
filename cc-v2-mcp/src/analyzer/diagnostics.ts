import { Project, DiagnosticCategory } from 'ts-morph';
import type { DiagnosticRecord } from '../lib/types.js';

/**
 * Collect all pre-emit diagnostics (type errors, warnings) from the project.
 */
export function extractDiagnostics(
  tsMorphProject: Project,
  projectSlug: string,
  projectRoot: string
): DiagnosticRecord[] {
  const records: DiagnosticRecord[] = [];
  const diagnostics = tsMorphProject.getPreEmitDiagnostics();

  for (const diag of diagnostics) {
    const sourceFile = diag.getSourceFile();
    if (!sourceFile) continue;

    const filePath = getRelativePath(sourceFile.getFilePath(), projectRoot);

    // Skip node_modules diagnostics
    if (filePath.includes('node_modules')) continue;

    records.push({
      project: projectSlug,
      file_path: filePath,
      line: diag.getLineNumber() ?? 0,
      col: null,
      severity: mapSeverity(diag.getCategory()),
      message: flattenMessage(diag.getMessageText()),
      code: diag.getCode(),
      source: 'typescript',
    });
  }

  return records;
}

function mapSeverity(category: DiagnosticCategory): string {
  switch (category) {
    case DiagnosticCategory.Error: return 'error';
    case DiagnosticCategory.Warning: return 'warning';
    case DiagnosticCategory.Suggestion: return 'suggestion';
    case DiagnosticCategory.Message: return 'info';
    default: return 'info';
  }
}

function flattenMessage(msg: string | { getMessageText: () => string }): string {
  if (typeof msg === 'string') return msg;
  try {
    return msg.getMessageText();
  } catch {
    return String(msg);
  }
}

function getRelativePath(absolute: string, root: string): string {
  const normalized = absolute.replace(/\\/g, '/');
  const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.substring(normalizedRoot.length).replace(/^\//, '');
  }
  return normalized;
}
