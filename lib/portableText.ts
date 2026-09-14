export interface PortableTextSpan {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}

export interface PortableTextBlock {
  _key: string;
  _type: "block";
  style: "normal";
  markDefs: unknown[];
  children: PortableTextSpan[];
}

export function splitPlainTextParagraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Creates plain normal blocks without inventing formatting. */
export function plainTextToPortableText(text: string): PortableTextBlock[] {
  return splitPlainTextParagraphs(text).map((paragraph, index) => ({
    _key: `paragraph-${index + 1}`,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{
      _key: `paragraph-${index + 1}-span-1`,
      _type: "span",
      text: paragraph,
      marks: [],
    }],
  }));
}

/**
 * Converts Portable Text to readable technical copy for SEO, sharing and
 * structured data. Marks are semantically ignored; spans remain in order;
 * blocks are separated as paragraphs. Unknown objects are ignored safely.
 */
export function portableTextToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const children = (block as { children?: unknown }).children;
      if (!Array.isArray(children)) return "";
      return children
        .map((child) => {
          if (!child || typeof child !== "object") return "";
          const text = (child as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        })
        .join("")
        .trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

export function hasMeaningfulPortableText(value: unknown): boolean {
  return portableTextToPlainText(value).trim().length > 0;
}
