import { defineField, defineType } from "sanity";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";

// Section keys, on the Home page only, whose background media is a plain
// CSS background-image with no accessible-image semantics anywhere in the
// component that renders it (no `role="img"`, no aria-label) — confirmed by
// reading components/ui.tsx's HomeHero and
// components/HomeEditorialSections.tsx's CommunityTeaserSection before
// adding either entry. NOT the same as every section literally keyed
// "hero"/"communityTeaser" site-wide: 11 of the site's other 12 pages also
// have a "hero" section, and at least About's has 3 media items — clearly
// not a single decorative background there. Matching on `document._id`
// first means no other page's media is ever affected by this, regardless of
// how that page's own components happen to render alt text.
const HOME_DECORATIVE_BACKGROUND_SECTION_KEYS = new Set(["hero", "communityTeaser"]);

// `parent` here is the mediaItem object itself (has its own `_key`); we find
// which section contains it by walking `document.sections` — no
// `path`/grandparent access needed.
function isHomeDecorativeBackgroundMedia(document: unknown, parent: unknown): boolean {
  const doc = document as { _id?: string; sections?: { sectionKey?: string; media?: { _key?: string }[] }[] } | undefined;
  const docId = doc?._id?.replace(/^drafts\./, "");
  if (docId !== "page-home") return false;
  const mediaKey = (parent as { _key?: string } | undefined)?._key;
  if (!mediaKey) return false;
  return !!doc?.sections?.some(
    (s) => s.sectionKey && HOME_DECORATIVE_BACKGROUND_SECTION_KEYS.has(s.sectionKey) && s.media?.some((m) => m._key === mediaKey),
  );
}

// One media slot — a photo, or an uploaded video with a poster image. Used
// for hero media and every page-section gallery alike, so a gallery is just
// `media: array<mediaItem>` rather than a dedicated per-page gallery type.
// Distinct from the older `mediaGalleryItem` (still used by the
// not-yet-migrated Community Membership gallery) mainly in supporting a real
// uploaded video file instead of only an external URL string.
export default defineType({
  name: "mediaItem",
  title: "Photo or video",
  type: "object",
  description:
    "One photo, or one video with a poster image. / Одне фото або одне відео із зображенням-заставкою.",
  fields: [
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: { list: [{ title: "Photo", value: "image" }, { title: "Video", value: "video" }], layout: "radio" },
      initialValue: "image",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      description: "Used when Type is Photo. / Використовується, якщо тип — Фото.",
      hidden: ({ parent }) => (parent as { kind?: string } | undefined)?.kind === "video",
    }),
    defineField({
      name: "videoFile",
      title: "Video file",
      type: "file",
      options: { accept: "video/*" },
      description: "Used when Type is Video — leave empty if using a video URL below instead. / Використовується, якщо тип — Відео. Залиште порожнім, якщо використовуєте посилання на відео нижче.",
      hidden: ({ parent }) => (parent as { kind?: string } | undefined)?.kind !== "video",
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL (alternative to an uploaded file)",
      type: "string",
      description: "A direct link to a video file, used only if no file is uploaded above. / Пряме посилання на відеофайл, використовується, лише якщо файл вище не завантажено.",
      hidden: ({ parent }) => (parent as { kind?: string } | undefined)?.kind !== "video",
    }),
    defineField({
      name: "posterImage",
      title: "Poster / fallback image",
      type: "image",
      options: { hotspot: true },
      description:
        "Shown while the video loads and if it fails to play — required for videos. / Показується під час завантаження відео та якщо воно не відтворюється — обов'язково для відео.",
      hidden: ({ parent }) => (parent as { kind?: string } | undefined)?.kind !== "video",
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "internationalizedArrayString",
      description: "Describes the photo/video for screen readers. / Опис фото/відео для програм читання з екрана.",
      // Hidden (Home hero + Home community-teaser background only): both
      // are intentionally decorative — plain CSS background-image behind
      // visible text content, with no role="img"/aria-label anywhere in the
      // component that renders them — so an accessible name here would be a
      // redundant, unannounced-anyway duplicate, not a missing one. Every
      // other media item on every other page/section keeps this field,
      // required, exactly as before (see
      // HOME_DECORATIVE_BACKGROUND_SECTION_KEYS above for the exact scope).
      hidden: ({ document, parent }) => isHomeDecorativeBackgroundMedia(document, parent),
      validation: requireAllLanguages({ skip: ({ document, parent }) => isHomeDecorativeBackgroundMedia(document, parent) }),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "internationalizedArrayText",
      description: "Optional visible caption. / Необов'язковий видимий підпис.",
      // Hidden site-wide: no component anywhere in the codebase renders a
      // media caption (grep-verified — `.caption` has zero consumers).
      // Confirmed via a read-only query first that no published or draft
      // page document has a non-empty caption value anywhere, so hiding
      // this doesn't orphan any real content an editor was relying on.
      // Not removed: the field and any future stored values are preserved
      // — this can be un-hidden the moment a real caption display exists.
      hidden: true,
    }),
  ],
  preview: {
    select: { media: "image", poster: "posterImage", alt: "alt", kind: "kind" },
    prepare({ media, poster, alt, kind }) {
      const en = (alt as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? (kind === "video" ? "(video)" : "(untitled)"), media: media ?? poster };
    },
  },
});
