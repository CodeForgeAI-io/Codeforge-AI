import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  RP_NAME,
  CHALLENGE_COOKIE,
  CHALLENGE_MAX_AGE,
  rpFromRequest,
  challengeCookieOptions,
} from "@/lib/webauthn";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

export const runtime = "nodejs";

/** Begin adding a passkey — must be signed in. Returns WebAuthn creation options. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to add a passkey" }, { status: 401 });
  }

  const { rpID } = rpFromRequest(req);

  const { data: existing } = await supabaseAdmin()
    .from("webauthn_credentials")
    .select("credential_id,transports")
    .eq("user_id", session.user.id);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(session.user.id),
    userName: session.user.email || session.user.username,
    userDisplayName: session.user.username,
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.credential_id as string,
      transports: (c.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE, options.challenge, challengeCookieOptions(CHALLENGE_MAX_AGE));
  return res;
}
