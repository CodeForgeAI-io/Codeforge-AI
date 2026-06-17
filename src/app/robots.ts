import type { MetadataRoute } from "next";
import { getEffectiveConfig } from "@/lib/site-config";

// Render at request time so the build never has to reach the DB to prerender.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const cfg = await getEffectiveConfig();
  const base = (cfg.siteUrl || "https://codeforge.ai").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/settings"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
