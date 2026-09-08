import { stegaClean } from "next-sanity";

/**
 * Renders one JSON-LD `<script>` tag. `JSON.stringify`'s output is escaped
 * for `</script>` specifically — the one character sequence that could
 * otherwise prematurely close this script tag and let the remainder of the
 * JSON be parsed as raw HTML (not a concern with this project's own
 * hardcoded/Sanity-sourced structured data, but a real risk if any field
 * ever originates from user input).
 *
 * `stegaClean` strips the invisible edit-link characters `sanityFetch` adds to
 * Sanity strings while an editor views the site in Draft Mode / Presentation —
 * those belong on visible body copy (for the click-to-edit overlay), never in
 * machine-read structured data. No-op for normal visitors.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(stegaClean(data)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
