import { defineField, defineType } from "sanity";
import { SOCIAL_LINK_ICONS } from "@/sanity/components/actionIcons";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";

// Kept for every platform this object type has EVER stored (including
// "linkedin", currently unwanted per RORUM's own business decision — see
// MIGRATION_REPORT.md) so an old/legacy stored value still gets a real
// preview title instead of falling back to "(no platform selected)". Only
// the *selectable* list below (`options.list`) is narrowed to what a
// manager should be able to pick going forward.
const PLATFORM_TITLES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

// This object type is used ONLY by the `socialLinks` singleton (Contact/
// Header/Footer's shared profile list) — confirmed by a full-codebase
// search: Event Share's own share-platform list (event.ts's
// SHARE_ACTION_TYPES, rendered by components/EventShare.tsx) is a
// completely separate, hardcoded schema that does not reuse this type, and
// still supports LinkedIn unchanged. RORUM does not currently have a
// LinkedIn profile that should appear via the shared socialLinks list —
// narrowed to exactly the 2 platforms that do.
//
// Confirmed live (not assumed): Sanity's `options.list` on a plain string
// field DOES retroactively invalidate an already-stored value that isn't
// in the list ("Value ... did not match any allowed values") — it is NOT
// picker-only. This currently puts the *published* socialLinks document
// (which still has a stray "linkedin" entry) into an error state — that is
// expected and correct, not a bug to route around: Studio's Publish button
// is governed by the *draft's* own validation (drafts.socialLinks has
// neither the field-value error above nor the field at all, since the
// draft already only has Instagram/Facebook — see MIGRATION_REPORT.md Part
// 22), so the manager can still publish the clean draft normally; the
// published doc's transient error disappears the moment they do, since
// publishing replaces it with the draft's content entirely.
const SELECTABLE_PLATFORMS = [
  { title: "Instagram", value: "instagram" },
  { title: "Facebook", value: "facebook" },
] as const;

// Not localized: platform, URL and brand color are identical regardless of
// language. Only `label` (used as the link's accessible name) is localized.
export default defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  description:
    "One social media link shown on the contact page. / Одне посилання на соцмережу, що показується на сторінці контактів.",
  fields: [
    defineField({
      name: "icon",
      title: "Platform",
      type: "string",
      description: "Which platform this link is for. / Для якої платформи це посилання.",
      options: {
        list: [...SELECTABLE_PLATFORMS],
      },
      validation: (rule) => [
        rule.required(),
        // Nothing on the site (frontend or Studio) currently has a reason to
        // show the same platform twice — a duplicate is far more likely a
        // mistake (e.g. adding a link twice) than an intentional second
        // profile. A visible error catches it immediately instead of
        // silently rendering two identical icons.
        rule.custom((value: string | undefined, context) => {
          if (!value) return true;
          const doc = context.document as { links?: { _key?: string; icon?: string }[] } | undefined;
          const ownKey = (context.parent as { _key?: string } | undefined)?._key;
          const duplicate = doc?.links?.some((l) => l._key !== ownKey && l.icon === value);
          return duplicate ? `Another link already uses ${value} — each platform should only appear once.` : true;
        }),
      ],
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      description: "Full profile URL. / Повна URL-адреса профілю.",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https", "whatsapp"] }),
    }),
    defineField({
      name: "label",
      title: "Accessible label",
      type: "internationalizedArrayString",
      description: 'E.g. "Instagram" — read by screen readers. Required in English, Danish and Ukrainian. / Напр. «Instagram» — читається програмами читання з екрана. Обов\'язково англійською, данською та українською.',
      validation: requireAllLanguages(),
    }),
    defineField({
      name: "brandColor",
      title: "Brand color (hex) — no longer used",
      type: "string",
      description:
        "The hover background color is now derived automatically from the selected platform — this field is kept only for old data and has no effect. / Колір фону при наведенні тепер визначається автоматично за платформою — це поле збережено лише для старих даних і більше не впливає на сайт.",
      hidden: true,
    }),
  ],
  preview: {
    select: { icon: "icon", href: "href" },
    prepare({ icon, href }) {
      return {
        title: (typeof icon === "string" && PLATFORM_TITLES[icon]) || "(no platform selected)",
        subtitle: href,
        media: typeof icon === "string" ? SOCIAL_LINK_ICONS[icon] : undefined,
      };
    },
  },
});
