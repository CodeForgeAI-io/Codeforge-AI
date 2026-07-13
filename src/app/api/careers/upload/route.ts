import { NextRequest, NextResponse } from "next/server";
import { uploadPublicFile, storageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

// Vercel serverless functions cap request bodies at ~4.5 MB, so keep résumés
// comfortably under that.
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);
const ALLOWED_EXT = new Set(["pdf", "doc", "docx"]);

/**
 * Receives an applicant's résumé and stores it in Vercel Blob. The browser
 * uploads to this same-origin route (not directly to the blob host) so
 * cross-origin upload blockers — Brave Shields, ad-blockers, corporate proxies
 * — can't silently break it. Requires BLOB_READ_WRITE_TOKEN.
 */
export async function POST(req: NextRequest) {
  if (!storageEnabled()) {
    return NextResponse.json(
      { error: "Resume upload is not configured." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Résumé must be under 4 MB." }, { status: 413 });
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!ALLOWED.has(file.type) && !ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "Please upload a PDF or Word document." }, { status: 415 });
  }
  const contentType =
    [...ALLOWED.entries()].find(([, e]) => e === ext)?.[0] ||
    (ALLOWED.has(file.type) ? file.type : "application/pdf");

  try {
    const url = await uploadPublicFile("resumes", file, contentType);
    return NextResponse.json({ url, name: file.name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 502 },
    );
  }
}
