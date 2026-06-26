import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BlogPost } from "@/models";

export const runtime = "nodejs";

/** Serve a blog post's cover image (decoded from inline base64). Public. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug }).select("coverData coverMime updatedAt").lean();
  if (!post?.coverData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = Buffer.from(post.coverData, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": post.coverMime || "image/jpeg",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Length": String(buffer.length),
    },
  });
}
