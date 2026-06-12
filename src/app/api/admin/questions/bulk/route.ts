import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Question, Submission } from "@/models";

const bulkSchema = z.object({
  ids: z.array(z.string().length(24)).min(1).max(200),
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

  await connectDB();
  const ids = parsed.data.ids.map((id) => new Types.ObjectId(id));

  if (parsed.data.action === "delete") {
    const result = await Question.deleteMany({ _id: { $in: ids } });
    await Submission.deleteMany({ question: { $in: ids } });
    return NextResponse.json({ affected: result.deletedCount });
  }

  const result = await Question.updateMany(
    { _id: { $in: ids } },
    { $set: { isPublished: parsed.data.action === "publish" } },
  );
  return NextResponse.json({ affected: result.modifiedCount });
}
