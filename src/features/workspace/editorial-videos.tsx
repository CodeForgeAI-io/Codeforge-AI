"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, ExternalLink, MonitorPlay } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
}

interface VideosResponse {
  configured: boolean;
  videos: TutorialVideo[];
  lang: string;
  langs: { code: string; label: string }[];
}

/** Fallback pills when the API hasn't answered yet. */
const DEFAULT_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
];

/**
 * Video tutorials for the Editorial tab — pick a spoken language, browse
 * YouTube explanations, watch inline (privacy-enhanced youtube-nocookie embed).
 */
export function EditorialVideos({ slug, title }: { slug: string; title: string }) {
  const [lang, setLang] = useState("en");
  const [playing, setPlaying] = useState<TutorialVideo | null>(null);
  // One video by default; "Show more" reveals the rest.
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<VideosResponse>({
    queryKey: ["editorial-videos", slug, lang],
    queryFn: async () => {
      const res = await fetch(`/api/questions/videos?slug=${encodeURIComponent(slug)}&lang=${lang}`);
      if (!res.ok) throw new Error("Failed to load videos");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const langs = data?.langs ?? DEFAULT_LANGS;
  const searchUrl = (code: string) => {
    const label = langs.find((l) => l.code === code)?.label ?? "";
    const q = `${title} coding problem solution ${code === "en" ? "explained" : label}`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  };

  return (
    <section className="border-t pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MonitorPlay className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Video tutorials</h3>
      </div>

      {/* Language pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {langs.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => {
              setLang(l.code);
              setPlaying(null);
              setExpanded(false);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              lang === l.code
                ? "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Inline player */}
      {playing && (
        <div className="mb-4 overflow-hidden rounded-xl border">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`}
              title={playing.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-3 py-2">
            <p className="min-w-0 truncate text-xs font-medium">{playing.title}</p>
            <button
              type="button"
              onClick={() => setPlaying(null)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.configured ? (
        // No API key on this deployment — still useful: hand off to YouTube.
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p>Video search isn&apos;t enabled on this deployment yet.</p>
          <Button asChild size="sm" variant="outline" className="mt-2.5 gap-1.5">
            <a href={searchUrl(lang)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Search tutorials on YouTube
            </a>
          </Button>
        </div>
      ) : data.videos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p>No {langs.find((l) => l.code === lang)?.label} tutorials found for this problem.</p>
          <Button asChild size="sm" variant="outline" className="mt-2.5 gap-1.5">
            <a href={searchUrl(lang)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Search on YouTube
            </a>
          </Button>
        </div>
      ) : (
        <>
        <ul className={cn("grid gap-3", expanded && "sm:grid-cols-2")}>
          {(expanded ? data.videos : data.videos.slice(0, 1)).map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setPlaying(v)}
                className="group w-full overflow-hidden rounded-xl border text-left transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {v.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-transform group-hover:scale-110">
                      <Play className="ml-0.5 size-4" />
                    </span>
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs font-medium leading-snug">{v.title}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{v.channel}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
        {data.videos.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-1.5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : `Show ${data.videos.length - 1} more videos`}
          </Button>
        )}
        </>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Community videos from YouTube — quality varies. The AI mentor can explain this exact problem against your own code.
      </p>
    </section>
  );
}
