/** Escape special regex metacharacters to prevent NoSQL/ReDoS injection. */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip HTML tags and null bytes from a string. Lightweight server-side XSS guard. */
export function stripHtml(str: string): string {
  return str
    .replace(/\0/g, "")                    // null bytes
    .replace(/<[^>]*>/g, "")              // HTML tags
    .replace(/javascript:/gi, "")         // javascript: URIs
    .replace(/on\w+\s*=/gi, "")           // inline event handlers
    .trim();
}

/** Sanitize a user-supplied string that will be stored and later rendered as markdown. */
export function sanitizeUserContent(str: string): string {
  return str
    .replace(/\0/g, "")                   // null bytes
    .replace(/javascript:/gi, "")         // javascript: URIs
    .replace(/data:text\/html/gi, "")     // data: HTML URIs
    .replace(/on\w+\s*=/gi, "")           // inline event handlers (e.g. onerror=)
    .trim();
}

/** Truncate a string to a safe max length. */
export function cap(str: string, max: number): string {
  return typeof str === "string" ? str.slice(0, max) : "";
}
