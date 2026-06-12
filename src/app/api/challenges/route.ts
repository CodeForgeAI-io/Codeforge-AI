import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listChallenges } from "@/services/challenges";

export async function GET(req: NextRequest) {
  const session = await auth();
  const tech = req.nextUrl.searchParams.get("tech") ?? undefined;
  const difficulty = req.nextUrl.searchParams.get("difficulty") ?? undefined;

  const items = await listChallenges(
    { tech, difficulty },
    session?.user?.id,
  );
  return NextResponse.json({ items });
}
