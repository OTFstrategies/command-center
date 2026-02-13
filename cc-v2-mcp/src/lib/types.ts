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
  analyzed_at?: string;
}

export interface AnalysisResult {
  project: string;
  symbols: SymbolRecord[];
  references: ReferenceRecord[];
  diagnostics: DiagnosticRecord[];
  dependencies: DependencyRecord[];
  metrics: MetricsRecord;
}
