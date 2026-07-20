import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/_shared/og-card";

export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    eyebrow: "Live status",
    title: "System status",
    subtitle: "Real-time health of every service and feature",
    tags: ["Uptime","Live checks","Transparent"],
  });
}
