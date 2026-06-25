"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Holds the lazily-initialized client so the pageview tracker can use it.
let phInstance: PostHog | null = null;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Run after the page is idle so analytics never block first paint. */
function whenIdle(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(cb);
    return () => w.cancelIdleCallback?.(id);
  }
  const id = setTimeout(cb, 2000);
  return () => clearTimeout(id);
}

/**
 * Loads PostHog lazily on the client (after idle) so the ~50 kB SDK stays out
 * of the critical first-load bundle. No-op when no key is configured.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      import("posthog-js").then(({ default: posthog }) => {
        if (cancelled) return;
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // captured manually for App Router navigations
          capture_pageleave: true,
          capture_exceptions: true,
          person_profiles: "identified_only",
        });
        phInstance = posthog;
        posthog.capture("$pageview", { $current_url: window.location.href });
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  return (
    <>
      {children}
      {POSTHOG_KEY ? (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      ) : null}
    </>
  );
}

/** Tracks SPA route changes as PostHog pageviews (once the client is loaded). */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!phInstance || !pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    phInstance.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
