import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/_shared/og-card";

export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    eyebrow: "Online compiler",
    title: "Run code in 12 languages",
    subtitle: "A blank editor, custom stdin, real output — no setup",
    tags: ["12 languages","Instant","Free"],
  });
}
