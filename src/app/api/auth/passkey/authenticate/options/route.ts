import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  CHALLENGE_COOKIE,
  CHALLENGE_MAX_AGE,
  rpFromRequest,
  challengeCookieOptions,
} from "@/lib/webauthn";

export const runtime = "nodejs";

/**
 * Begin a passkey sign-in. Usernameless: allowCredentials is empty, so the
 * browser offers any discoverable passkey for this site. Public route.
 */
export async function POST(req: NextRequest) {
  const { rpID } = rpFromRequest(req);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE, options.challenge, challengeCookieOptions(CHALLENGE_MAX_AGE));
  return res;
}
