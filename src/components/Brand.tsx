import logoAsset from "@/assets/fledg-mark.png.asset.json";

export const BRAND_NAME = "Fledg";
export const BRAND_TAGLINE = "Quick gigs near you";
export const BRAND_LOGO_URL = logoAsset.url;

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
        src={BRAND_LOGO_URL}
        alt="Fledg — hyper-local gig marketplace"
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

/**
 * Compact line-art Fledg mark for footers, compact nav, and lightweight
 * branding placements. Uses the same canonical logo asset as BrandMark so
 * the visual identity stays consistent across the app.
 */
export function BrandGlyph({
  className = "",
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt={`${BRAND_NAME} mark`}
      width={size}
      height={size}
      className={`inline-block object-contain ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
