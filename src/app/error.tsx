"use client";

import { useEffect } from "react";
import { AlertTriangle } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Load PostHog only when an error actually occurs — keeps it out of the bundle.
    import("posthog-js").then(({ default: posthog }) => posthog.captureException(error));
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive/70" />
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. If this keeps happening, check that your
        environment variables (database, AI keys) are configured correctly.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
