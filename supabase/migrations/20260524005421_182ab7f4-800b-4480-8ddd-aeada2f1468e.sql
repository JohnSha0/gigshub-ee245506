
ALTER TABLE public.localities
  ADD COLUMN status text NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'coming_soon', 'inactive'));

UPDATE public.localities SET status = 'active'      WHERE slug = 'kuravilangad';
UPDATE public.localities SET status = 'coming_soon' WHERE slug IN ('kaduthuruthy', 'njeezhoor');

-- Keep is_active in sync via trigger (legacy flag still referenced in older code paths)
CREATE OR REPLACE FUNCTION public.tg_locality_sync_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_locality_sync_active
BEFORE INSERT OR UPDATE OF status ON public.localities
FOR EACH ROW EXECUTE FUNCTION public.tg_locality_sync_active();

-- Add Thalayolaparambu (only this locality is being newly added in this seed)
INSERT INTO public.localities (slug, name, district, lat, lng, status)
VALUES ('thalayolaparambu', 'Thalayolaparambu', 'Kottayam', 9.7400, 76.4200, 'inactive')
ON CONFLICT (slug) DO NOTHING;

-- Locality activation requests
CREATE TABLE public.locality_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  locality_id uuid REFERENCES public.localities(id),
  custom_name text,
  note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (locality_id IS NOT NULL OR (custom_name IS NOT NULL AND length(trim(custom_name)) > 0))
);

ALTER TABLE public.locality_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own locality requests"
  ON public.locality_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their own locality requests"
  ON public.locality_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins update locality requests"
  ON public.locality_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX locality_requests_status_idx ON public.locality_requests (status, created_at DESC);
