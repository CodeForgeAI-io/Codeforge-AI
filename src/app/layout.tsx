import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { AnalyticsScripts } from "@/components/analytics";
import { getEffectiveConfig } from "@/lib/site-config";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getEffectiveConfig();
  const name = cfg.siteName || APP_NAME;
  const desc = cfg.siteDescription || APP_DESCRIPTION;
  const url = cfg.siteUrl || "https://codeforge.ai";
  const ogImg = cfg.ogImage || undefined;

  return {
    metadataBase: new URL(url),
    title: {
      default: `${name} — Master Coding Interviews`,
      template: `%s | ${name}`,
    },
    description: desc,
    keywords: cfg.siteKeywords
      ? cfg.siteKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : ["coding interview", "DSA", "LeetCode", "algorithm practice", "AI mentor"],
    authors: [{ name: "Setups Works" }],
    creator: "Setups Works",
    alternates: { canonical: "/" },
    verification: cfg.gscVerification ? { google: cfg.gscVerification } : undefined,
    openGraph: {
      type: "website",
      url,
      siteName: name,
      title: `${name} — Master Coding Interviews`,
      description: desc,
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Master Coding Interviews`,
      description: desc,
      site: cfg.twitterHandle ? `@${cfg.twitterHandle.replace(/^@/, "")}` : undefined,
      images: ogImg ? [ogImg] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfg = await getEffectiveConfig();
  const name = cfg.siteName || APP_NAME;
  const desc = cfg.siteDescription || APP_DESCRIPTION;
  const url = cfg.siteUrl || "https://codeforge.ai";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name,
        description: desc,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${url}/problems?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#org`,
        url,
        name,
        logo: cfg.ogImage || undefined,
        sameAs: ["https://github.com/nitheeshdr/codeforge-ai"],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <AnalyticsScripts />
        <SpeedInsights />
      </body>
    </html>
  );
}
