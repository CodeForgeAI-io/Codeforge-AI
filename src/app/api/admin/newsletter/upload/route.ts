import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { uploadPublicFile, storageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

/** Upload a newsletter image to blob storage; returns a public URL. Admin only. */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!storageEnabled()) {
    return NextResponse.json(
      { error: "Image upload is not configured." },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Please upload a PNG, JPEG, GIF or WebP image." }, { status: 415 });
  }

  try {
    const url = await uploadPublicFile("newsletter", file, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    // Common when the blob store/token is misconfigured — the composer also
    // accepts a pasted image URL, so surface that as the workaround.
    const store = /store does not exist|not found|token/i.test(msg);
    return NextResponse.json(
      {
        error: store
          ? "Image storage isn't set up in this environment. Paste an image URL instead, or configure a Vercel Blob store."
          : msg,
      },
      { status: store ? 503 : 502 },
    );
  }
}
