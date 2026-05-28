import { ShieldCheck, MapPin, BadgeCheck, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustSignal =
  | "email_verified"
  | "phone_verified"
  | "profile_complete"
  | "locality_set"
  | "new_member"
  | "blocked";

interface TrustBadgesProps {
  signals: TrustSignal[];
  /** Compact pill style for headers/cards; default uses chip style. */
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Show only the icons (no labels) — for very tight spaces like card corners. */
  iconOnly?: boolean;
}

const META: Record<
  TrustSignal,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: "good" | "info" | "warn" }
> = {
  email_verified: { label: "Email verified", icon: BadgeCheck, tone: "good" },
  phone_verified: { label: "Phone verified", icon: ShieldCheck, tone: "good" },
  profile_complete: { label: "Profile complete", icon: ShieldCheck, tone: "good" },
  locality_set: { label: "Locality set", icon: MapPin, tone: "info" },
  new_member: { label: "New member", icon: Sparkles, tone: "info" },
  blocked: { label: "Account restricted", icon: AlertTriangle, tone: "warn" },
};

const TONE_CLS: Record<"good" | "info" | "warn", string> = {
  good: "bg-success/10 text-success border-success/20",
  info: "bg-primary-soft text-primary border-primary/15",
  warn: "bg-destructive/10 text-destructive border-destructive/20",
};

export function TrustBadges({ signals, size = "sm", className, iconOnly = false }: TrustBadgesProps) {
  if (!signals.length) return null;
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {signals.map((s) => {
        const m = META[s];
        const Icon = m.icon;
        return (
          <span
            key={s}
            title={m.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-medium",
              padding,
              TONE_CLS[m.tone],
            )}
          >
            <Icon className={iconSize} />
            {!iconOnly && <span>{m.label}</span>}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Compute trust signals from common inputs. Pure helper — pass whatever
 * pieces of data are available; missing ones simply don't contribute.
 */
export function deriveTrustSignals(input: {
  emailConfirmedAt?: string | null;
  phoneConfirmedAt?: string | null;
  hasLocality?: boolean;
  profileFields?: Array<string | null | undefined>; // strings considered complete when truthy
  createdAt?: string | null;
  isBlocked?: boolean;
}): TrustSignal[] {
  const out: TrustSignal[] = [];
  if (input.isBlocked) out.push("blocked");
  if (input.emailConfirmedAt) out.push("email_verified");
  if (input.phoneConfirmedAt) out.push("phone_verified");
  if (input.hasLocality) out.push("locality_set");
  if (input.profileFields && input.profileFields.length) {
    const filled = input.profileFields.filter((v) => !!v && String(v).trim().length > 0).length;
    if (filled === input.profileFields.length) out.push("profile_complete");
  }
  if (input.createdAt) {
    const ageDays = (Date.now() - new Date(input.createdAt).getTime()) / 86_400_000;
    if (ageDays < 14 && !out.includes("email_verified")) out.push("new_member");
  }
  return out;
}

/** Lightweight numeric completeness 0..1 for progress meters. */
export function profileCompleteness(fields: Array<string | null | undefined>): number {
  if (!fields.length) return 0;
  const filled = fields.filter((v) => !!v && String(v).trim().length > 0).length;
  return filled / fields.length;
}
