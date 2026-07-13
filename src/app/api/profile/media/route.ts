import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { uploadPublicFile, storageEnabled, type StorageBucket } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const BUCKETS: Record<string, StorageBucket> = { avatar: "avatars", cover: "covers" };

/** Upload a profile avatar or cover photo; returns its public URL. */
export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  if (!storageEnabled()) {
    return NextResponse.json({ error: "Image upload isn't configured." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "");
  const bucket = BUCKETS[kind];
  if (!bucket) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Please upload a PNG, JPEG, WebP or GIF image." }, { status: 415 });
  }

  try {
    const url = await uploadPublicFile(bucket, file, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 502 },
    );
  }
}
