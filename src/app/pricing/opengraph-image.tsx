import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/_shared/og-card";

export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    eyebrow: "Pricing",
    title: "Simple pricing, serious prep",
    subtitle: "Free forever, or go unlimited from ₹49/mo",
    tags: ["Free tier","Cancel anytime","No card to start"],
  });
}
