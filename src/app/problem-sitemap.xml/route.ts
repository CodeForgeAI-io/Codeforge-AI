import { listPublishedQuestionSlugs } from "@/services/questions";
import { siteBase, urlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/** Every published practice problem (including user-generated ones). */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  let entries: SitemapEntry[] = [];
  try {
    const problems = await listPublishedQuestionSlugs();
    entries = problems.map((p) => ({
      loc: `${base}/problems/${p.slug}`,
      lastmod: p.updatedAt ?? now,
      changefreq: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Never fail sitemap generation on a DB hiccup.
  }
  return xmlResponse(urlset(entries));
}
