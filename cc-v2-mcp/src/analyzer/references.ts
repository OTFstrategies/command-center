import { type SourceFile, Node } from 'ts-morph';
import type { ReferenceRecord } from '../lib/types.js';

/**
 * Find references for all exported symbols in a source file.
 * Only tracks exported symbols to keep data volume manageable.
 */
export function extractReferences(
  sourceFile: SourceFile,
  project: string,
  projectRoot: string
): ReferenceRecord[] {
  const references: ReferenceRecord[] = [];
  const filePath = getRelativePath(sourceFile.getFilePath(), projectRoot);

  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDeclarations) {
    for (const decl of declarations) {
      try {
        // Not all exported declarations support findReferencesAsNodes
        if (!Node.isReferenceFindable(decl)) continue;
        const refs = decl.findReferencesAsNodes();
        for (const ref of refs) {
          const refFile = ref.getSourceFile();
          const refPath = getRelativePath(refFile.getFilePath(), projectRoot);

          // Skip self-references (the declaration itself)
          if (refPath === filePath && ref.getStartLineNumber() === decl.getStartLineNumber()) {
            continue;
          }

          // Skip references in node_modules
          if (refPath.includes('node_modules')) continue;

          references.push({
            project,
            symbol_name: name,
            symbol_file: filePath,
            ref_file: refPath,
            ref_line: ref.getStartLineNumber(),
            ref_kind: classifyReference(ref),
          });
        }
      } catch {
        // Some declarations can't have references found (e.g., re-exports)
        continue;
      }
    }
  }

  return references;
}

function classifyReference(node: { getParent: () => { getKindName: () => string } | undefined }): string {
  try {
    const parentKind = node.getParent()?.getKindName();
    if (parentKind === 'ImportSpecifier' || parentKind === 'ImportClause') return 'import';
    if (parentKind === 'CallExpression') return 'call';
    if (parentKind === 'TypeReference') return 'type_reference';
    if (parentKind === 'HeritageClause') return 'extends';
    if (parentKind === 'PropertyAccessExpression') return 'access';
    return 'reference';
  } catch {
    return 'reference';
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
