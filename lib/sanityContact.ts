import { pickLocalized } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import { contactDetails, socialLinks as fallbackSocialLinks, type SocialIconName } from "@/lib/siteConfig";
import { getItem, getSetting, type RawPageSection } from "@/lib/sanity-sections";
import type { ResolvedFormMessages } from "@/lib/sanityForms";
import type { ContactInfoQueryResult, SocialLinksQueryResult } from "@/sanity.types";

export interface ResolvedContactDetails {
  email: string;
  phone: string;
  phoneHref: string;
  address: string;
  shortAddress: string;
  mapHref: string;
  mapQueryAddress: string;
}

export interface ResolvedSocialLink {
  /** The Sanity `_key` — stable across reorders/edits, used as the React list key instead of `label` (a manager could give two links the same localized label text). */
  id: string;
  href: string;
  label: string;
  icon: SocialIconName;
  brandColor: string;
}

/** Shared by the Footer and the Contact page — both show the same facts. */
export function resolveContactDetails(doc: ContactInfoQueryResult | null | undefined): ResolvedContactDetails {
  return {
    email: doc?.email ?? contactDetails.email,
    phone: doc?.phone ?? contactDetails.phone,
    phoneHref: doc?.phoneHref ?? contactDetails.phoneHref,
    address: doc?.address ?? contactDetails.address,
    shortAddress: doc?.shortAddress ?? contactDetails.shortAddress,
    mapHref: doc?.mapHref ?? contactDetails.mapHref,
    mapQueryAddress: doc?.mapQueryAddress ?? contactDetails.mapQueryAddress,
  };
}

// The site only supports these 4 platforms (see components/SocialIcon.tsx —
// it has no rendering for anything else, and socialLink.ts's Studio "icon"
// field is a closed dropdown of exactly these 4). Brand colors are
// deterministic per platform, not manager-entered: a live audit found a
// real LinkedIn entry stored with brandColor "#000000" (plainly wrong — a
// leftover default, not LinkedIn's actual blue) because the field used to
// be manager-typed free text. Deriving here fixes that class of mistake for
// every current and future link, not just the one found; the schema's own
// `brandColor` field is hidden (not deleted) — see socialLink.ts.
const PLATFORM_BRAND_COLORS: Record<SocialIconName, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  whatsapp: "#25D366",
};

const PLATFORM_LABELS: Record<SocialIconName, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

// The shared `socialLinks` singleton (Header / Footer / Contact) is
// deliberately limited to the platforms a manager can actually pick in
// Studio — see sanity/schemaTypes/objects/socialLink.ts's
// SELECTABLE_PLATFORMS and MIGRATION_REPORT.md Part 22 (RORUM has no
// LinkedIn profile that should appear here). A value stored outside this
// set is legacy/unwanted data — currently a stray "linkedin" entry sits on
// the *published* socialLinks document (its intended removal via
// drafts.socialLinks was lost). Filtered out here so it never renders on
// the live site — and never renders a broken icon/URL — regardless of when
// the document itself is cleaned up in Studio. Keep this list in sync with
// socialLink.ts by hand: that schema file pulls in Studio-only component
// modules and must not be imported into server-rendered site code.
// Event Share's own LinkedIn support is a separate, unaffected code path
// (components/EventShare.tsx / event.ts SHARE_ACTION_TYPES).
const RENDERED_SOCIAL_PLATFORMS: readonly SocialIconName[] = ["instagram", "facebook"];

function isRenderedSocialPlatform(value: string | null | undefined): value is SocialIconName {
  return Boolean(value) && (RENDERED_SOCIAL_PLATFORMS as readonly string[]).includes(value as string);
}

/**
 * `doc === null`/`undefined` means Sanity is unavailable (or the singleton
 * genuinely doesn't exist yet) — falls back to the hardcoded starter list.
 * `doc.links` being an empty array means the manager has intentionally
 * removed every social link — returns `[]`, never resurrects the hardcoded
 * list (the bug this replaces: `doc?.links?.length ? ... : fallback`
 * treated "genuinely empty" the same as "missing").
 *
 * Links whose platform isn't one a manager can currently pick
 * (`RENDERED_SOCIAL_PLATFORMS` — see its comment above) are dropped: an
 * out-of-list stored value is legacy/unwanted data, not a profile to
 * render. A doc that contains ONLY such links still returns `[]` (it is
 * "present but has nothing renderable"), never the hardcoded fallback.
 */
export function resolveSocialLinks(
  doc: SocialLinksQueryResult | null | undefined,
  locale: Locale,
): ResolvedSocialLink[] {
  if (doc == null) return fallbackSocialLinks.filter((l) => isRenderedSocialPlatform(l.icon));
  return (doc.links ?? [])
    .filter((l) => isRenderedSocialPlatform(l?.icon))
    .map((l) => {
      const icon = l!.icon as SocialIconName;
      return {
        id: l?._key ?? l?.href ?? icon,
        href: l?.href ?? "",
        label: pickLocalized(l?.label, locale) ?? PLATFORM_LABELS[icon],
        icon,
        brandColor: PLATFORM_BRAND_COLORS[icon] ?? "#000000",
      };
    });
}

export type ContactDetailKey = "address" | "phone" | "email";
const DEFAULT_CONTACT_DETAIL_ORDER: ContactDetailKey[] = ["address", "phone", "email"];
const CONTACT_DETAIL_ITEM_KEY_PREFIX = "contactDetail-";

/**
 * Reads the Contact page's hero section for its manager-configured
 * Address/Phone/Email display order — see
 * sanity/components/ContactDetailsOrderInput.tsx. Presence in the array
 * (itemKey `contactDetail-{address,phone,email}`) means "shown"; array
 * order is display order; a detail with no matching row is hidden. The
 * underlying facts always come from `contactInfo` (via
 * resolveContactDetails) — this only decides which rows to render and in
 * what order.
 *
 * `heroSection === undefined` means page-contact itself doesn't exist yet
 * (Sanity unavailable, or the page was never migrated) — falls back to the
 * original hardcoded Address -> Phone -> Email order. Once page-contact
 * exists, its hero section is expected to already carry the 3 reserved rows
 * (seeded once by scripts/migrate-contact-details-order.ts) — an empty
 * result at that point means the manager intentionally hid every detail,
 * and must never resurrect all 3.
 */
const SUPPORTED_CONTACT_DETAIL_KEYS: readonly ContactDetailKey[] = ["address", "phone", "email"];

function isContactDetailKey(value: string): value is ContactDetailKey {
  return (SUPPORTED_CONTACT_DETAIL_KEYS as readonly string[]).includes(value);
}

export function resolveContactDetailOrder(heroSection: RawPageSection | undefined): ContactDetailKey[] {
  if (!heroSection) return DEFAULT_CONTACT_DETAIL_ORDER;
  const seen = new Set<ContactDetailKey>();
  const result: ContactDetailKey[] = [];
  for (const item of heroSection.items ?? []) {
    const key = item.itemKey;
    if (!key?.startsWith(CONTACT_DETAIL_ITEM_KEY_PREFIX)) continue;
    const type = key.slice(CONTACT_DETAIL_ITEM_KEY_PREFIX.length);
    if (!isContactDetailKey(type)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`resolveContactDetailOrder: ignoring unrecognized contact-detail marker "${key}"`);
      }
      continue;
    }
    if (seen.has(type)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`resolveContactDetailOrder: ignoring duplicate contact-detail marker "${key}"`);
      }
      continue;
    }
    seen.add(type);
    result.push(type);
  }
  return result;
}

export interface ResolvedPrivacyConsentSettings {
  shown: boolean;
  required: boolean;
}

/** Absent settings mean "on" — preserves the site's current hardcoded behavior (always shown, always required) until a manager explicitly changes it via ContactFormSectionInput. */
export function resolvePrivacyConsentSettings(formSection: RawPageSection | undefined): ResolvedPrivacyConsentSettings {
  return {
    shown: getSetting(formSection, "privacyConsentShown") !== "false",
    required: getSetting(formSection, "privacyConsentRequired") !== "false",
  };
}

export interface ResolvedFaqPrompt {
  shown: boolean;
  question?: string;
  label?: string;
  href: string;
}

/**
 * Contact-specific override for the FAQ inline prompt (question + link
 * text/destination) — falls back to the shared `formMessages.faqQuestion`/
 * `.faqLabel` (via `question`/`label` being `undefined`) whenever the
 * Contact-specific rows aren't configured. `shown` is a separate toggle
 * (absent = shown, matching every other Contact form setting) since the
 * shared default should still render when Contact-specific text isn't set.
 */
export function resolveFaqPrompt(formSection: RawPageSection | undefined, locale: Locale): ResolvedFaqPrompt {
  const questionItem = getItem(formSection, "faqPromptQuestion");
  const labelItem = getItem(formSection, "faqPromptLabel");
  return {
    shown: getSetting(formSection, "faqPromptShown") !== "false",
    question: pickLocalized(questionItem?.title, locale),
    label: pickLocalized(labelItem?.title, locale),
    href: labelItem?.href?.trim() || "/faq",
  };
}

export type ContactFormFieldType = "text" | "email" | "phone" | "multiline";

export interface ResolvedContactFormField {
  /** Stable, technical id — used as the HTML input name/id. Never shown to the manager (see contentItem.ts's "Contact form field" role). */
  name: string;
  type: ContactFormFieldType;
  label: string;
  placeholder: string;
}

const CONTACT_FORM_FIELD_ITEM_KEY_PREFIX = "field-";

// Duplicated (not imported) from sanity/components/ContactFormFieldTypeInput.tsx's
// own CONTACT_FORM_FIELD_TYPES on purpose — that file is a "use client"
// Sanity Studio component and shouldn't be pulled into server-rendered site
// code just for this list of 4 values. Keep both lists in sync by hand if a
// 5th type is ever added.
const SUPPORTED_CONTACT_FORM_FIELD_TYPES: readonly ContactFormFieldType[] = ["text", "email", "phone", "multiline"];

function isSupportedContactFormFieldType(value: string | null | undefined): value is ContactFormFieldType {
  return Boolean(value) && (SUPPORTED_CONTACT_FORM_FIELD_TYPES as readonly string[]).includes(value as string);
}

function defaultContactFormFields(messages: ResolvedFormMessages): ResolvedContactFormField[] {
  return [
    { name: "name", type: "text", label: messages.fullNameLabel, placeholder: messages.fullNameLabel },
    { name: "phone", type: "phone", label: messages.phoneLabel, placeholder: "+45 12 34 56 78" },
    { name: "email", type: "email", label: messages.emailLabel, placeholder: "you@example.com" },
    { name: "message", type: "multiline", label: messages.messageLabel, placeholder: messages.contactFormMessagePlaceholder },
  ];
}

/**
 * Reads the Contact page's form section for its manager-configured list of
 * form fields — see sanity/components/ContactFormFieldTypeInput.tsx and
 * contentItem.ts's "Contact form field" role. `formSection === undefined`
 * (page-contact doesn't exist) falls back to the original hardcoded
 * Name/Phone/Email/Message fields. Once page-contact exists, its form
 * section is expected to already carry the 4 reserved rows (seeded once by
 * scripts/migrate-contact-form-fields.ts, copying formMessages' existing
 * approved labels) — an empty result at that point means the manager
 * intentionally removed every field, and must never resurrect the 4
 * defaults.
 */
export function resolveContactFormFields(
  formSection: RawPageSection | undefined,
  messages: ResolvedFormMessages,
  locale: Locale,
): ResolvedContactFormField[] {
  if (!formSection) return defaultContactFormFields(messages);
  const seenNames = new Set<string>();
  const result: ResolvedContactFormField[] = [];
  for (const item of formSection.items ?? []) {
    const key = item.itemKey;
    if (!key?.startsWith(CONTACT_FORM_FIELD_ITEM_KEY_PREFIX)) continue;
    const name = key.slice(CONTACT_FORM_FIELD_ITEM_KEY_PREFIX.length);
    // A malformed/duplicate id could otherwise produce two form fields
    // sharing one HTML id/name (the second silently shadowing the first's
    // submitted value) — never let that reach the rendered form.
    if (!name || seenNames.has(name)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`resolveContactFormFields: ignoring form field with ${!name ? "an empty" : "a duplicate"} id ("${key}")`);
      }
      continue;
    }
    seenNames.add(name);
    result.push({
      name,
      type: isSupportedContactFormFieldType(item.value) ? item.value : "text",
      label: pickLocalized(item.title, locale) ?? "",
      placeholder: pickLocalized(item.text, locale) ?? "",
    });
  }
  return result;
}
