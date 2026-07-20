import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/_shared/og-card";

export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    eyebrow: "Limited offer",
    title: "1 month of Go — free",
    subtitle: "Every problem and all 9 AI tools, free for 30 days",
    tags: ["₹1 to start","30 days free","Cancel anytime"],
  });
}
