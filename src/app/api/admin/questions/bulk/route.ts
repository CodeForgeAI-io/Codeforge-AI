import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { bulkQuestions } from "@/services/questions";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(200),
  action: z.enum(["publish", "unpublish", "delete"]),
});

/** Admin: bulk publish / unpublish / delete questions */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const affected = await bulkQuestions(parsed.data.ids, parsed.data.action);
  return NextResponse.json({ affected });
}
