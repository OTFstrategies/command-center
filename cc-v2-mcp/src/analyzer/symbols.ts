import type { SourceFile, Type, ParameterDeclaration } from 'ts-morph';
import type { SymbolRecord, ParameterInfo } from '../lib/types.js';

/**
 * Extract all top-level and nested symbols from a source file.
 */
export function extractSymbols(
  sourceFile: SourceFile,
  project: string,
  projectRoot: string
): SymbolRecord[] {
  const symbols: SymbolRecord[] = [];
  const filePath = getRelativePath(sourceFile.getFilePath(), projectRoot);

  // Functions
  for (const fn of sourceFile.getFunctions()) {
    symbols.push({
      project,
      file_path: filePath,
      name: fn.getName() || '(anonymous)',
      kind: 'function',
      signature: truncate(fn.getText().split('{')[0]?.trim() || null),
      return_type: safeGetType(fn.getReturnType()),
      line_start: fn.getStartLineNumber(),
      line_end: fn.getEndLineNumber(),
      parent: null,
      exported: fn.isExported(),
      is_async: fn.isAsync(),
      parameters: extractParameters(fn.getParameters()),
    });
  }

  // Classes + their methods/properties
  for (const cls of sourceFile.getClasses()) {
    const className = cls.getName() || '(anonymous)';
    symbols.push({
      project,
      file_path: filePath,
      name: className,
      kind: 'class',
      signature: `class ${className}`,
      return_type: null,
      line_start: cls.getStartLineNumber(),
      line_end: cls.getEndLineNumber(),
      parent: null,
      exported: cls.isExported(),
      is_async: false,
      parameters: null,
    });

    for (const method of cls.getMethods()) {
      symbols.push({
        project,
        file_path: filePath,
        name: method.getName(),
        kind: 'method',
        signature: truncate(method.getText().split('{')[0]?.trim() || null),
        return_type: safeGetType(method.getReturnType()),
        line_start: method.getStartLineNumber(),
        line_end: method.getEndLineNumber(),
        parent: className,
        exported: cls.isExported(),
        is_async: method.isAsync(),
        parameters: extractParameters(method.getParameters()),
      });
    }

    for (const prop of cls.getProperties()) {
      symbols.push({
        project,
        file_path: filePath,
        name: prop.getName(),
        kind: 'property',
        signature: truncate(prop.getText().trim()),
        return_type: safeGetType(prop.getType()),
        line_start: prop.getStartLineNumber(),
        line_end: prop.getEndLineNumber(),
        parent: className,
        exported: cls.isExported(),
        is_async: false,
        parameters: null,
      });
    }
  }

  // Interfaces
  for (const iface of sourceFile.getInterfaces()) {
    symbols.push({
      project,
      file_path: filePath,
      name: iface.getName(),
      kind: 'interface',
      signature: `interface ${iface.getName()}`,
      return_type: null,
      line_start: iface.getStartLineNumber(),
      line_end: iface.getEndLineNumber(),
      parent: null,
      exported: iface.isExported(),
      is_async: false,
      parameters: null,
    });
  }

  // Type aliases
  for (const typeAlias of sourceFile.getTypeAliases()) {
    symbols.push({
      project,
      file_path: filePath,
      name: typeAlias.getName(),
      kind: 'type',
      signature: truncate(typeAlias.getText().trim()),
      return_type: null,
      line_start: typeAlias.getStartLineNumber(),
      line_end: typeAlias.getEndLineNumber(),
      parent: null,
      exported: typeAlias.isExported(),
      is_async: false,
      parameters: null,
    });
  }

  // Enums
  for (const enumDecl of sourceFile.getEnums()) {
    symbols.push({
      project,
      file_path: filePath,
      name: enumDecl.getName(),
      kind: 'enum',
      signature: `enum ${enumDecl.getName()}`,
      return_type: null,
      line_start: enumDecl.getStartLineNumber(),
      line_end: enumDecl.getEndLineNumber(),
      parent: null,
      exported: enumDecl.isExported(),
      is_async: false,
      parameters: null,
    });
  }

  // Exported variable declarations (const, let)
  for (const varStatement of sourceFile.getVariableStatements()) {
    if (!varStatement.isExported()) continue;
    for (const decl of varStatement.getDeclarations()) {
      symbols.push({
        project,
        file_path: filePath,
        name: decl.getName(),
        kind: 'variable',
        signature: truncate(decl.getText().trim()),
        return_type: safeGetType(decl.getType()),
        line_start: decl.getStartLineNumber(),
        line_end: decl.getEndLineNumber(),
        parent: null,
        exported: true,
        is_async: false,
        parameters: null,
      });
    }
  }

  return symbols;
}

function extractParameters(params: ParameterDeclaration[]): ParameterInfo[] {
  return params.map((p) => ({
    name: p.getName(),
    type: safeGetType(p.getType()) || 'unknown',
    optional: p.isOptional(),
  }));
}

function safeGetType(type: Type | undefined): string | null {
  try {
    const text = type?.getText();
    if (!text) return null;
    // Truncate extremely long type strings (generics can be huge)
    if (text.length > 500) return text.substring(0, 500) + '...';
    return text;
  } catch {
    return null;
  }
}

function truncate(value: string | null, max = 500): string | null {
  if (!value) return null;
  return value.length > max ? value.substring(0, max) + '...' : value;
}

function getRelativePath(absolute: string, root: string): string {
  const normalized = absolute.replace(/\\/g, '/');
  const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.substring(normalizedRoot.length).replace(/^\//, '');
  }
  return normalized;
}
