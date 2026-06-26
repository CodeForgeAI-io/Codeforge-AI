import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

/**
 * Generates a client-upload token so résumés stream straight from the browser
 * to Vercel Blob (bypassing the API body limit). Requires BLOB_READ_WRITE_TOKEN.
 */
export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Resume upload is not configured. Add BLOB_READ_WRITE_TOKEN." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maximumSizeInBytes: 5 * 1024 * 1024, // 5 MB
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ kind: "resume" }),
      }),
      onUploadCompleted: async () => {
        // Vercel calls this server-to-server after upload; nothing to do here.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
