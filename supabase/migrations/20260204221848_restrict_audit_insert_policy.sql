-- Restrict audit log INSERT to admins only
-- Previously: WITH CHECK (true) allowed any authenticated user

DROP POLICY IF EXISTS "System can insert audit" ON hub_rbac_audit;

CREATE POLICY "Admins can insert audit"
ON hub_rbac_audit
FOR INSERT
TO authenticated
WITH CHECK (is_hub_admin());;
