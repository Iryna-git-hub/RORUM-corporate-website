import { defineField, defineType } from "sanity";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";

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
      validation: requireAllLanguages(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "internationalizedArrayText",
      description: "Optional visible caption. / Необов'язковий видимий підпис.",
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
