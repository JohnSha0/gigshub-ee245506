-- Move RLS role checks out of the exposed public API schema.
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Keep the old public helper for server/admin internals only, but do not expose it directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Re-point policies that need admin checks to the private helper.
DROP POLICY IF EXISTS "Admins insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins insert admin actions"
  ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role) AND actor_id = auth.uid());

DROP POLICY IF EXISTS "Admins read admin actions" ON public.admin_actions;
CREATE POLICY "Admins read admin actions"
  ON public.admin_actions FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete any gig" ON public.gigs;
CREATE POLICY "Admins can delete any gig"
  ON public.gigs FOR DELETE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update locality requests" ON public.locality_requests;
CREATE POLICY "Admins update locality requests"
  ON public.locality_requests FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users see their own locality requests" ON public.locality_requests;
CREATE POLICY "Users see their own locality requests"
  ON public.locality_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update reports" ON public.reports;
CREATE POLICY "Admins update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users see their own reports" ON public.reports;
CREATE POLICY "Users see their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can assign any role" ON public.user_roles;
CREATE POLICY "Admins can assign any role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));