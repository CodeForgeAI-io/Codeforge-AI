import { NextRequest, NextResponse } from "next/server";
import { getContestLeaderboard } from "@/services/contests";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const leaderboard = await getContestLeaderboard(slug);
  if (!leaderboard) {
    return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  }
  return NextResponse.json({ leaderboard });
}
