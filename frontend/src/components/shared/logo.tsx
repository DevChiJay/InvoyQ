import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  /** Rendered height in px; width follows the 200×60 artwork. */
  height?: number;
  /** Kept so call sites can mark the logo as above-the-fold; the logo is inline SVG, so it never needs preloading. */
  priority?: boolean;
}

/**
 * The InvoyQ wordmark, linked to `href` (home by default).
 *
 * Inline SVG instead of an <img> so the wordmark text follows the theme (dark text on light,
 * light text on dark). The indigo icon and the "Q" stay the brand colour in both.
 */
export function Logo({ href = "/", className, height = 40 }: LogoProps) {
  return (
    <Link href={href} aria-label="InvoyQ home" className={cn("inline-flex shrink-0 items-center rounded-md", className)}>
      <svg
        width={Math.round((height * 200) / 60)}
        height={height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <rect x="8" y="10" width="32" height="40" rx="4" fill="#6366F1" opacity="0.1" />
        <rect x="4" y="6" width="32" height="40" rx="4" fill="#6366F1" />
        <line x1="10" y1="14" x2="30" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="20" x2="26" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="26" x2="28" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="32" r="8" fill="white" />
        <circle cx="20" cy="32" r="5.5" fill="#6366F1" />
        <path d="M 23 36 L 26 39" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <text x="48" y="38" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" className="fill-foreground">
          Invoy
        </text>
        <text x="128" y="38" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#6366F1">
          Q
        </text>
        <text
          x="48"
          y="52"
          fontFamily="Arial, sans-serif"
          fontSize="9"
          fontWeight="400"
          letterSpacing="0.5"
          className="fill-muted-foreground"
        >
          DIGITAL INVOICING
        </text>
      </svg>
    </Link>
  );
}
