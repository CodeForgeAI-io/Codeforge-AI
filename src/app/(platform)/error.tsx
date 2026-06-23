"use client";

import { useEffect } from "react";
import { AlertTriangle } from "@/components/icons";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <AlertTriangle className="size-10 text-destructive/70" />
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred on this page. Your other pages are unaffected.
      </p>
      <Button onClick={reset} size="sm">Try again</Button>
    </div>
  );
}
