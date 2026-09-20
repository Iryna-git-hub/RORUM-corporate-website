import { defineField, defineType } from "sanity";
import { matchItemRole } from "@/sanity/schemaTypes/objects/contentItem";
import { getEventVisibleLocales } from "@/sanity/lib/i18nValidation";
import { CateringAllLanguagesInput } from "@/sanity/components/CateringAllLanguagesInput";

// `contentItem.image` (type imageWithAlt) is Studio-visible for a handful of
// item roles where the photo itself IS used but only ever as a decorative
// image — a plain CSS background-image, or an <Image alt="" aria-hidden="true">
// icon — with no role="img"/aria-label anywhere in the component that renders
// it. An editor's alt text there has zero effect, unlike every other use of
// imageWithAlt (About's atmosphere photos, editorial feature images, etc.),
// which ARE rendered with a real accessible name and must keep requiring alt
// text. Scoped by document id + sectionKey + itemKey pattern together, same
// shape as contentItem.ts's ITEM_ROLE_RULES, so no other page or item role is
// ever affected.
//
//  - page-home quickPaths / servicesTeaser cards: photo rendered only as a
//    plain CSS background-image with aria-hidden="true" (confirmed by reading
//    app/shared.tsx's QuickPathCard and components/HomeEditorialSections.tsx's
//    ServicesTeaserSection).
//  - page-community-membership benefit cards: image rendered as a decorative
//    <Image alt="" aria-hidden="true"> icon next to a visible <h3>/<p>
//    (app/[locale]/(site)/community-membership/page.tsx). Requiring alt there
//    only ever blocked Publish on legacy benefit content — and forced fake
//    descriptions onto images that screen readers never announce anyway.
const DECORATIVE_CONTENT_ITEM_IMAGE_ROLES: readonly { docId: string; sectionKeys: readonly string[]; itemKeyPattern: RegExp }[] = [
  { docId: "page-home", sectionKeys: ["quickPaths"], itemKeyPattern: /^(events|hostAtRorum|catering|eventDecoration)$/ },
  { docId: "page-home", sectionKeys: ["servicesTeaser"], itemKeyPattern: /^(catering|eventDecoration)$/ },
  { docId: "page-community-membership", sectionKeys: ["benefits"], itemKeyPattern: /^benefit\d*$/ },
];

type PathSegment = string | number | { _key: string };

interface SectionLike {
  _key?: string;
  sectionKey?: string;
  items?: { _key?: string; itemKey?: string }[];
}

/**
 * `alt` is nested inside `image` inside a `contentItem`, so `parent` in this
 * field's own hidden/validation callbacks is the image object itself, not
 * the contentItem — unlike mediaItem.ts's alt (nested one level shallower),
 * this needs the callback's `path` to climb back up to the enclosing section
 * + item via their `_key`s, e.g. ["sections", {_key}, "items", {_key},
 * "image", "alt"].
 */
function resolveEnclosingSectionAndItem(document: unknown, path: PathSegment[] | undefined) {
  const doc = document as { _id?: string; sections?: SectionLike[] } | undefined;
  const sectionSeg = path?.[1];
  const itemSeg = path?.[3];
  if (typeof sectionSeg !== "object" || typeof itemSeg !== "object") return null;
  const section = doc?.sections?.find((s) => s._key === sectionSeg._key);
  const item = section?.items?.find((i) => i._key === itemSeg._key);
  if (!section?.sectionKey || !item?.itemKey) return null;
  return { docId: doc?._id?.replace(/^drafts\./, ""), sectionKey: section.sectionKey, itemKey: item.itemKey };
}

function isDecorativeContentItemImageAlt(document: unknown, path: PathSegment[] | undefined): boolean {
  const ctx = resolveEnclosingSectionAndItem(document, path);
  if (!ctx) return false;
  return DECORATIVE_CONTENT_ITEM_IMAGE_ROLES.some(
    (r) => r.docId === ctx.docId && r.sectionKeys.includes(ctx.sectionKey) && r.itemKeyPattern.test(ctx.itemKey),
  );
}

/**
 * Second, independent skip reason: the enclosing `contentItem`'s own `image`
 * field is entirely hidden for this item's role (e.g. closingCta suggested-
 * path links, About's hero intro-link chips — see contentItem.ts's
 * ITEM_ROLE_RULES). A hidden field's stray/partial alt data must never block
 * publishing — same principle as the decorative case above, different cause.
 */
function isImageFieldHiddenByItemRole(document: unknown, path: PathSegment[] | undefined): boolean {
  const ctx = resolveEnclosingSectionAndItem(document, path);
  if (!ctx) return false;
  const rule = matchItemRole(ctx.sectionKey, ctx.itemKey, undefined, ctx.docId);
  return !!rule && !rule.visible.includes("image");
}

function shouldSkipAltRequirement(document: unknown, path: PathSegment[] | undefined): boolean {
  return isDecorativeContentItemImageAlt(document, path) || isImageFieldHiddenByItemRole(document, path);
}

// Every `imageWithAlt` reachable from these 2 documents is a real,
// informative content photo — menu-format cards and menu-category dish
// photos (both `contentItem.image`) — never a decorative background (those
// use `mediaItem`, which already requires all 3 languages unconditionally;
// see mediaItem.ts). Scoped narrowly to these 2 document ids specifically
// (not a blanket change to `imageWithAlt` or to `contentItem.image`
// generally) so every other page's images — Home/About atmosphere photos,
// Home's decorative quickPaths/servicesTeaser images above, etc. — keep the
// existing English-required-only rule, unaudited and unaffected.
const CATERING_INFORMATIVE_IMAGE_DOC_IDS = new Set(["page-catering", "page-catering-menu-examples"]);

function isCateringInformativeImage(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  const docId = doc?._id?.replace(/^drafts\./, "");
  return !!docId && CATERING_INFORMATIVE_IMAGE_DOC_IDS.has(docId);
}

export default defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  description:
    "An image with required alt text for accessibility. / Зображення з обов'язковим альтернативним текстом для доступності.",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "internationalizedArrayString",
      description:
        "Describes the image for screen readers and search engines. Required. / Опис зображення для програм читання з екрана та пошукових систем. Обов'язково.",
      hidden: ({ document, path }) => shouldSkipAltRequirement(document, path as PathSegment[] | undefined),
      // Scoped internally to `event` documents only (checks the live
      // document `_type`) — Home/About/etc. render this exact same field
      // completely unchanged, since imageWithAlt is a shared type.
      components: { input: CateringAllLanguagesInput },
      validation: (rule) =>
        rule.custom((value, context) => {
          if (shouldSkipAltRequirement(context.document, context.path as PathSegment[] | undefined)) return true;

          // Event context: alt text is required per the event's own
          // selected "Show on website languages" locales, not unconditionally
          // English — an English translation is never required merely
          // because English used to be the site-wide default. Every other
          // document type (Home/About/etc.) falls through to the unchanged
          // English-required rule below.
          const selectedEventLocales = getEventVisibleLocales(context.document);
          if (selectedEventLocales) {
            const entries = (value as { _key: string; language?: string; value?: string }[] | undefined) ?? [];
            const missing = selectedEventLocales.filter(
              (lang) => !entries.some((e) => (e.language ?? e._key) === lang && e.value?.trim()),
            );
            if (!missing.length) return true;
            const names = missing.map((l) => ({ en: "English", da: "Danish", uk: "Ukrainian" })[l] ?? l);
            const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
            return `Please add the ${list} alt text — this event is shown on the ${list} website.`;
          }

          // Catering (non-event) informative images: full en/da/uk
          // required, not just English — see
          // CATERING_INFORMATIVE_IMAGE_DOC_IDS above for exactly which
          // documents/images this applies to.
          if (isCateringInformativeImage(context.document)) {
            const entries = (value as { _key: string; language?: string; value?: string }[] | undefined) ?? [];
            const missing = (["en", "da", "uk"] as const).filter(
              (lang) => !entries.some((e) => (e.language ?? e._key) === lang && e.value?.trim()),
            );
            if (!missing.length) return true;
            const names = missing.map((l) => ({ en: "English", da: "Danish", uk: "Ukrainian" })[l] ?? l);
            const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
            return `Please add the ${list} alt text.`;
          }

          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          return en?.value ? true : "English alt text is required.";
        }),
    }),
  ],
});
