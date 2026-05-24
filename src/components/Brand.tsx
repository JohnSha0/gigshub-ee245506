import { Sparkles } from "lucide-react";

export const BRAND_NAME = "Gigs Hub";
export const BRAND_TAGLINE = "Quick gigs near you";

export function BrandMark({
  showName = true,
  size = "md",
}: {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${dim} items-center justify-center rounded-2xl bg-primary text-primary-foreground`}>
        <Sparkles className={icon} />
      </div>
      {showName && (
        <span className="font-display text-base font-bold tracking-tight">
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
