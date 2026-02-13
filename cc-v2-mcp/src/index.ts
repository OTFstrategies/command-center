#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from the MCP server directory (not cwd)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

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
      error: diagnostics.filter((d) => d.severity === 'error').length,
      warning: diagnostics.filter((d) => d.severity === 'warning').length,
      suggestion: diagnostics.filter((d) => d.severity === 'suggestion').length,
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

    const health = metrics.map((m) => {
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
