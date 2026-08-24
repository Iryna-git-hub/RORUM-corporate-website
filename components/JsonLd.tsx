/**
 * Renders one JSON-LD `<script>` tag. `JSON.stringify`'s output is escaped
 * for `</script>` specifically — the one character sequence that could
 * otherwise prematurely close this script tag and let the remainder of the
 * JSON be parsed as raw HTML (not a concern with this project's own
 * hardcoded/Sanity-sourced structured data, but a real risk if any field
 * ever originates from user input).
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
