-- Create material enums
CREATE TYPE material_type AS ENUM ('verbruiksmateriaal', 'voorraad', 'onderdelen');
CREATE TYPE material_status AS ENUM ('op_voorraad', 'bijna_op', 'besteld', 'niet_beschikbaar');

-- Materials table for inventory management
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  material_type material_type NOT NULL DEFAULT 'verbruiksmateriaal',
  unit VARCHAR(50) DEFAULT 'stuk',
  unit_price DECIMAL(10,2) DEFAULT 0,
  quantity_in_stock DECIMAL(10,2) DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  status material_status DEFAULT 'op_voorraad',
  supplier VARCHAR(255),
  supplier_article_number VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material assignments to projects/tasks
CREATE TABLE material_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_materials_workspace ON materials(workspace_id);
CREATE INDEX idx_materials_type ON materials(material_type);
CREATE INDEX idx_materials_active ON materials(is_active);
CREATE INDEX idx_material_assignments_material ON material_assignments(material_id);
CREATE INDEX idx_material_assignments_project ON material_assignments(project_id);

-- Trigger for updated_at
CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Materials
CREATE POLICY materials_select ON materials FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()));

CREATE POLICY materials_insert ON materials FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()));

CREATE POLICY materials_update ON materials FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()));

CREATE POLICY materials_delete ON materials FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid() AND role = 'admin'));

-- RLS Policies for Material Assignments
CREATE POLICY material_assignments_select ON material_assignments FOR SELECT
  USING (material_id IN (
    SELECT m.id FROM materials m
    WHERE m.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid())
  ));

CREATE POLICY material_assignments_insert ON material_assignments FOR INSERT
  WITH CHECK (material_id IN (
    SELECT m.id FROM materials m
    WHERE m.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid())
  ));

CREATE POLICY material_assignments_update ON material_assignments FOR UPDATE
  USING (material_id IN (
    SELECT m.id FROM materials m
    WHERE m.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid())
  ));

CREATE POLICY material_assignments_delete ON material_assignments FOR DELETE
  USING (material_id IN (
    SELECT m.id FROM materials m
    WHERE m.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid())
  ));;
