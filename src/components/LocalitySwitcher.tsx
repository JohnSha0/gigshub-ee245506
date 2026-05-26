import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";

import { LocalityPicker } from "@/components/LocalityPicker";
import { statusClass, statusLabel, type Locality } from "@/lib/locality";
import type { LocalityPrefs } from "@/hooks/useLocalityPrefs";

interface Props {
  prefs: LocalityPrefs;
  userId: string;
}

export function LocalitySwitcher({ prefs, userId }: Props) {
  const [open, setOpen] = useState(false);
  const home = prefs.selected.find((l) => l.id === prefs.homeId) ?? prefs.selected[0];
  const extras = prefs.selected.filter((l) => l.id !== prefs.homeId);

  const handleSelect = async (l: Locality) => {
    await prefs.setHome(l);
  };
  const handleToggle = async (l: Locality, on: boolean) => {
    if (l.id === prefs.homeId) return; // can't toggle home
    await prefs.toggleExtra(l, on);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-primary md:text-sm"
        aria-label="Change locality"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate max-w-[120px] md:max-w-[200px]">
          {home ? home.name : "Pick locality"}
        </span>
        {extras.length > 0 && (
          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            +{extras.length}
          </span>
        )}
        {home && (
          <span
            className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline ${statusClass(home.status)}`}
          >
            {statusLabel(home.status)}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      <LocalityPicker
        open={open}
        onOpenChange={setOpen}
        selectedIds={prefs.effectiveIds}
        title={home ? "Your localities" : "Pick your locality"}
        requesterId={userId}
        onSelect={handleSelect}
        onToggle={handleToggle}
        onGps={(lat, lng) => void prefs.saveGps(lat, lng)}
      />
    </>
  );
}
