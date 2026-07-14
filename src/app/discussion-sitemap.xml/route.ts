import { listDiscussionsForSitemap } from "@/services/discussions-store";
import { siteBase, urlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/** Public forum threads (/forum/[id]). */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  let entries: SitemapEntry[] = [];
  try {
    const threads = await listDiscussionsForSitemap();
    entries = threads.map((t) => ({
      loc: `${base}/forum/${t.id}`,
      lastmod: t.updatedAt ?? now,
      changefreq: "weekly",
      priority: 0.5,
    }));
  } catch {
    // ignore DB errors
  }
  return xmlResponse(urlset(entries));
}
