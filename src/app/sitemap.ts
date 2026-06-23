import type { MetadataRoute } from "next";
import { getEffectiveConfig } from "@/lib/site-config";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/models";

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
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  let problemRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const problems = await Question.find({}, "slug updatedAt").lean<{ slug: string; updatedAt: Date }[]>();
    problemRoutes = problems.map((p) => ({
      url: `${base}/problems/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Don't break sitemap generation on DB error
  }

  return [...staticRoutes, ...problemRoutes];
}
