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
