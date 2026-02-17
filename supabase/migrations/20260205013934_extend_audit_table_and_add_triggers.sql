-- Add new columns to hub_rbac_audit for more detailed logging
ALTER TABLE hub_rbac_audit ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE hub_rbac_audit ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE hub_rbac_audit ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE hub_rbac_audit ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE hub_rbac_audit ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Function to log RBAC changes
CREATE OR REPLACE FUNCTION log_rbac_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO hub_rbac_audit (action, entity_type, entity_id, new_data, performed_by, details)
    VALUES ('INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), auth.uid(), jsonb_build_object('table', TG_TABLE_NAME));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO hub_rbac_audit (action, entity_type, entity_id, old_data, new_data, performed_by, details)
    VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), jsonb_build_object('table', TG_TABLE_NAME));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO hub_rbac_audit (action, entity_type, entity_id, old_data, performed_by, details)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), auth.uid(), jsonb_build_object('table', TG_TABLE_NAME));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_hub_user_roles ON hub_user_roles;
DROP TRIGGER IF EXISTS audit_hub_role_permissions ON hub_role_permissions;
DROP TRIGGER IF EXISTS audit_hub_app_access ON hub_app_access;
DROP TRIGGER IF EXISTS audit_hub_roles ON hub_roles;

-- Add triggers to RBAC tables
CREATE TRIGGER audit_hub_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON hub_user_roles
  FOR EACH ROW EXECUTE FUNCTION log_rbac_change();

CREATE TRIGGER audit_hub_role_permissions
  AFTER INSERT OR UPDATE OR DELETE ON hub_role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_rbac_change();

CREATE TRIGGER audit_hub_app_access
  AFTER INSERT OR UPDATE OR DELETE ON hub_app_access
  FOR EACH ROW EXECUTE FUNCTION log_rbac_change();

CREATE TRIGGER audit_hub_roles
  AFTER INSERT OR UPDATE OR DELETE ON hub_roles
  FOR EACH ROW EXECUTE FUNCTION log_rbac_change();

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON hub_rbac_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON hub_rbac_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON hub_rbac_audit(entity_type);;
