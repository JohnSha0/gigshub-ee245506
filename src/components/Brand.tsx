import logoUrl from "@/assets/floq-logo.png";

export const BRAND_NAME = "Floq";
export const BRAND_TAGLINE = "Quick gigs near you";
export const BRAND_LOGO_URL = logoUrl;

export function BrandMark({
  showName = true,
  size = "md",
}: {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div className="flex items-center gap-2">
      <img
        src={logoUrl}
        alt="Floq logo"
        className={`${dim} object-contain`}
        loading="eager"
        decoding="async"
      />
      {showName && (
        <span className="font-display text-base font-bold tracking-tight bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
