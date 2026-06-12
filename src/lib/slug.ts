import { customAlphabet } from "nanoid";

const suffix = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Generate a slug, appending a random suffix when `exists` reports a
 * collision.
 */
export async function uniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || `item-${suffix()}`;
  if (!(await exists(base))) return base;
  return `${base}-${suffix()}`;
}
