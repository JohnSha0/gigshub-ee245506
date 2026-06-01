
-- 1) Restrict sensitive profile columns from non-owners via column-level privileges
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, bio, location, home_locality_id, extra_locality_ids, created_at, updated_at)
  ON public.profiles TO authenticated;

-- Owner self-read of full profile (including sensitive fields) via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 2) Prevent users from inserting unsolicited threads — require application/connection
DROP POLICY IF EXISTS "Participants can insert threads" ON public.threads;
CREATE POLICY "Participants can insert threads"
  ON public.threads FOR INSERT TO authenticated
  WITH CHECK (
    (student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.gig_id = threads.gig_id AND a.student_id = auth.uid()
    ))
    OR
    (provider_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = threads.gig_id AND g.provider_id = auth.uid()
    ))
  );

-- 3) Prevent privilege escalation: users cannot self-assign 'admin'
DROP POLICY IF EXISTS "Users can assign themselves a role" ON public.user_roles;
CREATE POLICY "Users can assign themselves non-admin roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role <> 'admin');

CREATE POLICY "Admins can assign any role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Lock down realtime.messages (Broadcast/Presence) — deny by default
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny all realtime broadcast" ON realtime.messages;
CREATE POLICY "deny all realtime broadcast"
  ON realtime.messages FOR SELECT TO authenticated
  USING (false);
