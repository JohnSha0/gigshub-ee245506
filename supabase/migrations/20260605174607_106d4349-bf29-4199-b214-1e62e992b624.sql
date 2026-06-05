-- Restore execute access required by RLS policies that call has_role().
-- Without this, ordinary authenticated role/profile queries fail with
-- "permission denied for function has_role" before RLS can evaluate correctly.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- One-time admin bootstrap for the existing platform account that currently has no role.
-- Admin authority remains stored only in public.user_roles and enforced by RLS.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'floq@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role = 'admin'::public.app_role
  );