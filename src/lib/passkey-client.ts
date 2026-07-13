"use client";

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

/** Register a new passkey for the signed-in user. */
export async function registerPasskey(name?: string): Promise<void> {
  const optRes = await fetch("/api/auth/passkey/register/options", { method: "POST" });
  if (!optRes.ok) throw new Error(await errorFrom(optRes, "Could not start passkey setup"));
  const optionsJSON = await optRes.json();

  const attestation = await startRegistration({ optionsJSON });

  const verifyRes = await fetch("/api/auth/passkey/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: attestation, name }),
  });
  if (!verifyRes.ok) throw new Error(await errorFrom(verifyRes, "Passkey setup failed"));
}

/** Sign in with a discoverable passkey. Establishes a Supabase session. */
export async function loginWithPasskey(): Promise<void> {
  const optRes = await fetch("/api/auth/passkey/authenticate/options", { method: "POST" });
  if (!optRes.ok) throw new Error(await errorFrom(optRes, "Could not start passkey sign-in"));
  const optionsJSON = await optRes.json();

  const assertion = await startAuthentication({ optionsJSON });

  const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assertion),
  });
  if (!verifyRes.ok) throw new Error(await errorFrom(verifyRes, "Passkey sign-in failed"));
}

export interface PasskeyRow {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

/** List the signed-in user's passkeys. */
export async function listPasskeys(): Promise<PasskeyRow[]> {
  const res = await fetch("/api/auth/passkey");
  if (!res.ok) throw new Error(await errorFrom(res, "Could not load passkeys"));
  return (await res.json()).passkeys as PasskeyRow[];
}

/** Remove one of the signed-in user's passkeys. */
export async function deletePasskey(id: string): Promise<void> {
  const res = await fetch(`/api/auth/passkey/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorFrom(res, "Could not remove passkey"));
}
