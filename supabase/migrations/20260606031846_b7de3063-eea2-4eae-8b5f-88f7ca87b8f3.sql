-- Remove unused tables from realtime publication; messages stays (RLS enforced for postgres_changes when client is authenticated)
ALTER PUBLICATION supabase_realtime DROP TABLE public.applications;
ALTER PUBLICATION supabase_realtime DROP TABLE public.connections;

-- Drop the duplicate public.has_role; policies use app_private.has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);