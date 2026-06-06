-- Bootstrap admin role for floq.gigs@gmail.com; revoke from prior bootstrap account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'floq.gigs@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE role = 'admin'::public.app_role
  AND user_id IN (SELECT id FROM auth.users WHERE email = 'floq@gmail.com');
