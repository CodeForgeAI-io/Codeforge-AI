import { cached } from "@/lib/redis";

/**
 * YouTube Data API v3 search for problem video tutorials.
 *
 * Quota discipline: search.list costs 100 units of the 10k/day default quota,
 * so every (problem, language) result is cached for 7 days and the route only
 * accepts slugs that exist in our DB — we must never become a free search
 * proxy. Degrades to { configured: false } without an API key, and the UI
 * falls back to plain YouTube search links.
 */

export interface TutorialVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
}

export interface TutorialSearchResult {
  configured: boolean;
  videos: TutorialVideo[];
}

/** Spoken languages we offer tutorial searches in. */
export const TUTORIAL_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
] as const;

export type TutorialLang = (typeof TUTORIAL_LANGS)[number]["code"];

export function isTutorialLang(v: string): v is TutorialLang {
  return TUTORIAL_LANGS.some((l) => l.code === v);
}

interface YtSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
  };
}

async function searchYouTube(query: string, lang: TutorialLang): Promise<TutorialVideo[]> {
  const key = process.env.YOUTUBE_API_KEY!;
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "9",
    videoEmbeddable: "true",
    safeSearch: "strict",
    relevanceLanguage: lang,
    key,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = (await res.json()) as { items?: YtSearchItem[] };
  return (data.items ?? [])
    .filter((i) => i.id?.videoId && i.snippet?.title)
    .map((i) => ({
      id: i.id!.videoId!,
      title: i.snippet!.title!,
      channel: i.snippet!.channelTitle ?? "",
      thumbnail: i.snippet!.thumbnails?.medium?.url ?? i.snippet!.thumbnails?.high?.url ?? "",
      publishedAt: i.snippet!.publishedAt ?? "",
    }));
}

/** Cached tutorial search for a problem title in a spoken language. */
export async function getTutorialVideos(
  slug: string,
  title: string,
  lang: TutorialLang,
): Promise<TutorialSearchResult> {
  if (!process.env.YOUTUBE_API_KEY) return { configured: false, videos: [] };

  const langLabel = TUTORIAL_LANGS.find((l) => l.code === lang)?.label ?? "English";
  // "English" in the query hurts more than helps for the default language.
  const query = lang === "en"
    ? `${title} coding problem solution explained`
    : `${title} coding problem solution ${langLabel}`;

  const videos = await cached(`yt:videos:${slug}:${lang}`, 7 * 24 * 3600, async () => {
    try {
      return await searchYouTube(query, lang);
    } catch {
      // Don't cache hard failures for a week — cached() stores this empty
      // result, so keep the outage blast radius small by rethrowing instead.
      throw new Error("YouTube search failed");
    }
  }).catch(() => null);

  if (videos === null) return { configured: true, videos: [] };
  return { configured: true, videos };
}
