import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getQuestionBySlug } from "@/services/questions";
import { getTutorialVideos, isTutorialLang, TUTORIAL_LANGS } from "@/lib/youtube";

export const runtime = "nodejs";

/**
 * Video tutorials for a problem's Editorial tab: GET ?slug=two-sum&lang=hi
 *
 * Public (problem pages are public), but the slug must resolve to a published
 * question — this endpoint is a quota-guarded lookup, not a search proxy.
 */
export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit("api", req);
  if (limited) return limited;

  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const langParam = req.nextUrl.searchParams.get("lang") ?? "en";
  if (!slug || slug.length > 120) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  const lang = isTutorialLang(langParam) ? langParam : "en";

  const question = await getQuestionBySlug(slug).catch(() => null);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const result = await getTutorialVideos(question.slug, question.title, lang);
  return NextResponse.json(
    { ...result, lang, langs: TUTORIAL_LANGS },
    // Edge-cache: results are already 7-day cached in Redis; an hour at the
    // CDN keeps repeat tab-opens free.
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
