import logoUrl from "@/assets/floq-logo.png";

export const BRAND_NAME = "Fledg";
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
 * Minimal line-art monogram derived from the Fledg logo.
 * Use in footers, compact nav, and lightweight branding placements
 * where the full raster logo would feel heavy.
 */
export function BrandGlyph({
  className = "",
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={`${BRAND_NAME} mark`}
      role="img"
    >
      {/* Stylised F + spark — feather-light monogram */}
      <path d="M6 4h11" />
      <path d="M6 4v16" />
      <path d="M6 12h8" />
      <circle cx="18.5" cy="18.5" r="2" />
    </svg>
  );
}
