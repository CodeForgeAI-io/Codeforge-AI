import type { MetadataRoute } from "next";
import { getEffectiveConfig } from "@/lib/site-config";
import { listPublishedQuestionSlugs } from "@/services/questions";
import { listPublishedSlugs } from "@/services/blog-store";
import { DOC_ARTICLES } from "@/content/docs";
import { CAREERS } from "@/content/careers";

// Render at request time so the build never has to reach the DB to prerender.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cfg = await getEffectiveConfig();
  const base = (cfg.siteUrl || "https://codeforgeai.io").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/problems`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/compiler`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/help`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...CAREERS.map((c) => ({
      url: `${base}/careers/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  let problemRoutes: MetadataRoute.Sitemap = [];
  try {
    // Every published problem — including ones users generate — is indexed.
    const problems = await listPublishedQuestionSlugs();
    problemRoutes = problems.map((p) => ({
      url: `${base}/problems/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Don't break sitemap generation on DB error
  }

  const docRoutes: MetadataRoute.Sitemap = DOC_ARTICLES.map((a) => ({
    url: `${base}/help/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await listPublishedSlugs();
    blogRoutes = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // ignore DB errors
  }

  return [...staticRoutes, ...docRoutes, ...blogRoutes, ...problemRoutes];
}
