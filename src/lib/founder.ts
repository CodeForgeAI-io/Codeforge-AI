/**
 * Founder identity — shared by the JSON-LD in the root layout and the visible
 * About page. The `sameAs` URLs are what let Google connect this person's
 * existing entity/Knowledge Panel to CodeForge AI (founder ⇄ company).
 */
export const FOUNDER = {
  name: "Nitheesh Rajendran",
  role: "Founder & Developer",
  // Authoritative profiles Google can corroborate the person entity with.
  sameAs: [
    "https://www.linkedin.com/in/nitheeshdr/",
    "https://www.imdb.com/name/nm16304237/",
    "https://github.com/nitheeshdr",
  ],
  profiles: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nitheeshdr/" },
    { label: "IMDb", href: "https://www.imdb.com/name/nm16304237/" },
    { label: "GitHub", href: "https://github.com/nitheeshdr" },
  ],
} as const;
