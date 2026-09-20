import { defineField, defineType } from "sanity";

// A gallery slot that's either a photo or a short muted video (e.g. the
// Community Membership page's event-recap gallery, which currently mixes
// both) — exactly one of `image`/`videoUrl` should be set per item.
export default defineType({
  name: "mediaGalleryItem",
  title: "Photo or video",
  type: "object",
  description:
    "One gallery slot — fill in either a photo or a video link, not both. / Один елемент галереї — заповніть або фото, або посилання на відео, не обидва.",
  fields: [
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      description: "Leave empty if this slot is a video. / Залиште порожнім, якщо цей елемент — відео.",
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "string",
      description: "Direct link to a short muted video file, e.g. /videos/... — leave empty if this slot is a photo. / Пряме посилання на короткий відеофайл без звуку — залиште порожнім, якщо цей елемент — фото.",
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "internationalizedArrayString",
      description: "Describes the photo/video for screen readers. Required. / Опис фото/відео для програм читання з екрана. Обов'язково.",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          return en?.value ? true : "English alt text is required.";
        }),
    }),
  ],
  preview: {
    select: { media: "image", alt: "alt", videoUrl: "videoUrl" },
    prepare({ media, alt, videoUrl }) {
      const en = (alt as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? (videoUrl ? "(video)" : "(untitled)"), media };
    },
  },
});
