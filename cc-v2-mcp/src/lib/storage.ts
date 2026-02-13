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
    for (let i = 0; i < result.diagnostics.length; i += BATCH_SIZE) {
      const batch = result.diagnostics.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('project_diagnostics').insert(batch);
      if (error) console.error('[storage] Diagnostics insert error:', error.message);
    }
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
}): Promise<SymbolRecord[]> {
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
  return (data || []) as SymbolRecord[];
}

/**
 * Find references for a symbol.
 */
export async function findReferences(filters: {
  project: string;
  symbol_name: string;
  symbol_file?: string;
}): Promise<ReferenceRecord[]> {
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
  return (data || []) as ReferenceRecord[];
}

/**
 * Get diagnostics with filters.
 */
export async function getDiagnostics(filters: {
  project?: string;
  severity?: string;
  file_path?: string;
}): Promise<DiagnosticRecord[]> {
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
  return (data || []) as DiagnosticRecord[];
}

/**
 * Get dependencies with filters.
 */
export async function getDependencies(filters: {
  project?: string;
  name?: string;
  dep_type?: string;
}): Promise<DependencyRecord[]> {
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
  return (data || []) as DependencyRecord[];
}

/**
 * Get metrics for one or all projects.
 */
export async function getMetrics(project?: string): Promise<MetricsRecord[]> {
  const supabase = getSupabase();
  let query = supabase.from('project_metrics').select('*');
  if (project) query = query.eq('project', project);

  const { data, error } = await query;
  if (error) throw new Error(`getMetrics failed: ${error.message}`);
  return (data || []) as MetricsRecord[];
}
