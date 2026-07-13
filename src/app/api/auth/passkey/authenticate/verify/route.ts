import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CHALLENGE_COOKIE, rpFromRequest, fromB64Url, challengeCookieOptions } from "@/lib/webauthn";

export const runtime = "nodejs";

/**
 * Finish a passkey sign-in. Verifies the assertion against the stored credential,
 * then bridges it into a Supabase session: the service role mints a magic-link
 * token for the credential's user, which the SSR client redeems server-side to
 * set the auth cookies — no email is ever sent.
 */
export async function POST(req: NextRequest) {
  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Challenge expired — try again" }, { status: 400 });
  }

  let response: AuthenticationResponseJSON;
  try {
    response = (await req.json()) as AuthenticationResponseJSON;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: cred } = await admin
    .from("webauthn_credentials")
    .select("id,user_id,public_key,counter,transports")
    .eq("credential_id", response.id)
    .maybeSingle();
  if (!cred) {
    return NextResponse.json({ error: "Unknown passkey" }, { status: 404 });
  }

  const { rpID, origin } = rpFromRequest(req);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: response.id,
        publicKey: fromB64Url(cred.public_key as string),
        counter: Number(cred.counter),
        transports: (cred.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 401 });
  }

  // Advance the signature counter (replay protection) + touch last-used.
  await admin
    .from("webauthn_credentials")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", cred.id);

  // Resolve the user's email, mint a magic-link token, redeem it for a session.
  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(cred.user_id as string);
  const email = userRes?.user?.email;
  if (userErr || !email) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 });
  }

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }

  const supa = await createClient();
  const { error: otpErr } = await supa.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (otpErr) {
    return NextResponse.json({ error: "Could not establish session" }, { status: 500 });
  }

  const res = NextResponse.json({ verified: true });
  res.cookies.set(CHALLENGE_COOKIE, "", challengeCookieOptions(0));
  return res;
}
