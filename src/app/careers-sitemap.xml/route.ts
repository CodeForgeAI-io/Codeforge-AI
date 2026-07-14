import { CAREERS } from "@/content/careers";
import { siteBase, urlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/** Open roles / careers pages. */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  const entries: SitemapEntry[] = CAREERS.map((c) => ({
    loc: `${base}/careers/${c.slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.5,
  }));
  return xmlResponse(urlset(entries));
}
