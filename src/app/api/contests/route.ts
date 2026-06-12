import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContests } from "@/services/contests";

export async function GET() {
  const session = await auth();
  const contests = await listContests(session?.user?.id);
  return NextResponse.json({ contests });
}
