import { siteBase, sitemapIndex, xmlResponse } from "@/lib/sitemap-xml";

// Rendered per-request (edge-cached) so it never needs the DB at build time.
export const dynamic = "force-dynamic";

/**
 * Sitemap index (Yoast-style): points crawlers at one child sitemap per
 * content type. Google reads this at /sitemap.xml and fans out to each child.
 */
export async function GET() {
  const base = await siteBase();
  const now = new Date();
  const children = ["page", "problem", "post", "discussion", "help", "careers"].map((name) => ({
    loc: `${base}/${name}-sitemap.xml`,
    lastmod: now,
  }));
  return xmlResponse(sitemapIndex(children));
}
