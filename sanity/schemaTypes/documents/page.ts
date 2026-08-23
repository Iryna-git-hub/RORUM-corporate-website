import { defineArrayMember, defineField, defineType } from "sanity";
import { CateringMenuSectionsInput } from "@/sanity/components/CateringMenuSectionsInput";
import { isPageCateringMenuExamples } from "@/sanity/schemaTypes/objects/pageSection";

// The compact replacement for the old one-singleton-per-page model. Each
// page is one `page` document with a fixed id (`page.<pageKey>`, see
// sanity/structure.ts) holding an ordered `sections[]` array built from the
// shared `pageSection` shape — sections render on the site in this exact
// array order, and Studio's native array drag-to-reorder is how an editor
// changes page order, so the editing surface and the frontend are
// guaranteed to match. See MIGRATION_REPORT.md for why this replaces the
// old per-page singletons (Sanity's free-plan attribute cap).
export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  description: "A website page, built from an ordered list of sections. / Сторінка сайту, побудована з упорядкованого списку розділів.",
  fields: [
    defineField({
      name: "pageKey",
      title: "Page (do not change)",
      type: "string",
      readOnly: true,
      // This Sanity version's Rule API has no built-in `unique()` for plain
      // strings (that's `slug`-only), so uniqueness is enforced with an
      // async custom check — guards against exactly the bug this project
      // hit once already: two `page` documents (a canonical dash-case id
      // and a camelCase near-duplicate) both carrying
      // `pageKey: "cateringMenuExamples"`, which made `pageByKeyQuery`'s
      // `[0]` silently pick whichever one GROQ happened to order first —
      // the wrong one, in production. A second document reusing an
      // existing pageKey now fails validation immediately instead of
      // silently shadowing the real page.
      validation: (rule) => [
        rule.required(),
        rule.custom(async (value, context) => {
          if (!value) return true; // required() already reports missing separately
          const client = context.getClient({ apiVersion: "2025-02-19" });
          const ownId = (context.document?._id as string | undefined)?.replace(/^drafts\./, "");
          const count = await client.fetch<number>(
            `count(*[_type == "page" && pageKey == $value && !(_id in [$id, "drafts." + $id])])`,
            { value, id: ownId },
          );
          return count === 0 ? true : `Another page document already uses pageKey "${value}" — each page must have a unique key.`;
        }),
      ],
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [defineArrayMember({ type: "pageSection" })],
      description: "Drag to reorder — sections appear on the site in this exact order. / Перетягуйте, щоб змінити порядок — розділи показуються на сайті саме в цьому порядку.",
      // Scoped internally to page-catering-menu-examples only (checks the
      // live document id) — every other page's sections array renders with
      // the unmodified default input, unaffected.
      components: { input: CateringMenuSectionsInput },
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      // Catering Menu Examples is an in-page overlay opened from /catering
      // (components/CateringMenuOverlay.tsx) — never its own route, so
      // there is no <head> for a second, independent SEO block to
      // populate. Traced end-to-end: generateMetadata() in
      // app/[locale]/(site)/catering/page.tsx reads ONLY newPage.seo (the
      // Catering page's own), never newMenuPage.seo. A previously-seeded
      // seo block on this document (title/description/ogImage) was real
      // content but had zero effect — removed (scripts/remove-catering-menu-examples-seo.ts,
      // backed up first) rather than left visible-but-misleading. Hidden
      // here so a manager never fills in a field that provably does
      // nothing; the Catering page's own SEO block (this same field, on
      // page-catering) is unaffected and stays fully connected.
      hidden: ({ document }) => isPageCateringMenuExamples(document),
    }),
  ],
  preview: {
    select: { pageKey: "pageKey", sections: "sections" },
    prepare({ pageKey, sections }) {
      return {
        title: (pageKey as string | undefined) ?? "(untitled page)",
        subtitle: `${(sections as unknown[] | undefined)?.length ?? 0} sections`,
      };
    },
  },
});
