# CC v2 Code Intelligence — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MCP server with ts-morph engine that replaces Serena's code intelligence, stores analysis in Supabase, and visualizes results in the CC v2 dashboard.

**Architecture:** A standalone Node.js MCP server uses ts-morph to analyze TypeScript projects, stores results (symbols, references, diagnostics, dependencies, metrics) in Supabase VEHA Hub, and exposes 7 tools to Claude Code. The CC v2 Next.js dashboard reads this data via new API endpoints and displays it in 3 new tabs on the project detail page.

**Tech Stack:** Node.js, TypeScript, ts-morph, @modelcontextprotocol/sdk, @supabase/supabase-js, Next.js 14, Tailwind CSS v4

**Reference docs:**
- Design: `docs/plans/2026-02-13-cc-v2-code-intelligence-design.md`
- ts-morph: https://ts-morph.com (Context7 ID: /dsherret/ts-morph)
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Existing MCP example: `C:\Users\Shadow\Projects\prompt-library-mcp\`

---

## Pre-flight

**Branch:** Create `feat/code-intelligence` from `master`

```bash
cd C:\Users\Shadow\Projects\command-center-v2
git checkout master
git pull origin master
git checkout -b feat/code-intelligence
```

---

## Task 1: Supabase Migrations

Create 5 new tables for code intelligence data storage.

**Files:**
- Create: `supabase/migrations/20260213200000_create_code_intelligence_tables.sql`

**Step 1: Write the migration file**

```sql
-- ============================================================
-- Code Intelligence Tables for CC v2
-- Replaces Serena LSP data with ts-morph analysis results
-- ============================================================

-- 1. Project Symbols
CREATE TABLE IF NOT EXISTS project_symbols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    file_path TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    signature TEXT,
    return_type TEXT,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    parent TEXT,
    exported BOOLEAN DEFAULT false,
    is_async BOOLEAN DEFAULT false,
    parameters JSONB,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_symbols_project ON project_symbols(project);
CREATE INDEX IF NOT EXISTS idx_project_symbols_project_file ON project_symbols(project, file_path);
CREATE INDEX IF NOT EXISTS idx_project_symbols_project_kind ON project_symbols(project, kind);
CREATE INDEX IF NOT EXISTS idx_project_symbols_name ON project_symbols(name);

-- 2. Project References
CREATE TABLE IF NOT EXISTS project_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    symbol_name TEXT NOT NULL,
    symbol_file TEXT NOT NULL,
    ref_file TEXT NOT NULL,
    ref_line INTEGER NOT NULL,
    ref_kind TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_references_project ON project_references(project);
CREATE INDEX IF NOT EXISTS idx_project_references_symbol ON project_references(project, symbol_name);
CREATE INDEX IF NOT EXISTS idx_project_references_file ON project_references(project, ref_file);

-- 3. Project Diagnostics
CREATE TABLE IF NOT EXISTS project_diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line INTEGER NOT NULL,
    col INTEGER,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    code INTEGER,
    source TEXT DEFAULT 'typescript',
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_diagnostics_project ON project_diagnostics(project);
CREATE INDEX IF NOT EXISTS idx_project_diagnostics_severity ON project_diagnostics(project, severity);

-- 4. Project Dependencies
CREATE TABLE IF NOT EXISTS project_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    dep_type TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project, name)
);

CREATE INDEX IF NOT EXISTS idx_project_dependencies_project ON project_dependencies(project);
CREATE INDEX IF NOT EXISTS idx_project_dependencies_name ON project_dependencies(name);

-- 5. Project Metrics
CREATE TABLE IF NOT EXISTS project_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project TEXT NOT NULL UNIQUE,
    total_files INTEGER NOT NULL,
    total_loc INTEGER NOT NULL,
    languages JSONB NOT NULL,
    total_symbols INTEGER DEFAULT 0,
    total_exports INTEGER DEFAULT 0,
    total_diagnostics_error INTEGER DEFAULT 0,
    total_diagnostics_warning INTEGER DEFAULT 0,
    total_dependencies INTEGER DEFAULT 0,
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_metrics_project ON project_metrics(project);

-- RLS: all tables use service role key (same pattern as project_memories)
ALTER TABLE project_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies
CREATE POLICY "service_role_all_project_symbols" ON project_symbols FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_project_references" ON project_references FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_project_diagnostics" ON project_diagnostics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_project_dependencies" ON project_dependencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_project_metrics" ON project_metrics FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Push migration to Supabase**

Run: `cd C:\Users\Shadow\Projects\command-center-v2 && npx supabase db push --linked`

Expected: Migration applied successfully, 5 new tables created.

**Step 3: Verify tables exist**

Run: `npx supabase db dump --linked --schema public | findstr "project_symbols project_references project_diagnostics project_dependencies project_metrics"`

Expected: All 5 table names appear in output.

**Step 4: Commit**

```bash
git add supabase/migrations/20260213200000_create_code_intelligence_tables.sql
git commit -m "feat: add code intelligence tables (symbols, references, diagnostics, deps, metrics)"
```

---

## Task 2: MCP Server Project Scaffold

Create the MCP server project structure with all dependencies.

**Files:**
- Create: `cc-v2-mcp/package.json`
- Create: `cc-v2-mcp/tsconfig.json`
- Create: `cc-v2-mcp/src/index.ts` (entry point)
- Create: `cc-v2-mcp/.env.example`

**Step 1: Create project directory**

Run: `mkdir C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp\src`

**Step 2: Write package.json**

```json
{
  "name": "cc-v2-code-intel-mcp",
  "version": "1.0.0",
  "description": "CC v2 Code Intelligence MCP Server — Serena replacement",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "ts-morph": "^24.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

**Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Write .env.example**

```
SUPABASE_URL=https://ikpmlhmbooaxfrlpzcfa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Step 5: Write minimal entry point (src/index.ts)**

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'cc-v2-code-intel',
  version: '1.0.0',
});

// Tools will be registered in subsequent tasks

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CC v2 Code Intelligence MCP Server running on stdio');
}

main().catch(console.error);
```

**Step 6: Install dependencies**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm install`

Expected: All dependencies installed, `node_modules` created.

**Step 7: Build and verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: `dist/index.js` created without errors.

**Step 8: Add .gitignore**

Create `cc-v2-mcp/.gitignore`:
```
node_modules/
dist/
.env
```

**Step 9: Commit**

```bash
git add cc-v2-mcp/
git commit -m "feat: scaffold CC v2 Code Intelligence MCP server"
```

---

## Task 3: Supabase Client Module

Create the shared Supabase client for the MCP server.

**Files:**
- Create: `cc-v2-mcp/src/lib/supabase.ts`

**Step 1: Write the Supabase client**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
```

**Step 2: Create types file**

Create `cc-v2-mcp/src/lib/types.ts`:

```typescript
export interface SymbolRecord {
  project: string;
  file_path: string;
  name: string;
  kind: string;
  signature: string | null;
  return_type: string | null;
  line_start: number;
  line_end: number;
  parent: string | null;
  exported: boolean;
  is_async: boolean;
  parameters: ParameterInfo[] | null;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

export interface ReferenceRecord {
  project: string;
  symbol_name: string;
  symbol_file: string;
  ref_file: string;
  ref_line: number;
  ref_kind: string;
}

export interface DiagnosticRecord {
  project: string;
  file_path: string;
  line: number;
  col: number | null;
  severity: string;
  message: string;
  code: number | null;
  source: string;
}

export interface DependencyRecord {
  project: string;
  name: string;
  version: string;
  dep_type: string;
}

export interface MetricsRecord {
  project: string;
  total_files: number;
  total_loc: number;
  languages: Record<string, number>;
  total_symbols: number;
  total_exports: number;
  total_diagnostics_error: number;
  total_diagnostics_warning: number;
  total_dependencies: number;
}

export interface AnalysisResult {
  project: string;
  symbols: SymbolRecord[];
  references: ReferenceRecord[];
  diagnostics: DiagnosticRecord[];
  dependencies: DependencyRecord[];
  metrics: MetricsRecord;
}
```

**Step 3: Build to verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: Compiles without errors.

**Step 4: Commit**

```bash
git add cc-v2-mcp/src/lib/
git commit -m "feat: add Supabase client + type definitions for code intelligence"
```

---

## Task 4: ts-morph Analysis Engine — Symbol Extraction

The core analysis engine that uses ts-morph to extract symbols from TypeScript projects.

**Files:**
- Create: `cc-v2-mcp/src/analyzer/symbols.ts`
- Create: `cc-v2-mcp/src/analyzer/project.ts`

**Step 1: Write the project loader**

Create `cc-v2-mcp/src/analyzer/project.ts`:

```typescript
import { Project } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Initialize a ts-morph Project from a given root directory.
 * Looks for tsconfig.json, falls back to default compiler options.
 */
export function loadProject(projectPath: string): Project {
  const tsconfigPath = findTsConfig(projectPath);

  if (tsconfigPath) {
    return new Project({ tsConfigFilePath: tsconfigPath });
  }

  // Fallback: no tsconfig, load .ts/.tsx files manually
  const project = new Project({
    compilerOptions: {
      target: 99, // ESNext
      module: 199, // NodeNext
      moduleResolution: 99, // NodeNext
      jsx: 4, // react-jsx
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  });

  project.addSourceFilesAtPaths(
    path.join(projectPath, 'src/**/*.{ts,tsx}')
  );

  return project;
}

function findTsConfig(dir: string): string | null {
  const candidates = ['tsconfig.json', 'tsconfig.app.json'];
  for (const name of candidates) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Compute the project slug from a directory path.
 * E.g., "C:\Users\Shadow\Projects\command-center-v2" -> "command-center-v2"
 */
export function getProjectSlug(projectPath: string): string {
  return path.basename(projectPath).toLowerCase().replace(/\s+/g, '-');
}
```

**Step 2: Write the symbol extractor**

Create `cc-v2-mcp/src/analyzer/symbols.ts`:

```typescript
import { SourceFile, SyntaxKind, Node } from 'ts-morph';
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
      signature: fn.getText().split('{')[0]?.trim() || null,
      return_type: safeGetType(fn.getReturnType()),
      line_start: fn.getStartLineNumber(),
      line_end: fn.getEndLineNumber(),
      parent: null,
      exported: fn.isExported(),
      is_async: fn.isAsync(),
      parameters: extractParameters(fn),
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

    // Methods
    for (const method of cls.getMethods()) {
      symbols.push({
        project,
        file_path: filePath,
        name: method.getName(),
        kind: 'method',
        signature: method.getText().split('{')[0]?.trim() || null,
        return_type: safeGetType(method.getReturnType()),
        line_start: method.getStartLineNumber(),
        line_end: method.getEndLineNumber(),
        parent: className,
        exported: cls.isExported(),
        is_async: method.isAsync(),
        parameters: extractParameters(method),
      });
    }

    // Properties
    for (const prop of cls.getProperties()) {
      symbols.push({
        project,
        file_path: filePath,
        name: prop.getName(),
        kind: 'property',
        signature: prop.getText().trim(),
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
      signature: typeAlias.getText().trim(),
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
        signature: decl.getText().trim(),
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

function extractParameters(
  node: { getParameters: () => Array<{ getName: () => string; getType: () => { getText: () => string }; isOptional: () => boolean }> }
): ParameterInfo[] {
  return node.getParameters().map((p) => ({
    name: p.getName(),
    type: p.getType().getText(),
    optional: p.isOptional(),
  }));
}

function safeGetType(type: { getText: () => string } | undefined): string | null {
  try {
    const text = type?.getText();
    // Truncate extremely long type strings (generics can be huge)
    if (text && text.length > 500) return text.substring(0, 500) + '...';
    return text || null;
  } catch {
    return null;
  }
}

function getRelativePath(absolute: string, root: string): string {
  // Normalize separators for Windows
  const normalized = absolute.replace(/\\/g, '/');
  const normalizedRoot = root.replace(/\\/g, '/');
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.substring(normalizedRoot.length).replace(/^\//, '');
  }
  return normalized;
}
```

**Step 3: Build to verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: Compiles without errors.

**Step 4: Commit**

```bash
git add cc-v2-mcp/src/analyzer/
git commit -m "feat: add ts-morph project loader + symbol extractor"
```

---

## Task 5: Analysis Engine — References, Diagnostics, Dependencies, Metrics

Complete the analysis engine with all remaining extractors.

**Files:**
- Create: `cc-v2-mcp/src/analyzer/references.ts`
- Create: `cc-v2-mcp/src/analyzer/diagnostics.ts`
- Create: `cc-v2-mcp/src/analyzer/dependencies.ts`
- Create: `cc-v2-mcp/src/analyzer/metrics.ts`
- Create: `cc-v2-mcp/src/analyzer/index.ts` (orchestrator)

**Step 1: Write the reference finder**

Create `cc-v2-mcp/src/analyzer/references.ts`:

```typescript
import { SourceFile } from 'ts-morph';
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

  // Get all exported declarations from this file
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDeclarations) {
    for (const decl of declarations) {
      try {
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
  const normalizedRoot = root.replace(/\\/g, '/');
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.substring(normalizedRoot.length).replace(/^\//, '');
  }
  return normalized;
}
```

**Step 2: Write the diagnostics collector**

Create `cc-v2-mcp/src/analyzer/diagnostics.ts`:

```typescript
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

    const lineAndChar = diag.getLineNumber();

    records.push({
      project: projectSlug,
      file_path: filePath,
      line: lineAndChar ?? 0,
      col: null,
      severity: mapSeverity(diag.getCategory()),
      message: diag.getMessageText().toString(),
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

function getRelativePath(absolute: string, root: string): string {
  const normalized = absolute.replace(/\\/g, '/');
  const normalizedRoot = root.replace(/\\/g, '/');
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.substring(normalizedRoot.length).replace(/^\//, '');
  }
  return normalized;
}
```

**Step 3: Write the dependency parser**

Create `cc-v2-mcp/src/analyzer/dependencies.ts`:

```typescript
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
```

**Step 4: Write the metrics calculator**

Create `cc-v2-mcp/src/analyzer/metrics.ts`:

```typescript
import { Project } from 'ts-morph';
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
    total_files: sourceFiles.length + Object.values(otherFiles).length,
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
```

**Step 5: Write the orchestrator**

Create `cc-v2-mcp/src/analyzer/index.ts`:

```typescript
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
```

**Step 6: Build to verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: Compiles without errors.

**Step 7: Commit**

```bash
git add cc-v2-mcp/src/analyzer/
git commit -m "feat: complete analysis engine (references, diagnostics, dependencies, metrics)"
```

---

## Task 6: Supabase Storage Layer

Stores analysis results in Supabase and retrieves them for queries.

**Files:**
- Create: `cc-v2-mcp/src/lib/storage.ts`

**Step 1: Write the storage module**

```typescript
import { getSupabase } from './supabase.js';
import type {
  AnalysisResult,
  SymbolRecord,
  ReferenceRecord,
  DiagnosticRecord,
  DependencyRecord,
  MetricsRecord,
} from './types.js';

const BATCH_SIZE = 500;

/**
 * Store a complete analysis result, replacing any previous data for this project.
 */
export async function storeAnalysis(result: AnalysisResult): Promise<void> {
  const supabase = getSupabase();
  const { project } = result;

  // Clear previous data for this project
  await Promise.all([
    supabase.from('project_symbols').delete().eq('project', project),
    supabase.from('project_references').delete().eq('project', project),
    supabase.from('project_diagnostics').delete().eq('project', project),
    supabase.from('project_dependencies').delete().eq('project', project),
    supabase.from('project_metrics').delete().eq('project', project),
  ]);

  // Insert symbols in batches
  for (let i = 0; i < result.symbols.length; i += BATCH_SIZE) {
    const batch = result.symbols.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('project_symbols').insert(batch);
    if (error) console.error('[storage] Symbol insert error:', error.message);
  }

  // Insert references in batches
  for (let i = 0; i < result.references.length; i += BATCH_SIZE) {
    const batch = result.references.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('project_references').insert(batch);
    if (error) console.error('[storage] Reference insert error:', error.message);
  }

  // Insert diagnostics
  if (result.diagnostics.length > 0) {
    const { error } = await supabase.from('project_diagnostics').insert(result.diagnostics);
    if (error) console.error('[storage] Diagnostics insert error:', error.message);
  }

  // Upsert dependencies
  if (result.dependencies.length > 0) {
    const { error } = await supabase
      .from('project_dependencies')
      .upsert(result.dependencies, { onConflict: 'project,name' });
    if (error) console.error('[storage] Dependencies insert error:', error.message);
  }

  // Upsert metrics
  const { error } = await supabase
    .from('project_metrics')
    .upsert(result.metrics, { onConflict: 'project' });
  if (error) console.error('[storage] Metrics insert error:', error.message);
}

/**
 * Query symbols with filters.
 */
export async function querySymbols(filters: {
  project?: string;
  kind?: string;
  name?: string;
  file_path?: string;
  exported_only?: boolean;
  limit?: number;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('project_symbols')
    .select('*')
    .order('file_path')
    .order('line_start');

  if (filters.project) query = query.eq('project', filters.project);
  if (filters.kind) query = query.eq('kind', filters.kind);
  if (filters.name) query = query.ilike('name', `%${filters.name}%`);
  if (filters.file_path) query = query.eq('file_path', filters.file_path);
  if (filters.exported_only) query = query.eq('exported', true);
  query = query.limit(filters.limit || 50);

  const { data, error } = await query;
  if (error) throw new Error(`querySymbols failed: ${error.message}`);
  return data || [];
}

/**
 * Find references for a symbol.
 */
export async function findReferences(filters: {
  project: string;
  symbol_name: string;
  symbol_file?: string;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('project_references')
    .select('*')
    .eq('project', filters.project)
    .eq('symbol_name', filters.symbol_name)
    .order('ref_file')
    .order('ref_line');

  if (filters.symbol_file) query = query.eq('symbol_file', filters.symbol_file);

  const { data, error } = await query;
  if (error) throw new Error(`findReferences failed: ${error.message}`);
  return data || [];
}

/**
 * Get diagnostics with filters.
 */
export async function getDiagnostics(filters: {
  project?: string;
  severity?: string;
  file_path?: string;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('project_diagnostics')
    .select('*')
    .order('severity')
    .order('file_path')
    .order('line');

  if (filters.project) query = query.eq('project', filters.project);
  if (filters.severity) query = query.eq('severity', filters.severity);
  if (filters.file_path) query = query.eq('file_path', filters.file_path);

  const { data, error } = await query;
  if (error) throw new Error(`getDiagnostics failed: ${error.message}`);
  return data || [];
}

/**
 * Get dependencies with filters.
 */
export async function getDependencies(filters: {
  project?: string;
  name?: string;
  dep_type?: string;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('project_dependencies')
    .select('*')
    .order('dep_type')
    .order('name');

  if (filters.project) query = query.eq('project', filters.project);
  if (filters.name) query = query.ilike('name', `%${filters.name}%`);
  if (filters.dep_type) query = query.eq('dep_type', filters.dep_type);

  const { data, error } = await query;
  if (error) throw new Error(`getDependencies failed: ${error.message}`);
  return data || [];
}

/**
 * Get metrics for one or all projects.
 */
export async function getMetrics(project?: string) {
  const supabase = getSupabase();
  let query = supabase.from('project_metrics').select('*');
  if (project) query = query.eq('project', project);

  const { data, error } = await query;
  if (error) throw new Error(`getMetrics failed: ${error.message}`);
  return data || [];
}
```

**Step 2: Build to verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add cc-v2-mcp/src/lib/storage.ts
git commit -m "feat: add Supabase storage layer for analysis data"
```

---

## Task 7: MCP Tools Implementation

Register all 7 MCP tools on the server.

**Files:**
- Modify: `cc-v2-mcp/src/index.ts`

**Step 1: Write the complete MCP server with all tools**

Replace `cc-v2-mcp/src/index.ts` with the full implementation:

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { analyzeProject } from './analyzer/index.js';
import {
  storeAnalysis,
  querySymbols,
  findReferences as findRefsStorage,
  getDiagnostics as getDiagsStorage,
  getDependencies as getDepsStorage,
  getMetrics as getMetricsStorage,
} from './lib/storage.js';

const server = new McpServer({
  name: 'cc-v2-code-intel',
  version: '1.0.0',
});

// ─── Tool 1: analyze_project ────────────────────────────────────────────
server.tool(
  'analyze_project',
  {
    project_path: z.string().describe('Absolute path to the project root directory'),
    project_slug: z.string().optional().describe('Project slug for storage (auto-detected from path if omitted)'),
  },
  async ({ project_path, project_slug }) => {
    const startTime = Date.now();

    const result = await analyzeProject(project_path, project_slug);
    await storeAnalysis(result);

    const duration = Date.now() - startTime;
    const summary = {
      project: result.project,
      files_analyzed: result.metrics.total_files,
      symbols_found: result.symbols.length,
      exports: result.metrics.total_exports,
      diagnostics: {
        error: result.metrics.total_diagnostics_error,
        warning: result.metrics.total_diagnostics_warning,
      },
      dependencies: {
        production: result.dependencies.filter((d) => d.dep_type === 'production').length,
        dev: result.dependencies.filter((d) => d.dep_type === 'dev').length,
      },
      loc: result.metrics.total_loc,
      duration_ms: duration,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 2: query_symbols ──────────────────────────────────────────────
server.tool(
  'query_symbols',
  {
    project: z.string().optional().describe('Filter by project slug'),
    kind: z.string().optional().describe('Filter by kind: function, class, interface, type, enum, variable, method, property'),
    name: z.string().optional().describe('Search by symbol name (fuzzy match)'),
    file_path: z.string().optional().describe('Filter by file path'),
    exported_only: z.boolean().optional().describe('Only show exported symbols'),
    limit: z.number().optional().describe('Max results (default 50)'),
  },
  async (filters) => {
    const symbols = await querySymbols(filters);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ symbols, total: symbols.length }, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 3: find_references ────────────────────────────────────────────
server.tool(
  'find_references',
  {
    project: z.string().describe('Project slug'),
    symbol_name: z.string().describe('Name of the symbol to find references for'),
    symbol_file: z.string().optional().describe('File where the symbol is defined (for disambiguation)'),
  },
  async (filters) => {
    const refs = await findRefsStorage(filters);

    // Also get the symbol definition info
    const symbolDefs = await querySymbols({
      project: filters.project,
      name: filters.symbol_name,
      file_path: filters.symbol_file,
      limit: 1,
    });

    const definedIn = symbolDefs.length > 0
      ? `${symbolDefs[0].file_path}:${symbolDefs[0].line_start}`
      : 'unknown';

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            symbol: filters.symbol_name,
            defined_in: definedIn,
            references: refs,
            total: refs.length,
          }, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 4: get_diagnostics ────────────────────────────────────────────
server.tool(
  'get_diagnostics',
  {
    project: z.string().optional().describe('Filter by project slug'),
    severity: z.string().optional().describe('Filter by severity: error, warning, suggestion'),
    file_path: z.string().optional().describe('Filter by file path'),
  },
  async (filters) => {
    const diagnostics = await getDiagsStorage(filters);
    const summary = {
      error: diagnostics.filter((d: { severity: string }) => d.severity === 'error').length,
      warning: diagnostics.filter((d: { severity: string }) => d.severity === 'warning').length,
      suggestion: diagnostics.filter((d: { severity: string }) => d.severity === 'suggestion').length,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ diagnostics, summary }, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 5: get_dependencies ───────────────────────────────────────────
server.tool(
  'get_dependencies',
  {
    project: z.string().optional().describe('Filter by project slug'),
    name: z.string().optional().describe('Search by package name'),
    dep_type: z.string().optional().describe('Filter by type: production, dev, peer, optional'),
  },
  async (filters) => {
    const dependencies = await getDepsStorage(filters);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ dependencies, total: dependencies.length }, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 6: get_metrics ────────────────────────────────────────────────
server.tool(
  'get_metrics',
  {
    project: z.string().optional().describe('Filter by project slug (omit for all projects)'),
  },
  async ({ project }) => {
    const metrics = await getMetricsStorage(project);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ metrics }, null, 2),
        },
      ],
    };
  }
);

// ─── Tool 7: project_health ─────────────────────────────────────────────
server.tool(
  'project_health',
  {
    project: z.string().optional().describe('Project slug (omit for all projects)'),
  },
  async ({ project }) => {
    const metrics = await getMetricsStorage(project);

    const health = metrics.map((m: {
      project: string;
      total_loc: number;
      total_diagnostics_error: number;
      total_diagnostics_warning: number;
      total_dependencies: number;
      total_files: number;
      total_symbols: number;
      analyzed_at: string;
    }) => {
      const score = m.total_diagnostics_error === 0
        ? (m.total_diagnostics_warning < 10 ? 'healthy' : 'needs-attention')
        : 'unhealthy';

      const issues: string[] = [];
      if (m.total_diagnostics_error > 0) issues.push(`${m.total_diagnostics_error} TypeScript errors`);
      if (m.total_diagnostics_warning > 0) issues.push(`${m.total_diagnostics_warning} TypeScript warnings`);

      return {
        project: m.project,
        score,
        loc: m.total_loc,
        files: m.total_files,
        symbols: m.total_symbols,
        errors: m.total_diagnostics_error,
        warnings: m.total_diagnostics_warning,
        dependencies: m.total_dependencies,
        last_analyzed: m.analyzed_at,
        issues,
      };
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ health }, null, 2),
        },
      ],
    };
  }
);

// ─── Start Server ───────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CC v2 Code Intelligence MCP Server running on stdio');
}

main().catch(console.error);
```

**Step 2: Build and verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

Expected: Compiles without errors. `dist/index.js` created.

**Step 3: Commit**

```bash
git add cc-v2-mcp/src/index.ts
git commit -m "feat: implement all 7 MCP tools (analyze, symbols, references, diagnostics, deps, metrics, health)"
```

---

## Task 8: MCP Server Registration

Register the MCP server so Claude Code can use it.

**Files:**
- Create: `cc-v2-mcp/.env` (from .env.example, with real keys)
- Modify: `.mcp.json` (project root) — create if not exists

**Step 1: Create .env with real credentials**

Copy the Supabase credentials from `command-center-app/.env.local`:

```
SUPABASE_URL=https://ikpmlhmbooaxfrlpzcfa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<copy from command-center-app/.env.local>
```

**Step 2: Create .mcp.json in project root**

Create `C:\Users\Shadow\Projects\command-center-v2\.mcp.json`:

```json
{
  "mcpServers": {
    "cc-v2-code-intel": {
      "command": "node",
      "args": ["cc-v2-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://ikpmlhmbooaxfrlpzcfa.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

> **Note:** The engineer must verify the exact .mcp.json format that Claude Code expects. Check the existing `.mcp.json` files found at `~/.claude/plugins/` for the correct schema. The env variable `SUPABASE_SERVICE_ROLE_KEY` must either be in the system environment or hardcoded (not committed).

**Step 3: Build the MCP server**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && npm run build`

**Step 4: Test the server starts**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\cc-v2-mcp && echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node dist/index.js`

Expected: JSON response with server capabilities (tools listed).

**Step 5: Commit**

```bash
git add .mcp.json
git commit -m "feat: register CC v2 Code Intelligence MCP server"
```

---

## Task 9: First Integration Test — Analyze CC v2 Itself

Test the full pipeline by analyzing the command-center-app project.

**Step 1: Restart Claude Code session**

Close and reopen Claude Code in the `command-center-v2` directory so it picks up the new `.mcp.json`.

**Step 2: Verify MCP server is loaded**

In the new session, the `analyze_project`, `query_symbols`, `find_references`, `get_diagnostics`, `get_dependencies`, `get_metrics`, and `project_health` tools should be available.

**Step 3: Run analyze_project**

Use the `analyze_project` tool with:
- `project_path`: `C:\Users\Shadow\Projects\command-center-v2\command-center-app`
- `project_slug`: `command-center-v2`

Expected output: JSON with files_analyzed > 0, symbols_found > 0, loc > 0.

**Step 4: Verify data in Supabase**

Run queries to verify:
- `query_symbols` with `project: "command-center-v2"` → should return symbols
- `get_diagnostics` with `project: "command-center-v2"` → should return diagnostics
- `get_dependencies` with `project: "command-center-v2"` → should return packages from package.json
- `project_health` with `project: "command-center-v2"` → should return health score

**Step 5: Document results and commit**

Record the test results. If any fixes were needed, commit them.

```bash
git add -A
git commit -m "test: verify MCP server integration with CC v2 analysis"
```

---

## Task 10: Dashboard API Endpoints

Add GET-only API routes for the dashboard to read analysis data.

**Files:**
- Create: `command-center-app/src/app/api/projects/[slug]/symbols/route.ts`
- Create: `command-center-app/src/app/api/projects/[slug]/diagnostics/route.ts`
- Create: `command-center-app/src/app/api/projects/[slug]/dependencies/route.ts`
- Create: `command-center-app/src/app/api/projects/[slug]/metrics/route.ts`

**Step 1: Write symbols endpoint**

Create `command-center-app/src/app/api/projects/[slug]/symbols/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind') || undefined
  const file = searchParams.get('file') || undefined
  const name = searchParams.get('name') || undefined
  const exportedOnly = searchParams.get('exported') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100')

  const supabase = getSupabase()
  let query = supabase
    .from('project_symbols')
    .select('*')
    .eq('project', slug)
    .order('file_path')
    .order('line_start')
    .limit(limit)

  if (kind) query = query.eq('kind', kind)
  if (file) query = query.eq('file_path', file)
  if (name) query = query.ilike('name', `%${name}%`)
  if (exportedOnly) query = query.eq('exported', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ symbols: data, total: data?.length || 0 })
}
```

**Step 2: Write diagnostics endpoint**

Create `command-center-app/src/app/api/projects/[slug]/diagnostics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const severity = searchParams.get('severity') || undefined

  const supabase = getSupabase()
  let query = supabase
    .from('project_diagnostics')
    .select('*')
    .eq('project', slug)
    .order('severity')
    .order('file_path')

  if (severity) query = query.eq('severity', severity)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const summary = {
    error: data?.filter(d => d.severity === 'error').length || 0,
    warning: data?.filter(d => d.severity === 'warning').length || 0,
    suggestion: data?.filter(d => d.severity === 'suggestion').length || 0,
  }

  return NextResponse.json({ diagnostics: data, summary })
}
```

**Step 3: Write dependencies endpoint**

Create `command-center-app/src/app/api/projects/[slug]/dependencies/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const depType = searchParams.get('type') || undefined

  const supabase = getSupabase()
  let query = supabase
    .from('project_dependencies')
    .select('*')
    .eq('project', slug)
    .order('dep_type')
    .order('name')

  if (depType) query = query.eq('dep_type', depType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ dependencies: data, total: data?.length || 0 })
}
```

**Step 4: Write metrics endpoint**

Create `command-center-app/src/app/api/projects/[slug]/metrics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('project_metrics')
    .select('*')
    .eq('project', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ metrics: null, message: 'No analysis data. Run /analyze first.' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ metrics: data })
}
```

**Step 5: Build and verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\command-center-app && npm run build`

Expected: Build succeeds, no TypeScript errors.

**Step 6: Commit**

```bash
git add command-center-app/src/app/api/projects/[slug]/symbols/ command-center-app/src/app/api/projects/[slug]/diagnostics/ command-center-app/src/app/api/projects/[slug]/dependencies/ command-center-app/src/app/api/projects/[slug]/metrics/
git commit -m "feat: add dashboard API endpoints for code intelligence data"
```

---

## Task 11: Dashboard — Server-Side Data Fetching

Add server-side functions in `lib/` to fetch code intelligence data for the dashboard.

**Files:**
- Create: `command-center-app/src/lib/code-intel.ts`
- Modify: `command-center-app/src/types/index.ts` — add new interfaces

**Step 1: Add type definitions**

Add to `command-center-app/src/types/index.ts`:

```typescript
// Code Intelligence Types
export interface ProjectSymbol {
  id: string
  project: string
  file_path: string
  name: string
  kind: string
  signature: string | null
  return_type: string | null
  line_start: number
  line_end: number
  parent: string | null
  exported: boolean
  is_async: boolean
  parameters: { name: string; type: string; optional: boolean }[] | null
  analyzed_at: string
}

export interface ProjectDiagnostic {
  id: string
  project: string
  file_path: string
  line: number
  col: number | null
  severity: string
  message: string
  code: number | null
  source: string
  analyzed_at: string
}

export interface ProjectDependency {
  id: string
  project: string
  name: string
  version: string
  dep_type: string
  analyzed_at: string
}

export interface ProjectMetrics {
  id: string
  project: string
  total_files: number
  total_loc: number
  languages: Record<string, number>
  total_symbols: number
  total_exports: number
  total_diagnostics_error: number
  total_diagnostics_warning: number
  total_dependencies: number
  analyzed_at: string
}
```

**Step 2: Write the code-intel data fetching module**

Create `command-center-app/src/lib/code-intel.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { ProjectSymbol, ProjectDiagnostic, ProjectDependency, ProjectMetrics } from '@/types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getProjectSymbols(project: string): Promise<ProjectSymbol[]> {
  const { data, error } = await getSupabase()
    .from('project_symbols')
    .select('*')
    .eq('project', project)
    .order('file_path')
    .order('line_start')
  if (error) { console.error('getProjectSymbols:', error); return [] }
  return data || []
}

export async function getProjectDiagnostics(project: string): Promise<ProjectDiagnostic[]> {
  const { data, error } = await getSupabase()
    .from('project_diagnostics')
    .select('*')
    .eq('project', project)
    .order('severity')
    .order('file_path')
  if (error) { console.error('getProjectDiagnostics:', error); return [] }
  return data || []
}

export async function getProjectDependencies(project: string): Promise<ProjectDependency[]> {
  const { data, error } = await getSupabase()
    .from('project_dependencies')
    .select('*')
    .eq('project', project)
    .order('dep_type')
    .order('name')
  if (error) { console.error('getProjectDependencies:', error); return [] }
  return data || []
}

export async function getProjectMetrics(project: string): Promise<ProjectMetrics | null> {
  const { data, error } = await getSupabase()
    .from('project_metrics')
    .select('*')
    .eq('project', project)
    .single()
  if (error) { console.error('getProjectMetrics:', error); return null }
  return data
}

export async function getAllProjectMetrics(): Promise<ProjectMetrics[]> {
  const { data, error } = await getSupabase()
    .from('project_metrics')
    .select('*')
    .order('project')
  if (error) { console.error('getAllProjectMetrics:', error); return [] }
  return data || []
}
```

**Step 3: Build and verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\command-center-app && npm run build`

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add command-center-app/src/lib/code-intel.ts command-center-app/src/types/index.ts
git commit -m "feat: add server-side code intelligence data fetching + types"
```

---

## Task 12: Dashboard — Project Detail Tab Navigation

Add tab navigation to the project detail page.

**Files:**
- Create: `command-center-app/src/components/code-intel/ProjectTabs.tsx`
- Modify: `command-center-app/src/app/(dashboard)/projects/[slug]/page.tsx`

**Step 1: Create the tab navigation component**

Create `command-center-app/src/components/code-intel/ProjectTabs.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface ProjectTabsProps {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
}

export function ProjectTabs({ tabs, defaultTab, children }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-zinc-400">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
      {children(activeTab)}
    </div>
  )
}
```

**Step 2: Create code intelligence tab content components**

Create `command-center-app/src/components/code-intel/CodeTab.tsx`:

```tsx
import type { ProjectSymbol } from '@/types'

interface CodeTabProps {
  symbols: ProjectSymbol[]
}

export function CodeTab({ symbols }: CodeTabProps) {
  if (symbols.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-zinc-400">
        <p className="text-sm">Geen analyse data beschikbaar.</p>
        <p className="text-xs mt-2">Gebruik <code className="font-mono text-zinc-500">/analyze</code> om dit project te analyseren.</p>
      </div>
    )
  }

  // Group symbols by file
  const byFile = new Map<string, ProjectSymbol[]>()
  for (const s of symbols) {
    const existing = byFile.get(s.file_path) || []
    existing.push(s)
    byFile.set(s.file_path, existing)
  }

  return (
    <div className="space-y-4">
      {Array.from(byFile.entries()).map(([file, fileSymbols]) => (
        <div key={file} className="glass rounded-xl p-4">
          <h4 className="text-xs font-mono text-zinc-400 mb-3">{file}</h4>
          <div className="space-y-1">
            {fileSymbols
              .filter((s) => !s.parent) // top-level only
              .map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className={kindBadgeClass(s.kind)}>{s.kind}</span>
                  <span className="font-mono text-zinc-200">{s.name}</span>
                  {s.exported && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">export</span>
                  )}
                  {s.return_type && (
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">→ {s.return_type}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function kindBadgeClass(kind: string): string {
  const base = 'text-[10px] font-mono px-1.5 py-0.5 rounded'
  switch (kind) {
    case 'function': return `${base} bg-zinc-800 text-zinc-300`
    case 'class': return `${base} bg-zinc-700 text-zinc-200`
    case 'interface': return `${base} bg-zinc-800/50 text-zinc-400`
    case 'type': return `${base} bg-zinc-800/50 text-zinc-400`
    case 'enum': return `${base} bg-zinc-800 text-zinc-300`
    case 'variable': return `${base} bg-zinc-900 text-zinc-400`
    default: return `${base} bg-zinc-900 text-zinc-500`
  }
}
```

Create `command-center-app/src/components/code-intel/DependenciesTab.tsx`:

```tsx
import type { ProjectDependency } from '@/types'

interface DependenciesTabProps {
  dependencies: ProjectDependency[]
}

export function DependenciesTab({ dependencies }: DependenciesTabProps) {
  if (dependencies.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-zinc-400">
        <p className="text-sm">Geen dependencies data beschikbaar.</p>
        <p className="text-xs mt-2">Gebruik <code className="font-mono text-zinc-500">/analyze</code> om dit project te analyseren.</p>
      </div>
    )
  }

  const production = dependencies.filter((d) => d.dep_type === 'production')
  const dev = dependencies.filter((d) => d.dep_type === 'dev')
  const peer = dependencies.filter((d) => d.dep_type === 'peer')

  return (
    <div className="space-y-6">
      {production.length > 0 && (
        <DepSection title="Production" deps={production} />
      )}
      {dev.length > 0 && (
        <DepSection title="Development" deps={dev} />
      )}
      {peer.length > 0 && (
        <DepSection title="Peer" deps={peer} />
      )}
    </div>
  )
}

function DepSection({ title, deps }: { title: string; deps: ProjectDependency[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
        {title} ({deps.length})
      </h4>
      <div className="glass rounded-xl divide-y divide-zinc-800">
        {deps.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm font-mono text-zinc-200">{d.name}</span>
            <span className="text-xs text-zinc-500">{d.version}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create `command-center-app/src/components/code-intel/HealthTab.tsx`:

```tsx
import type { ProjectMetrics, ProjectDiagnostic } from '@/types'

interface HealthTabProps {
  metrics: ProjectMetrics | null
  diagnostics: ProjectDiagnostic[]
}

export function HealthTab({ metrics, diagnostics }: HealthTabProps) {
  if (!metrics) {
    return (
      <div className="glass rounded-xl p-8 text-center text-zinc-400">
        <p className="text-sm">Geen analyse data beschikbaar.</p>
        <p className="text-xs mt-2">Gebruik <code className="font-mono text-zinc-500">/analyze</code> om dit project te analyseren.</p>
      </div>
    )
  }

  const errors = diagnostics.filter((d) => d.severity === 'error')
  const warnings = diagnostics.filter((d) => d.severity === 'warning')

  // Language distribution sorted by LOC
  const langEntries = Object.entries(metrics.languages).sort(([, a], [, b]) => b - a)
  const maxLoc = langEntries[0]?.[1] || 1

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Bestanden" value={metrics.total_files} />
        <MetricCard label="Regels code" value={metrics.total_loc.toLocaleString()} />
        <MetricCard label="Symbols" value={metrics.total_symbols} />
        <MetricCard label="Exports" value={metrics.total_exports} />
      </div>

      {/* Language Distribution */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
          Talen
        </h4>
        <div className="glass rounded-xl p-4 space-y-2">
          {langEntries.map(([lang, loc]) => (
            <div key={lang} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-24 truncate">{lang}</span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-500 rounded-full"
                  style={{ width: `${(loc / maxLoc) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 w-16 text-right">{loc.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-3">
            Diagnostics ({errors.length} errors, {warnings.length} warnings)
          </h4>
          <div className="glass rounded-xl divide-y divide-zinc-800 max-h-96 overflow-y-auto">
            {diagnostics.slice(0, 50).map((d) => (
              <div key={d.id} className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={d.severity === 'error' ? 'text-red-400 text-xs' : 'text-yellow-400 text-xs'}>
                    {d.severity}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{d.file_path}:{d.line}</span>
                </div>
                <p className="text-sm text-zinc-300 mt-0.5">{d.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyzed at */}
      <p className="text-xs text-zinc-500">
        Laatst geanalyseerd: {new Date(metrics.analyzed_at).toLocaleString('nl-NL')}
      </p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className="text-2xl font-medium text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
    </div>
  )
}
```

**Step 3: Modify the project detail page to use tabs**

Read the current `page.tsx` first, then modify it to:
1. Import code intelligence data fetchers and components
2. Fetch code intel data in the `Promise.all()`
3. Replace the flat layout with `<ProjectTabs>` component
4. Move existing content into an "Overview" tab
5. Add Code, Dependencies, Health tabs

> **Important:** Read the full current `page.tsx` before modifying. The exact changes depend on the current structure. The pattern is:
> - Import `getProjectSymbols`, `getProjectDiagnostics`, `getProjectDependencies`, `getProjectMetrics` from `@/lib/code-intel`
> - Import `ProjectTabs`, `CodeTab`, `DependenciesTab`, `HealthTab` from `@/components/code-intel/`
> - Add code intel fetches to the existing `Promise.all()`
> - Wrap content in `<ProjectTabs>` with tabs: Overview, Code, Dependencies, Health, Memories

**Step 4: Build and verify**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\command-center-app && npm run build`

Expected: Build succeeds.

**Step 5: Visual verification**

Run dev server and check:
- `/projects/command-center-v2` shows tabs
- Tab switching works
- Code tab shows symbols (after analysis)
- Dependencies tab shows packages
- Health tab shows metrics

**Step 6: Commit**

```bash
git add command-center-app/src/components/code-intel/ command-center-app/src/app/(dashboard)/projects/
git commit -m "feat: add Code Intelligence tabs to project detail page (Code, Dependencies, Health)"
```

---

## Task 13: Serena Migration & Cleanup

Migrate existing Serena memories and clean up configuration.

**Step 1: Read Serena memories**

Read the 2 existing Serena memories for command-center-v2:
- `C:\Users\Shadow\Projects\command-center-v2\.serena\memories\architecture.md`
- `C:\Users\Shadow\Projects\command-center-v2\.serena\memories\sync-system.md`

**Step 2: Migrate to CC v2 memories**

Use the existing `/memory` command or POST to `/api/projects/command-center-v2/memories` to save each memory.

**Step 3: Verify migration**

Check that memories appear on the CC v2 dashboard project detail page.

**Step 4: Clean up (with Shadow's permission)**

Ask Shadow for permission to:
- Remove `.serena/` directory from `command-center-v2`
- Remove Serena from `~/.claude/settings.json` (already disabled)
- Remove `~/.serena/serena_config.yml`

**Step 5: Commit cleanup**

```bash
git add -A
git commit -m "chore: migrate Serena memories to CC v2 + cleanup Serena config"
```

---

## Task 14: Final Build + Deploy

**Step 1: Full build verification**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\command-center-app && npm run build`

Expected: Build succeeds with no errors.

**Step 2: TypeScript check**

Run: `cd C:\Users\Shadow\Projects\command-center-v2\command-center-app && npx tsc --noEmit`

Expected: No TypeScript errors.

**Step 3: Create PR**

```bash
cd C:\Users\Shadow\Projects\command-center-v2
gh pr create --title "feat: CC v2 Code Intelligence MCP Server (Serena replacement)" --body "$(cat <<'EOF'
## Summary
- New MCP server (`cc-v2-mcp/`) with ts-morph engine for TypeScript code intelligence
- 7 MCP tools: analyze_project, query_symbols, find_references, get_diagnostics, get_dependencies, get_metrics, project_health
- 5 new Supabase tables for persistent analysis storage
- Dashboard: 3 new tabs on project detail page (Code, Dependencies, Health)
- 4 new API endpoints for dashboard data consumption
- Serena memories migrated + config cleaned up

## What this replaces
All Serena MCP plugin functionality. CC v2 now provides:
- Memories (already existed)
- Project onboarding (already existed)
- Code intelligence (NEW — ts-morph based, stored in Supabase)

## Test plan
- [ ] MCP server builds and starts
- [ ] analyze_project works on CC v2 codebase
- [ ] query_symbols returns correct symbols
- [ ] find_references returns accurate references
- [ ] get_diagnostics shows TypeScript errors/warnings
- [ ] Dashboard tabs render correctly
- [ ] No TypeScript build errors
- [ ] Existing features unchanged (regression check)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 4: Merge and deploy (with Shadow's approval)**

After Shadow reviews the PR:
```bash
gh pr merge --merge
```

Production auto-deploys from master on Vercel.

---

## Summary

| Task | Description | New Files |
|------|-------------|-----------|
| 1 | Supabase migrations (5 tables) | 1 migration |
| 2 | MCP server scaffold | 4 files (package.json, tsconfig, index.ts, .gitignore) |
| 3 | Supabase client + types | 2 files |
| 4 | Symbol extraction engine | 2 files (project.ts, symbols.ts) |
| 5 | References + diagnostics + dependencies + metrics | 5 files |
| 6 | Supabase storage layer | 1 file |
| 7 | MCP tools (7 tools in index.ts) | 1 file (modified) |
| 8 | MCP server registration | 2 files (.mcp.json, .env) |
| 9 | Integration test | Verification only |
| 10 | Dashboard API endpoints | 4 files |
| 11 | Dashboard data fetching + types | 2 files |
| 12 | Dashboard UI (tabs + 3 new tab components) | 5 files |
| 13 | Serena migration + cleanup | Cleanup only |
| 14 | Build, PR, deploy | No new files |

**Total: ~29 new files, 14 tasks, 7 MCP tools, 5 database tables, 4 API endpoints, 3 dashboard tabs**
