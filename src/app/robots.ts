import type { MetadataRoute } from "next";
import { getEffectiveConfig } from "@/lib/site-config";

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
