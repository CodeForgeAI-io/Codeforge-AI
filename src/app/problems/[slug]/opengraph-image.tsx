import { getQuestionBySlug } from "@/services/questions";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/_shared/og-card";

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#28a948",
  Medium: "#d97706",
  Hard: "#e5484d",
};

/** Per-problem share card: difficulty, title and topic tags. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = await getQuestionBySlug(slug).catch(() => null);

  if (!q) return renderOgCard();

  const tags = (q.tags ?? []).slice(0, 3);
  return renderOgCard({
    eyebrow: `${q.difficulty} · Coding Problem`,
    eyebrowColor: DIFFICULTY_COLOR[q.difficulty] ?? "#006bff",
    title: q.title,
    subtitle: tags.length ? tags.join("  ·  ") : "Solve it free in the online compiler with an AI mentor.",
    tags: ["Solve free", "12 languages", "AI mentor"],
  });
}
