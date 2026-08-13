import { PortableText, type PortableTextComponents, type PortableTextBlock } from "@portabletext/react";
import { LocaleLink as Link } from "@/components/LocaleLink";

// Matches sanity/schemaTypes/objects/bodyPortableText.ts exactly: normal/h2
// styles and bullet lists render with @portabletext/react's own sensible
// defaults, so the only thing that needs a custom renderer is the one
// custom mark type the schema defines — a plain-string `href` link
// annotation (not Sanity's `url` type, no "open in new tab" toggle).
const components: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = (value as { href?: string })?.href ?? "#";
      const isInternal = href.startsWith("/") && !href.startsWith("//");
      return isInternal ? (
        <Link href={href}>{children}</Link>
      ) : (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {children}
        </a>
      );
    },
  },
};

// `value` is typed loosely (not `PortableTextBlock[]`) because
// sanity.types.ts's generated type for a body field makes every nested
// field optional (it can't know our import scripts always populate them),
// which @portabletext/react's stricter block type rejects. The runtime
// shape is guaranteed valid — it's only ever produced by
// scripts/lib/sanityImportUtils.ts's `block()`/`bulletBlock()` helpers.
export function RichText({ value }: { value: unknown }) {
  return <PortableText value={value as PortableTextBlock[]} components={components} />;
}
