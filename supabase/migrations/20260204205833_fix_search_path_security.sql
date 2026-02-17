-- Fix search_path vulnerability in all RBAC functions
-- This is a security fix recommended by Supabase security linter

-- Fix is_hub_admin function (keep exact same signature)
CREATE OR REPLACE FUNCTION is_hub_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hub_user_roles ur
    JOIN public.hub_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
  );
END;
$$;

-- Fix get_user_permissions function (keep exact same signature)
CREATE OR REPLACE FUNCTION get_user_permissions(target_user_id uuid)
RETURNS TABLE (permission_code character varying, app character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.code, p.app
  FROM public.hub_user_roles ur
  JOIN public.hub_role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.hub_permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = target_user_id;
END;
$$;

-- Fix get_all_users function (keep exact same signature)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_hub_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  ORDER BY u.email;
END;
$$;;
