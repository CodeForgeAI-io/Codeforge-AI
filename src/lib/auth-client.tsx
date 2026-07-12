"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth-actions";
import type { AppSession } from "@/lib/supabase-auth";

/**
 * Client auth shim — a Supabase-backed drop-in for `next-auth/react`'s
 * `SessionProvider` / `useSession` / `signOut`. Keeps the same API so client
 * components only swap their import. The session is fetched from
 * `/api/auth/me` (server-validated) and re-fetched on Supabase auth changes.
 */

type Status = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  data: AppSession | null;
  status: Status;
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  update: async () => {},
});

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppSession | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = (await res.json()) as AppSession | { user: null };
      if (json && "user" in json && json.user) {
        setData(json as AppSession);
        setStatus("authenticated");
      } else {
        setData(null);
        setStatus("unauthenticated");
      }
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return <SessionContext.Provider value={{ data, status, update: refresh }}>{children}</SessionContext.Provider>;
}

/** Drop-in for next-auth's useSession(). */
export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

/** Drop-in for next-auth's signOut(). */
export async function signOut(opts?: { callbackUrl?: string }): Promise<void> {
  await signOutAction();
  window.location.href = opts?.callbackUrl ?? "/";
}

/** Start an OAuth sign-in; redirects to the provider then /auth/callback. */
export async function signInWithProvider(
  provider: "google" | "github",
  opts?: { callbackUrl?: string },
): Promise<void> {
  const supabase = createClient();
  const next = encodeURIComponent(opts?.callbackUrl ?? "/dashboard");
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
  });
}
