
-- Fix linter: nearby_localities only reads a public-readable table; SECURITY INVOKER is fine.
CREATE OR REPLACE FUNCTION public.nearby_localities(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 10
) RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  is_active boolean,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.id, l.slug, l.name, l.is_active,
    (2 * 6371 * asin(sqrt(
      power(sin(radians((l.lat - p_lat) / 2)), 2) +
      cos(radians(p_lat)) * cos(radians(l.lat)) *
      power(sin(radians((l.lng - p_lng) / 2)), 2)
    )))::double precision AS distance_km
  FROM public.localities l
  WHERE (2 * 6371 * asin(sqrt(
      power(sin(radians((l.lat - p_lat) / 2)), 2) +
      cos(radians(p_lat)) * cos(radians(l.lat)) *
      power(sin(radians((l.lng - p_lng) / 2)), 2)
    ))) <= p_radius_km
  ORDER BY distance_km ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.nearby_localities(double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nearby_localities(double precision, double precision, double precision) TO authenticated;

-- Admin moderation: audit table
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read admin actions"
  ON public.admin_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert admin actions"
  ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- Admin policies on existing tables
CREATE POLICY "Admins can delete any gig"
  ON public.gigs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all user_roles (for the user list)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper to block/unblock users (only admins can call)
CREATE OR REPLACE FUNCTION public.set_user_blocked(
  p_user_id uuid,
  p_blocked boolean,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles SET is_blocked = p_blocked WHERE id = p_user_id;

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

REVOKE EXECUTE ON FUNCTION public.set_user_blocked(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_blocked(uuid, boolean, text) TO authenticated;
