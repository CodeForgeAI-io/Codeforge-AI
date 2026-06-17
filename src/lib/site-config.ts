import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { SiteConfig, type SiteConfigDoc } from "@/models/SiteConfig";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const SITE_CONFIG_TAG = "site-config";
export const MASKED = "__MASKED__";

export const SENSITIVE_FIELDS: (keyof SiteConfigDoc)[] = [
  "smtpPass",
  "groqApiKey",
  "googleClientSecret",
  "githubClientSecret",
  "razorpayKeySecret",
  "redisToken",
  "judge0ApiKey",
  "paizaApiKey",
];

/** Fetch and cache the site config. Revalidated when admin saves settings. */
export const getSiteConfig = unstable_cache(
  async (): Promise<SiteConfigDoc> => {
    try {
      await connectDB();
      const cfg = await SiteConfig.findById("global").lean<SiteConfigDoc>();
      return cfg ?? ({} as SiteConfigDoc);
    } catch (err) {
      // The DB may be unreachable during build/prerender (e.g. robots.txt,
      // sitemap.xml). Fall back to env-based config instead of crashing.
      console.error("[site-config] Could not load config from DB:", err);
      return {} as SiteConfigDoc;
    }
  },
  [SITE_CONFIG_TAG],
  { revalidate: 60, tags: [SITE_CONFIG_TAG] },
);

/** Resolve a config value: DB value takes priority over env fallback. */
export function resolve(dbVal: string | undefined, envVal: string | undefined): string {
  return (dbVal && dbVal.trim()) ? dbVal.trim() : (envVal ?? "");
}

/** Merged config with env fallbacks — used for SEO metadata and scripts. */
export async function getEffectiveConfig() {
  const cfg = await getSiteConfig();
  return {
    siteUrl: resolve(cfg.siteUrl, process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL),
    siteName: resolve(cfg.siteName, APP_NAME),
    siteDescription: resolve(cfg.siteDescription, APP_DESCRIPTION),
    siteKeywords: cfg.siteKeywords ?? "",
    ogImage: cfg.ogImage ?? "",
    twitterHandle: cfg.twitterHandle ?? "",
    gaId: resolve(cfg.gaId, process.env.NEXT_PUBLIC_GA_ID),
    clarityId: resolve(cfg.clarityId, process.env.NEXT_PUBLIC_CLARITY_ID),
    gscVerification: resolve(cfg.gscVerification, process.env.GOOGLE_SITE_VERIFICATION),
  };
}

/** Mask sensitive fields before sending to client. */
export function maskConfig(cfg: Partial<SiteConfigDoc>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...cfg };
  for (const field of SENSITIVE_FIELDS) {
    const val = cfg[field] as string | undefined;
    out[field as string] = val ? MASKED : "";
  }
  return out;
}
