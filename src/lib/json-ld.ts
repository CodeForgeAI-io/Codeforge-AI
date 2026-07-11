/**
 * Serialize a JSON-LD object for safe embedding inside an inline
 * `<script type="application/ld+json">` element.
 *
 * `JSON.stringify` alone is unsafe: a value containing the sequence
 * `</script>` closes the element early, letting any user- or admin-authored
 * field (a blog title, a job description, …) inject markup — stored XSS. We
 * escape the characters that can break out of, or corrupt, an inline script
 * context: `<`, `>`, `&`, and the U+2028 / U+2029 line separators. The output
 * remains valid JSON (`JSON.parse`-able), so crawlers that read the structured
 * data are unaffected.
 *
 * @param data - Any JSON-serializable structured-data object.
 * @returns The escaped JSON string, safe to place in `dangerouslySetInnerHTML`.
 */
export function serializeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  let out = "";
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    // '<'=0x3c, '>'=0x3e, '&'=0x26, U+2028, U+2029 — all can break out of or
    // corrupt an inline <script>. Escape them to their \uXXXX JSON form.
    if (code === 0x3c || code === 0x3e || code === 0x26 || code === 0x2028 || code === 0x2029) {
      out += "\\u" + code.toString(16).padStart(4, "0");
    } else {
      out += json[i];
    }
  }
  return out;
}
