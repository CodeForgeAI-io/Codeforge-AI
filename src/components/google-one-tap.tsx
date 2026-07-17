"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth-client";

/**
 * Google One Tap sign-in, bridged into Supabase Auth.
 *
 * Flow: the GSI script shows the One Tap prompt to signed-out visitors; the
 * returned ID token is exchanged for a Supabase session via signInWithIdToken,
 * the profile row is provisioned server-side (same as the OAuth callback), and
 * the page reloads so middleware + server components pick up the session.
 *
 * Hardening / behaviour:
 * - Nonce-bound tokens: SHA-256(nonce) goes to Google, the raw nonce to
 *   Supabase, so an intercepted ID token can't be replayed elsewhere.
 * - FedCM enabled (Chrome's third-party-cookie-less path) + Safari ITP support.
 * - auto_select signs returning users straight back in; One Tap's own
 *   exponential cooldown applies when a user dismisses the prompt.
 * - Skipped entirely when already signed in, and on the checkout page so it
 *   never overlaps the Razorpay overlay.
 */

interface CredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleId {
  initialize: (config: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

/** Raw nonce for Supabase + its SHA-256 hex for Google. */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

export function GoogleOneTap({ clientId }: { clientId: string }) {
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const busyRef = useRef(false);

  // Never prompt over the payment overlay or mid-auth-callback.
  const suppressed = pathname.startsWith("/checkout") || pathname.startsWith("/auth");

  const start = useCallback(async () => {
    const gsi = window.google?.accounts?.id;
    if (!gsi || initializedRef.current || status !== "unauthenticated" || suppressed) return;
    initializedRef.current = true;

    const { raw, hashed } = await makeNonce();

    gsi.initialize({
      client_id: clientId,
      callback: async (response: CredentialResponse) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce: raw,
          });
          if (error || !data.user) {
            toast.error(error?.message ?? "Google sign-in failed");
            return;
          }

          // Same provisioning as the OAuth callback — first One Tap login
          // creates the public.users profile row.
          await fetch("/api/auth/provision", { method: "POST" }).catch(() => {});

          import("posthog-js").then(({ default: posthog }) => {
            posthog.identify(data.user.email ?? data.user.id);
            posthog.capture("user_logged_in", { method: "google_one_tap" });
          });

          toast.success("Signed in with Google");
          // Full navigation so middleware + server components see the session.
          const callbackUrl = searchParams.get("callbackUrl");
          const dest =
            callbackUrl && callbackUrl.startsWith("/")
              ? callbackUrl
              : pathname === "/login" || pathname === "/register" || pathname === "/"
                ? "/dashboard"
                : pathname;
          window.location.assign(dest);
        } finally {
          busyRef.current = false;
        }
      },
      nonce: hashed,
      use_fedcm_for_prompt: true,
      auto_select: true,
      itp_support: true,
      cancel_on_tap_outside: false,
      context: "signin",
    });

    gsi.prompt();
  }, [clientId, status, suppressed, pathname, searchParams]);

  // The GSI script can finish loading before the session resolves (or vice
  // versa) — try on both signals.
  useEffect(() => {
    if (status === "unauthenticated") void start();
    // Signed in after prompting? Withdraw any visible prompt.
    if (status === "authenticated") window.google?.accounts?.id?.cancel?.();
  }, [status, start]);

  if (!clientId) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => void start()}
    />
  );
}
