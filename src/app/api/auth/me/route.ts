import { NextResponse } from "next/server";
import { auth } from "@/lib/supabase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current session for the client auth shim (`useSession`). */
export async function GET() {
  const session = await auth();
  return NextResponse.json(session ?? { user: null });
}
