import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  /** Rendered height in px; width follows the 200×60 artwork. */
  height?: number;
  priority?: boolean;
}

/** The InvoyQ wordmark, linked to `href` (home by default). */
export function Logo({ href = "/", className, height = 40, priority }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center rounded-md", className)}>
      <Image
        src="/logo.svg"
        alt="InvoyQ"
        width={Math.round((height * 200) / 60)}
        height={height}
        priority={priority}
      />
    </Link>
  );
}
