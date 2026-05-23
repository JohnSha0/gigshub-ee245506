
-- 1. localities catalogue
CREATE TABLE public.localities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  district text,
  state text DEFAULT 'Kerala',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Localities readable by authenticated"
  ON public.localities FOR SELECT TO authenticated USING (true);

-- seed
INSERT INTO public.localities (slug, name, district, lat, lng, is_active) VALUES
  ('kuravilangad',  'Kuravilangad',  'Kottayam', 9.7600, 76.5500, true),
  ('kaduthuruthy',  'Kaduthuruthy',  'Kottayam', 9.7100, 76.4900, false),
  ('njeezhoor',     'Njeezhoor',     'Kottayam', 9.7400, 76.5200, false),
  ('pala',          'Pala',          'Kottayam', 9.7100, 76.6800, false),
  ('kottayam',      'Kottayam',      'Kottayam', 9.5916, 76.5222, false),
  ('ettumanoor',    'Ettumanoor',    'Kottayam', 9.6700, 76.5570, false),
  ('changanassery', 'Changanassery', 'Kottayam', 9.4419, 76.5370, false),
  ('vaikom',        'Vaikom',        'Kottayam', 9.7500, 76.4000, false),
  ('bharananganam', 'Bharananganam', 'Kottayam', 9.6900, 76.6500, false),
  ('erattupetta',   'Erattupetta',   'Kottayam', 9.6850, 76.7780, false),
  ('ramapuram',     'Ramapuram',     'Kottayam', 9.7800, 76.7600, false),
  ('mannanam',      'Mannanam',      'Kottayam', 9.6450, 76.5500, false);

-- 2. profiles extensions
ALTER TABLE public.profiles
  ADD COLUMN home_locality_id uuid REFERENCES public.localities(id),
  ADD COLUMN address_text text,
  ADD COLUMN lat double precision,
  ADD COLUMN lng double precision,
  ADD COLUMN extra_locality_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- 3. gigs extensions
ALTER TABLE public.gigs
  ADD COLUMN locality_id uuid REFERENCES public.localities(id);

-- backfill existing gigs to Kuravilangad
UPDATE public.gigs g
SET locality_id = l.id
FROM public.localities l
WHERE l.slug = 'kuravilangad' AND g.locality_id IS NULL;

CREATE INDEX gigs_locality_id_idx ON public.gigs (locality_id);

-- 4. nearby_localities function (Haversine, returns rows within radius)
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
SECURITY DEFINER
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

-- 5. admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
