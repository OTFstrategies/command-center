-- Hub Roles
CREATE TABLE public.hub_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub Permissions
CREATE TABLE public.hub_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  app VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE public.hub_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.hub_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.hub_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User-Role assignments
CREATE TABLE public.hub_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.hub_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- App Access Control
CREATE TABLE public.hub_app_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app)
);

-- Audit log
CREATE TABLE public.hub_rbac_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_role_id UUID REFERENCES public.hub_roles(id),
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hub_user_roles_user ON public.hub_user_roles(user_id);
CREATE INDEX idx_hub_user_roles_role ON public.hub_user_roles(role_id);
CREATE INDEX idx_hub_app_access_user ON public.hub_app_access(user_id);
CREATE INDEX idx_hub_rbac_audit_user ON public.hub_rbac_audit(target_user_id);;
