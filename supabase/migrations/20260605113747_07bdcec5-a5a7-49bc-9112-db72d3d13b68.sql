
-- Restore baseline grants on all public tables.
-- (Earlier migration revoked SELECT on profiles but the side-effect wiped all grants
--  from authenticated/anon/service_role on every public table.)

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Tables that authenticated users need full DML on (RLS gates the rows).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.applications,
  public.connections,
  public.gig_tags,
  public.gigs,
  public.locality_requests,
  public.messages,
  public.profile_skills,
  public.reports,
  public.threads,
  public.user_roles
TO authenticated;

-- Read-only reference tables.
GRANT SELECT ON public.skills, public.localities TO authenticated;
GRANT SELECT ON public.skills, public.localities TO anon;

-- Admin-only audit table — read/insert handled by RLS + has_role.
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

-- Sequences for any tables with serial PKs (defensive; gen_random_uuid PKs don't need it).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Profiles: column-level SELECT for non-sensitive fields; INSERT/UPDATE/DELETE table-level
-- (RLS already restricts to auth.uid() = id). Sensitive columns (phone, address_text, lat, lng,
-- is_blocked) stay readable only via the owner-only get_my_profile() RPC.
GRANT SELECT
  (id, display_name, avatar_url, bio, location, home_locality_id, extra_locality_ids, created_at, updated_at)
ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
