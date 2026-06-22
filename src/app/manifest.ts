import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Master Coding Interviews`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    id: "/",
    // Launch into the app: /login redirects to /dashboard when already signed in.
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#f97316",
    categories: ["education", "productivity", "developer"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
