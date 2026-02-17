-- Basic RLS policies voor VEHA App tabellen

-- Clients - alle authenticated users
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON public.clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Client Contacts
CREATE POLICY "Authenticated users can manage client_contacts" ON public.client_contacts
  FOR ALL USING (auth.role() = 'authenticated');

-- Client Locations
CREATE POLICY "Authenticated users can manage client_locations" ON public.client_locations
  FOR ALL USING (auth.role() = 'authenticated');

-- Projects
CREATE POLICY "Authenticated users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" ON public.projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" ON public.projects
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
CREATE POLICY "Authenticated users can manage tasks" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- Task Dependencies
CREATE POLICY "Authenticated users can manage task_dependencies" ON public.task_dependencies
  FOR ALL USING (auth.role() = 'authenticated');

-- Task Assignments
CREATE POLICY "Authenticated users can manage task_assignments" ON public.task_assignments
  FOR ALL USING (auth.role() = 'authenticated');

-- Employees
CREATE POLICY "Authenticated users can manage employees" ON public.employees
  FOR ALL USING (auth.role() = 'authenticated');

-- Employee Availability
CREATE POLICY "Authenticated users can manage employee_availability" ON public.employee_availability
  FOR ALL USING (auth.role() = 'authenticated');

-- Equipment
CREATE POLICY "Authenticated users can manage equipment" ON public.equipment
  FOR ALL USING (auth.role() = 'authenticated');

-- Equipment Assignments
CREATE POLICY "Authenticated users can manage equipment_assignments" ON public.equipment_assignments
  FOR ALL USING (auth.role() = 'authenticated');

-- Time Entries
CREATE POLICY "Authenticated users can manage time_entries" ON public.time_entries
  FOR ALL USING (auth.role() = 'authenticated');

-- Workspace Members - toevoegen voor insert
CREATE POLICY "Authenticated users can insert workspace_members" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Workspaces - toevoegen voor insert en update
CREATE POLICY "Authenticated users can insert workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workspaces" ON public.workspaces
  FOR UPDATE USING (auth.role() = 'authenticated');;
