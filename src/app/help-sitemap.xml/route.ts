import { DOC_ARTICLES } from "@/content/docs";
import { siteBase, urlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/** Help-center / documentation articles. */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  const entries: SitemapEntry[] = DOC_ARTICLES.map((a) => ({
    loc: `${base}/help/${a.slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.5,
  }));
  return xmlResponse(urlset(entries));
}
