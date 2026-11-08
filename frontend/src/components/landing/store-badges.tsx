import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

/** Google Play and App Store badges at the same visual height. */
export default function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {/* The Play artwork has built-in padding, so it is drawn slightly taller to match. */}
        <Image src="/google-play.png" alt="Get it on Google Play" width={646} height={250} className="h-[52px] w-auto" />
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Image src="/appstore.png" alt="Download on the App Store" width={412} height={122} className="h-10 w-auto" />
      </a>
    </div>
  );
}
