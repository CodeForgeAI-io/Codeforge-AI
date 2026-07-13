import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CHALLENGE_COOKIE, rpFromRequest, toB64Url, challengeCookieOptions } from "@/lib/webauthn";

export const runtime = "nodejs";

/** Finish adding a passkey: verify the attestation and store the credential. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to add a passkey" }, { status: 401 });
  }

  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Challenge expired — try again" }, { status: 400 });
  }

  let body: { response: RegistrationResponseJSON; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { rpID, origin } = rpFromRequest(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  const { error } = await supabaseAdmin().from("webauthn_credentials").insert({
    user_id: session.user.id,
    credential_id: credential.id,
    public_key: toB64Url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    name: (body.name || "Passkey").slice(0, 60),
    last_used_at: new Date().toISOString(),
  });
  if (error) {
    // Unique violation → this passkey is already registered.
    const dup = /duplicate|unique/i.test(error.message);
    return NextResponse.json(
      { error: dup ? "This passkey is already registered." : error.message },
      { status: dup ? 409 : 500 },
    );
  }

  const res = NextResponse.json({ verified: true });
  res.cookies.set(CHALLENGE_COOKIE, "", challengeCookieOptions(0));
  return res;
}
