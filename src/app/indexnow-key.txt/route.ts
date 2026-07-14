import { INDEXNOW_KEY } from "@/lib/indexnow";

// Ownership-verification file for IndexNow. Served as plain text at
// /indexnow-key.txt (referenced as keyLocation in every ping).
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
