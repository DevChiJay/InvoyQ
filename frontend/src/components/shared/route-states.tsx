"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { logger } from "@/lib/logger";

/** Skeleton shown while a signed-in page's code loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

/** Error boundary content for signed-in routes: says what happened and offers a way forward. */
export function RouteError({ error, reset, homeHref }: { error: Error & { digest?: string }; reset: () => void; homeHref: string }) {
  useEffect(() => {
    logger.error("Route error:", error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={AlertTriangle}
        title="This page didn't load"
        description="Something went wrong on our side. Try again, or go back to the dashboard."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href={homeHref}>Go to dashboard</Link>
            </Button>
          </div>
        }
      />
    </Card>
  );
}
