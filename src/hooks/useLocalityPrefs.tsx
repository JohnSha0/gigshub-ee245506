import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLocalities,
  fetchNearby,
  DEFAULT_NEARBY_RADIUS_KM,
  type Locality,
} from "@/lib/locality";

export interface LocalityPrefs {
  loading: boolean;
  localities: Locality[];
  homeId: string | null;
  extraIds: string[];
  /** Home + extras (deduped). Empty array means "no filter / all". */
  effectiveIds: string[];
  /** Localities derived from effectiveIds. */
  selected: Locality[];
  setHome: (l: Locality) => Promise<void>;
  toggleExtra: (l: Locality, on: boolean) => Promise<void>;
  saveGps: (lat: number, lng: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLocalityPrefs(userId: string | null | undefined): LocalityPrefs {
  const [loading, setLoading] = useState(true);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [all, prof] = await Promise.all([
      fetchLocalities().catch(() => [] as Locality[]),
      supabase
        .from("profiles")
        .select("home_locality_id, extra_locality_ids")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    setLocalities(all);
    setHomeId(prof.data?.home_locality_id ?? null);
    setExtraIds((prof.data?.extra_locality_ids as string[] | null) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setHome = useCallback(
    async (l: Locality) => {
      if (!userId) return;
      setHomeId(l.id);
      await supabase.from("profiles").update({ home_locality_id: l.id }).eq("id", userId);
    },
    [userId],
  );

  const toggleExtra = useCallback(
    async (l: Locality, on: boolean) => {
      if (!userId) return;
      const next = on
        ? Array.from(new Set([...extraIds, l.id]))
        : extraIds.filter((x) => x !== l.id);
      setExtraIds(next);
      await supabase
        .from("profiles")
        .update({ extra_locality_ids: next })
        .eq("id", userId);
    },
    [extraIds, userId],
  );

  const saveGps = useCallback(
    async (lat: number, lng: number) => {
      if (!userId) return;
      const nearby = await fetchNearby(lat, lng, DEFAULT_NEARBY_RADIUS_KM).catch(() => []);
      const matchedIds = nearby.map((n) => n.id);
      const updates: Record<string, unknown> = { lat, lng };
      // If user has no home yet, auto-assign closest active one.
      let nextHome = homeId;
      if (!homeId && nearby.length > 0) {
        const active = nearby.find((n) => n.is_active) ?? nearby[0];
        nextHome = active.id;
        updates.home_locality_id = active.id;
        setHomeId(active.id);
      }
      // Merge nearby into extras (minus home).
      const merged = Array.from(new Set([...extraIds, ...matchedIds])).filter(
        (id) => id !== nextHome,
      );
      updates.extra_locality_ids = merged;
      setExtraIds(merged);
      await supabase.from("profiles").update(updates).eq("id", userId);
    },
    [userId, homeId, extraIds],
  );

  const effectiveIds = Array.from(new Set([homeId, ...extraIds].filter(Boolean) as string[]));
  const byId = new Map(localities.map((l) => [l.id, l]));
  const selected = effectiveIds.map((id) => byId.get(id)).filter(Boolean) as Locality[];

  return {
    loading,
    localities,
    homeId,
    extraIds,
    effectiveIds,
    selected,
    setHome,
    toggleExtra,
    saveGps,
    refresh: load,
  };
}
