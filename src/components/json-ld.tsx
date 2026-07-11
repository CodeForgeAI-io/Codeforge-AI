import { serializeJsonLd } from "@/lib/json-ld";

/**
 * Renders a JSON-LD structured-data block.
 *
 * This is the single sanctioned use of `dangerouslySetInnerHTML` for
 * structured data across the app: the payload is escaped by
 * {@link serializeJsonLd} so embedded user- or admin-authored content cannot
 * break out of the `<script>` tag. Prefer this component over hand-writing the
 * script element.
 *
 * @param data - The JSON-LD object (e.g. a schema.org `BlogPosting`).
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Safe: payload is escaped by serializeJsonLd so it cannot break out of the tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
