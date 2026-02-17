
-- 1. Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF uuid AS $$
  SELECT workspace_id
  FROM public.workspace_members
  WHERE profile_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role_in_workspace(ws_id uuid)
RETURNS user_role AS $$
DECLARE
  user_role_result public.user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.workspace_members
  WHERE workspace_id = ws_id AND profile_id = auth.uid();
  RETURN user_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- 2. Fix CLIENTS policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

-- 3. Fix PROJECTS policies
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

-- 4. Fix EMPLOYEES policies
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON employees;

CREATE POLICY "employees_select" ON employees FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "employees_insert" ON employees FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "employees_update" ON employees FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "employees_delete" ON employees FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

-- 5. Fix EQUIPMENT policies
DROP POLICY IF EXISTS "Authenticated users can manage equipment" ON equipment;

CREATE POLICY "equipment_select" ON equipment FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "equipment_insert" ON equipment FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "equipment_update" ON equipment FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "equipment_delete" ON equipment FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

-- 6. Fix TASKS policies (via project)
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON tasks;

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids())));

-- 7. Fix TASK_ASSIGNMENTS policies
DROP POLICY IF EXISTS "Authenticated users can manage task_assignments" ON task_assignments;

CREATE POLICY "task_assignments_select" ON task_assignments FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT
  WITH CHECK (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "task_assignments_update" ON task_assignments FOR UPDATE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "task_assignments_delete" ON task_assignments FOR DELETE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

-- 8. Fix TASK_DEPENDENCIES policies
DROP POLICY IF EXISTS "Authenticated users can manage task_dependencies" ON task_dependencies;

CREATE POLICY "task_dependencies_select" ON task_dependencies FOR SELECT
  USING (predecessor_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "task_dependencies_insert" ON task_dependencies FOR INSERT
  WITH CHECK (predecessor_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "task_dependencies_delete" ON task_dependencies FOR DELETE
  USING (predecessor_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

-- 9. Fix CLIENT_CONTACTS policies
DROP POLICY IF EXISTS "Authenticated users can manage client_contacts" ON client_contacts;

CREATE POLICY "client_contacts_select" ON client_contacts FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_contacts_insert" ON client_contacts FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_contacts_update" ON client_contacts FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_contacts_delete" ON client_contacts FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

-- 10. Fix CLIENT_LOCATIONS policies
DROP POLICY IF EXISTS "Authenticated users can manage client_locations" ON client_locations;

CREATE POLICY "client_locations_select" ON client_locations FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_locations_insert" ON client_locations FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_locations_update" ON client_locations FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "client_locations_delete" ON client_locations FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE workspace_id IN (SELECT get_user_workspace_ids())));

-- 11. Fix EMPLOYEE_AVAILABILITY policies
DROP POLICY IF EXISTS "Authenticated users can manage employee_availability" ON employee_availability;

CREATE POLICY "employee_availability_select" ON employee_availability FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "employee_availability_insert" ON employee_availability FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "employee_availability_update" ON employee_availability FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE workspace_id IN (SELECT get_user_workspace_ids())));

CREATE POLICY "employee_availability_delete" ON employee_availability FOR DELETE
  USING (employee_id IN (SELECT id FROM employees WHERE workspace_id IN (SELECT get_user_workspace_ids())));

-- 12. Fix EQUIPMENT_ASSIGNMENTS policies
DROP POLICY IF EXISTS "Authenticated users can manage equipment_assignments" ON equipment_assignments;

CREATE POLICY "equipment_assignments_select" ON equipment_assignments FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "equipment_assignments_insert" ON equipment_assignments FOR INSERT
  WITH CHECK (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "equipment_assignments_update" ON equipment_assignments FOR UPDATE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "equipment_assignments_delete" ON equipment_assignments FOR DELETE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

-- 13. Fix TIME_ENTRIES policies
DROP POLICY IF EXISTS "Authenticated users can manage time_entries" ON time_entries;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE
  USING (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT get_user_workspace_ids()))));

-- 14. Fix WORKSPACES policies
DROP POLICY IF EXISTS "Authenticated users can view workspaces" ON workspaces;
DROP POLICY IF EXISTS "Authenticated users can insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Authenticated users can update workspaces" ON workspaces;

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT
  USING (id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE
  USING (id IN (SELECT get_user_workspace_ids()));
;
