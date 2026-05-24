import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Navigation, Check, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  fetchLocalities,
  getCurrentPosition,
  statusClass,
  statusLabel,
  type Locality,
} from "@/lib/locality";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-selected locality ids (will show check, can be toggled off). */
  selectedIds?: string[];
  /** If true, only active localities can be picked. */
  activeOnly?: boolean;
  /** Single-select returns the locality and closes. */
  onSelect?: (l: Locality) => void;
  /** Multi-select: emit the new full list (existing + new). */
  onToggle?: (l: Locality, nowSelected: boolean) => void;
  /** Tell parent we used GPS so it can persist coords. */
  onGps?: (lat: number, lng: number) => void;
  title?: string;
  requesterId?: string;
}

export function LocalityPicker({
  open,
  onOpenChange,
  selectedIds = [],
  activeOnly = false,
  onSelect,
  onToggle,
  onGps,
  title = "Choose locality",
  requesterId,
}: Props) {
  const [all, setAll] = useState<Locality[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLocalities()
      .then((d) => setAll(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t
      ? all.filter(
          (l) =>
            l.name.toLowerCase().includes(t) ||
            (l.district ?? "").toLowerCase().includes(t),
        )
      : all;
    if (activeOnly) return list.filter((l) => l.status === "active");
    return list;
  }, [all, q, activeOnly]);

  const detect = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      onGps?.(pos.coords.latitude, pos.coords.longitude);
      toast.success("Location detected — nearby places matched");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get location");
    } finally {
      setGpsLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!requesterId) {
      toast.error("Sign in first");
      return;
    }
    const name = requestName.trim();
    if (name.length < 2) {
      toast.error("Type a locality name");
      return;
    }
    const { error } = await supabase
      .from("locality_requests")
      .insert({ requester_id: requesterId, custom_name: name });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request sent — we'll review it soon");
    setRequestName("");
    setShowRequest(false);
  };

  const pick = (l: Locality) => {
    if (activeOnly && l.status !== "active") {
      toast.info(`${l.name} is ${statusLabel(l.status).toLowerCase()} — not yet open for gigs.`);
      return;
    }
    const has = selectedIds.includes(l.id);
    if (onToggle) {
      onToggle(l, !has);
    } else if (onSelect) {
      onSelect(l);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pick your town. We'll match nearby ones automatically.
          </p>
        </SheetHeader>
        <div className="space-y-4 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search localities"
              className="h-11 rounded-full pl-10"
            />
          </div>

          {onGps && (
            <Button
              type="button"
              variant="secondary"
              onClick={detect}
              disabled={gpsLoading}
              className="h-11 w-full rounded-full"
            >
              <Navigation className="mr-1.5 h-4 w-4" />
              {gpsLoading ? "Detecting…" : "Use my current location"}
            </Button>
          )}

          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No match. You can request a new locality below.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((l) => {
                const sel = selectedIds.includes(l.id);
                const disabled = activeOnly && l.status !== "active";
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => pick(l)}
                      disabled={disabled}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                        sel
                          ? "border-primary bg-primary-soft/40"
                          : "border-border bg-surface hover:border-primary"
                      } ${disabled ? "opacity-60" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{l.name}</p>
                          {l.district && (
                            <p className="truncate text-xs text-muted-foreground">
                              {l.district}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusClass(l.status)}`}
                        >
                          {statusLabel(l.status)}
                        </span>
                        {sel && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-2xl border border-dashed border-border p-4">
            {showRequest ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Request a new locality</p>
                <Input
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="e.g. Pala, Mannanam…"
                  maxLength={80}
                  className="h-10 rounded-xl"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 flex-1 rounded-full"
                    onClick={submitRequest}
                  >
                    Send request
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-full"
                    onClick={() => setShowRequest(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRequest(true)}
                className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Request a new locality
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
