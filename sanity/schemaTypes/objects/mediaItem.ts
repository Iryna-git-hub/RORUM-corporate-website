import { defineField, defineType } from "sanity";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";
import { isDirectVideoFileUrl, videoUrlValidationMessage } from "@/sanity/lib/videoUrl";

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

// One media slot — a photo, or an uploaded/linked video. Used for hero media
// and every page-section gallery alike, so a gallery is just
// `media: array<mediaItem>` rather than a dedicated per-page gallery type.
// Distinct from the older `mediaGalleryItem` (still used by the
// not-yet-migrated Community Membership gallery) mainly in supporting a real
// uploaded video file instead of only an external URL string.
//
// Videos render with their own frame, no separate poster (see `posterImage`
// below for why — a decision reversal, not an oversight): the frame a
// browser shows before/after playback is whatever the video's own first
// frame/native controls provide, matching HorizontalGallery's rendering
// (components/HorizontalGallery.tsx) and Home hero's autoplaying background
// video (components/ui.tsx's HomeHero) alike.
export default defineType({
  name: "mediaItem",
  title: "Photo or video",
  type: "object",
  description: "One photo, or one video. / Одне фото або одне відео.",
  // Object-level (not field-level): "does this video have a usable source
  // at all" genuinely spans two sibling fields (videoFile OR videoUrl), so
  // one combined check here gives one clear, visible error rather than
  // splitting an inherently combined condition across two fields (where
  // neither field alone can say "you need EITHER of us"). Frontend
  // resolution (lib/sanityGallery.ts's resolveOne) silently drops a video
  // with neither source — this is what stops that gap from ever being
  // reached by a saved document in the first place. A photo (or a video
  // that already has a valid source) is untouched.
  validation: (rule) =>
    rule.custom((value) => {
      const v = value as { kind?: string; videoFile?: { asset?: unknown }; videoUrl?: string } | undefined;
      if (v?.kind !== "video") return true;
      const hasFile = !!v.videoFile?.asset;
      const hasValidUrl = !!v.videoUrl?.trim() && isDirectVideoFileUrl(v.videoUrl);
      if (hasFile || hasValidUrl) return true;
      return "A video needs either an uploaded video file or a valid direct video URL. / Відео потребує завантаженого відеофайлу або прямого посилання на відеофайл.";
    }),
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
      description:
        'A direct link to a video file, e.g. https://example.com/video.mp4 — used only if no file is uploaded above. A YouTube/Vimeo page link will not work here. / Пряме посилання на відеофайл, напр. https://example.com/video.mp4 — використовується, лише якщо файл вище не завантажено. Посилання на сторінку YouTube/Vimeo тут не працюватиме.',
      hidden: ({ parent }) => (parent as { kind?: string } | undefined)?.kind !== "video",
      // Keeps the promise this field's own description makes ("a direct
      // link to a video file") honest: without this, a manager could paste
      // a YouTube/Vimeo watch-page URL (or any other non-file webpage) and
      // it would save successfully, then silently fail to play — a
      // <video src> pointed at an HTML page just shows a blank player.
      // Shares its exact matching/message logic with the frontend's own
      // resolution (sanity/lib/videoUrl.ts) so what's accepted here is
      // exactly what the site will actually try to play.
      validation: (rule) =>
        rule.custom((value: string | undefined, context) => {
          const parent = context.parent as { kind?: string; videoFile?: { asset?: unknown } } | undefined;
          if (parent?.kind !== "video") return true;
          // An uploaded file always wins over the URL (resolveGalleryItems
          // never even inspects videoUrl once a file is present) — so a
          // stray/invalid URL left behind alongside a real upload is
          // genuinely unused, not a publish blocker. This is what makes
          // "uploaded file + invalid URL" valid per the field's own
          // precedence promise, without requiring the editor to manually
          // clear the leftover URL first.
          if (parent?.videoFile?.asset) return true;
          if (!value?.trim()) return true; // optional — only used when no file is uploaded
          return videoUrlValidationMessage(value) ?? true;
        }),
    }),
    defineField({
      name: "posterImage",
      title: "Poster image (unused)",
      type: "image",
      options: { hotspot: true },
      description:
        "Not used anywhere on the site — every video (Catering/Event Decoration/Host at RORUM galleries, Home hero) shows its own frame instead, since a separate poster can have a different crop/aspect ratio and look wrong. Hidden from the editing form; kept only so no data is lost if it's ever reconnected. / Ніде на сайті не використовується — кожне відео (галереї «Кейтеринг»/«Оформлення подій»/«Прийом у RORUM», головна відео на Home) показує власний кадр, бо окреме зображення-заставка може мати інше кадрування й виглядати неправильно. Приховано з форми редагування; поле збережено, щоб не втратити дані, якщо його колись знову підключать.",
      // Hidden unconditionally, site-wide — not just in the 3
      // HorizontalGallery galleries. A read-only audit (raw perspective,
      // published + draft, every `page`/`communityMembershipPage` document,
      // every section's media[]) found ZERO stored posterImage assets
      // anywhere in the live dataset, and grep across the whole frontend
      // confirms no component reads `.posterImage` at all — not
      // lib/sanityGallery.ts (poster removed from its resolution, see that
      // file), not HomeHero (its own `poster` prop comes from a *different*
      // mediaItem's `.image`, see components/ui.tsx), not Community
      // Membership (a different schema type, `mediaGalleryItem`, with no
      // posterImage field at all). So there is no "genuine other consumer"
      // to preserve visibility for — this matches `caption` below exactly
      // (visible-unused → hidden site-wide, field/data preserved, never
      // deleted). No `validation` at all: an optional, unused, hidden field
      // has nothing to enforce.
      hidden: () => true,
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
    select: { media: "image", alt: "alt", kind: "kind" },
    prepare({ media, alt, kind }) {
      const en = (alt as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? (kind === "video" ? "(video)" : "(untitled)"), media };
    },
  },
});
