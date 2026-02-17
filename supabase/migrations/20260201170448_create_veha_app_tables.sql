
-- VEHA App enums
CREATE TYPE employee_role AS ENUM ('uitvoerder', 'voorman', 'specialist', 'projectleider');
CREATE TYPE availability_status AS ENUM ('beschikbaar', 'ziek', 'vakantie', 'vrij', 'training');
CREATE TYPE work_type AS ENUM ('straatwerk', 'kitwerk', 'reinigen', 'kantoor', 'overig');
CREATE TYPE project_status AS ENUM ('gepland', 'actief', 'on-hold', 'afgerond', 'geannuleerd');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE dependency_type AS ENUM ('FS', 'SS', 'FF', 'SF');
CREATE TYPE equipment_type AS ENUM ('voertuig', 'machine', 'gereedschap');
CREATE TYPE equipment_status AS ENUM ('beschikbaar', 'in_gebruik', 'onderhoud', 'defect');

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client contacts
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  role VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client locations
CREATE TABLE client_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name VARCHAR NOT NULL,
  role employee_role NOT NULL DEFAULT 'uitvoerder',
  email VARCHAR,
  phone VARCHAR,
  hourly_rate NUMERIC DEFAULT 0,
  weekly_capacity INTEGER DEFAULT 40,
  skills TEXT[] DEFAULT '{}',
  color VARCHAR DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Employee availability
CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status availability_status NOT NULL DEFAULT 'beschikbaar',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  location_id UUID REFERENCES client_locations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  work_type work_type NOT NULL DEFAULT 'overig',
  status project_status NOT NULL DEFAULT 'gepland',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id),
  wbs VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 1,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_milestone BOOLEAN DEFAULT false,
  is_summary BOOLEAN DEFAULT false,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'normal',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task dependencies
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type NOT NULL DEFAULT 'FS',
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task assignments
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  planned_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Time entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  equipment_type equipment_type NOT NULL,
  license_plate VARCHAR,
  daily_rate NUMERIC DEFAULT 0,
  status equipment_status NOT NULL DEFAULT 'beschikbaar',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment assignments
CREATE TABLE equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all VEHA tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;
;
