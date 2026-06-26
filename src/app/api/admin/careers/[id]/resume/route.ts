import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { get } from "@vercel/blob";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { JobApplication } from "@/models";

export const runtime = "nodejs";

/**
 * Streams an applicant's résumé. Résumés live in a *private* Vercel Blob store
 * (they contain PII), so their URLs aren't publicly accessible — this admin-only
 * route fetches the blob server-side with the store token and streams it back.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const app = await JobApplication.findById(id).select("resumeUrl resumeName").lean();
  if (!app?.resumeUrl) {
    return NextResponse.json({ error: "No résumé on file" }, { status: 404 });
  }

  let res;
  try {
    res = await get(app.resumeUrl, { access: "private" });
  } catch {
    return NextResponse.json({ error: "Could not fetch résumé" }, { status: 502 });
  }
  if (!res?.stream) {
    return NextResponse.json({ error: "Résumé not found in storage" }, { status: 404 });
  }

  const filename = (app.resumeName || "resume").replace(/[\r\n"]/g, "");
  return new NextResponse(res.stream as ReadableStream, {
    headers: {
      "Content-Type": res.blob.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
