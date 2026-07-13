import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getApplicationResume } from "@/services/job-application-store";

const isValidId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id) || /^[0-9a-fA-F-]{36}$/.test(id);

export const runtime = "nodejs";

/**
 * Streams an applicant's résumé through an admin-only, same-origin endpoint so
 * the admin UI never surfaces the raw blob URL and downloads stay behind login.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const app = await getApplicationResume(id);
  if (!app?.resumeUrl) {
    return NextResponse.json({ error: "No résumé on file" }, { status: 404 });
  }

  // The stored résumé URL is public (Vercel Blob or Supabase Storage) — fetch
  // it through this admin-only endpoint so the raw URL never reaches the UI and
  // downloads stay behind login. Works regardless of the storage backend.
  let res: Response;
  try {
    res = await fetch(app.resumeUrl);
  } catch {
    return NextResponse.json({ error: "Could not fetch résumé" }, { status: 502 });
  }
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Résumé not found in storage" }, { status: 404 });
  }

  const filename = (app.resumeName || "resume").replace(/[\r\n"]/g, "");
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
