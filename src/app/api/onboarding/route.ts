import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { User } from "@/models";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { goal, level, topics, companies, dailyGoal } = body;

  if (!goal || !level || !topics?.length || !dailyGoal) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    "onboarding.completed": true,
    "onboarding.goal": goal,
    "onboarding.level": level,
    "onboarding.topics": topics,
    "onboarding.companies": companies ?? [],
    "onboarding.dailyGoal": dailyGoal,
    "onboarding.completedAt": new Date(),
  });

  const res = NextResponse.json({ ok: true });
  // Fallback cookie so middleware can allow /dashboard even if JWT update() is slow
  res.cookies.set("ob_done", "1", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
  });
  return res;
}
