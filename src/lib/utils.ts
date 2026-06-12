import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mongoose `Map` fields come back as real Maps from hydrated documents but
 * as plain objects from `.lean()` queries. Normalize both to a plain object.
 */
export function mapToObject<T>(
  value: Map<string, T> | Record<string, T> | null | undefined,
): Record<string, T> {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
}
