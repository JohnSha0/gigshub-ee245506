import { supabase } from "@/integrations/supabase/client";

export type LocalityStatus = "active" | "coming_soon" | "inactive";

export interface Locality {
  id: string;
  slug: string;
  name: string;
  district: string | null;
  lat: number;
  lng: number;
  status: LocalityStatus;
}

export interface NearbyMatch {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  distance_km: number;
}

export const DEFAULT_NEARBY_RADIUS_KM = 10;

export async function fetchLocalities(): Promise<Locality[]> {
  const { data, error } = await supabase
    .from("localities")
    .select("id, slug, name, district, lat, lng, status")
    .order("status", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Locality[];
}

export async function fetchNearby(
  lat: number,
  lng: number,
  radiusKm = DEFAULT_NEARBY_RADIUS_KM,
): Promise<NearbyMatch[]> {
  const { data, error } = await supabase.rpc("nearby_localities", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });
  if (error) throw error;
  return (data ?? []) as NearbyMatch[];
}

export function statusLabel(s: LocalityStatus) {
  switch (s) {
    case "active":
      return "Active";
    case "coming_soon":
      return "Coming soon";
    case "inactive":
      return "Inactive";
  }
}

export function statusClass(s: LocalityStatus) {
  switch (s) {
    case "active":
      return "bg-primary-soft text-primary";
    case "coming_soon":
      return "bg-accent/15 text-accent";
    case "inactive":
      return "bg-secondary text-muted-foreground";
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60_000,
    });
  });
}
