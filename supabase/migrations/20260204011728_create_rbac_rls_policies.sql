-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_hub_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hub_user_roles ur
    JOIN public.hub_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(target_user_id UUID)
RETURNS TABLE(permission_code VARCHAR, app VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.code, p.app
  FROM public.hub_user_roles ur
  JOIN public.hub_role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.hub_permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's accessible apps
CREATE OR REPLACE FUNCTION public.get_user_apps(target_user_id UUID)
RETURNS TABLE(app VARCHAR, enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT aa.app, aa.enabled
  FROM public.hub_app_access aa
  WHERE aa.user_id = target_user_id AND aa.enabled = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.hub_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_rbac_audit ENABLE ROW LEVEL SECURITY;

-- Read policies (all authenticated users can read roles/permissions)
CREATE POLICY "Authenticated users can read roles" ON public.hub_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read permissions" ON public.hub_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read role_permissions" ON public.hub_role_permissions
  FOR SELECT TO authenticated USING (true);

-- Users can read their own assignments
CREATE POLICY "Users can read own user_roles" ON public.hub_user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_hub_admin());

CREATE POLICY "Users can read own app_access" ON public.hub_app_access
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_hub_admin());

-- Admin write policies
CREATE POLICY "Admins can manage roles" ON public.hub_roles
  FOR ALL TO authenticated USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

CREATE POLICY "Admins can manage role_permissions" ON public.hub_role_permissions
  FOR ALL TO authenticated USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

CREATE POLICY "Admins can manage user_roles" ON public.hub_user_roles
  FOR ALL TO authenticated USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

CREATE POLICY "Admins can manage app_access" ON public.hub_app_access
  FOR ALL TO authenticated USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

CREATE POLICY "Admins can read audit" ON public.hub_rbac_audit
  FOR SELECT TO authenticated USING (public.is_hub_admin());

CREATE POLICY "System can insert audit" ON public.hub_rbac_audit
  FOR INSERT TO authenticated WITH CHECK (true);;
