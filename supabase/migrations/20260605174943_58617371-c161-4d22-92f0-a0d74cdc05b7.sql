-- Stop exposing the old full-profile SECURITY DEFINER helper through the public API.
-- The app now reads owner-only sensitive profile fields through an authenticated server function.
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO service_role;

-- Admin block/unblock does not need SECURITY DEFINER: admin RLS policies now use
-- app_private.has_role(), so a real admin caller can update profiles and write audit rows
-- under normal invoker permissions, while non-admin callers are rejected.
CREATE OR REPLACE FUNCTION public.set_user_blocked(p_user_id uuid, p_blocked boolean, p_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT app_private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET is_blocked = p_blocked
  WHERE id = p_user_id;

  INSERT INTO public.admin_actions (actor_id, action, target_type, target_id, reason)
  VALUES (
    auth.uid(),
    CASE WHEN p_blocked THEN 'block_user' ELSE 'unblock_user' END,
    'profile',
    p_user_id,
    p_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_blocked(uuid, boolean, text) TO authenticated, service_role;