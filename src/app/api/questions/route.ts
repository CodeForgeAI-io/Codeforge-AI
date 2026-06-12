import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { questionFilterSchema } from "@/schemas/question";
import { listQuestions } from "@/services/questions";

export async function GET(req: NextRequest) {
  const session = await auth();
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = questionFilterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filter parameters" },
      { status: 400 },
    );
  }

  const result = await listQuestions(parsed.data, session?.user?.id);
  return NextResponse.json(result);
}
