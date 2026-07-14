import { listPublishedSlugs } from "@/services/blog-store";
import { siteBase, urlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/** Published blog posts. */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  let entries: SitemapEntry[] = [];
  try {
    const posts = await listPublishedSlugs();
    entries = posts.map((p) => ({
      loc: `${base}/blog/${p.slug}`,
      lastmod: p.updatedAt ?? now,
      changefreq: "monthly",
      priority: 0.6,
    }));
  } catch {
    // ignore DB errors
  }
  return xmlResponse(urlset(entries));
}
