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

/** Canonical production domain — used when nothing better is configured and to
 *  override Vercel preview URLs that must never appear in canonical/sitemap/OG. */
const CANONICAL_SITE_URL = "https://codeforgeai.io";

/** Merged config with env fallbacks — used for SEO metadata and scripts. */
export async function getEffectiveConfig() {
  const cfg = await getSiteConfig();
  const resolvedSiteUrl = resolve(
    cfg.siteUrl,
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL,
  );
  // Never advertise the Vercel preview domain (or an empty value) for SEO —
  // Search Console rejects cross-domain sitemap URLs, so pin the real domain.
  const siteUrl =
    !resolvedSiteUrl || resolvedSiteUrl.includes("vercel.app")
      ? CANONICAL_SITE_URL
      : resolvedSiteUrl.replace(/\/$/, "");
  return {
    siteUrl,
    siteName: resolve(cfg.siteName, APP_NAME),
    siteDescription: resolve(cfg.siteDescription, APP_DESCRIPTION),
    siteKeywords: cfg.siteKeywords ?? "",
    ogImage: cfg.ogImage ?? "",
    twitterHandle: cfg.twitterHandle ?? "",
    gaId: resolve(
      cfg.gaId,
      process.env.NEXT_PUBLIC_GA_ID ??
        (process.env.NODE_ENV === "production" ? "G-3QG2R8NKRC" : undefined),
    ),
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
