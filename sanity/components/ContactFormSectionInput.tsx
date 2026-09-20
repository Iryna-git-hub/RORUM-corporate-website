"use client";

import { set, useFormValue, type ObjectInputProps } from "sanity";
import { Card, Checkbox, Flex, Stack, Text } from "@sanity/ui";

function isPageContact(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-contact";
}

interface SectionSetting {
  _key?: string;
  key?: string;
  value?: string;
}

const PRIVACY_SHOWN_KEY = "privacyConsentShown";
const PRIVACY_REQUIRED_KEY = "privacyConsentRequired";
const FAQ_PROMPT_SHOWN_KEY = "faqPromptShown";

/** Absent means "on" — preserves the current hardcoded behavior (privacy consent always shown+required, FAQ prompt always shown) until a manager explicitly changes it. */
function settingBoolean(settings: SectionSetting[] | undefined, key: string): boolean {
  const row = settings?.find((s) => s.key === key);
  return row ? row.value === "true" : true;
}

/**
 * Replaces the default object input for `pageSection` — but ONLY for
 * page-contact's own "form" section (chained onto CateringMenuCategoryInput,
 * which is pageSection's actual `components.input` — an object type can
 * only have one). Every other section, on every other document, renders
 * exactly as before via `props.renderDefault(props)`.
 *
 * Adds a friendly "Privacy policy consent" / "FAQ prompt" settings card
 * ABOVE the (already correctly scoped — see pageSection.ts's Contact-
 * specific field hides) default Title + Items render. Both toggles patch
 * the section's own `settings[]` array (the SAME general-purpose typed
 * mechanism pageSection.ts's own doc comment describes as "small layout
 * flags") — no new schema attribute path, and the raw `settings` array
 * itself stays hidden from the manager (see CONTACT_FORM_FORCE_HIDDEN…
 * — actually settings is already hidden for every "form"-kind section by
 * FIELD_VISIBILITY, so this UI is the ONLY way to reach these 2 flags).
 *
 * Simplification (disclosed): this does not reorder Form fields/Privacy
 * consent/FAQ prompt/Submit button/Success message into 6 fully separate
 * visual groups the way the task envisions — Sanity's object input doesn't
 * offer a supported way to reorder/split an object's OWN fields the way an
 * array input can filter/reorder `members`. What's actually delivered: a
 * clear settings card up top, plus the existing Items list (already
 * correctly restricted to Form fields/Privacy consent text is NOT stored
 * per-item — Submit button/Success message are its own reserved rows,
 * already labeled distinctly via ItemRoleAwareFieldLabel/preview).
 */
export function ContactFormSectionInput(props: ObjectInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const value = props.value as { sectionKey?: string; settings?: SectionSetting[] } | undefined;
  const isContactForm = isPageContact(documentId) && value?.sectionKey === "form";

  if (!isContactForm) {
    return props.renderDefault(props);
  }

  const settings = value?.settings ?? [];
  const privacyShown = settingBoolean(settings, PRIVACY_SHOWN_KEY);
  const privacyRequired = settingBoolean(settings, PRIVACY_REQUIRED_KEY);
  const faqPromptShown = settingBoolean(settings, FAQ_PROMPT_SHOWN_KEY);

  function setFlag(key: string, next: boolean) {
    const existingIndex = settings.findIndex((s) => s.key === key);
    if (existingIndex === -1) {
      props.onChange(set([...settings, { _key: key, _type: "sectionSetting", key, value: String(next) }], ["settings"]));
    } else {
      props.onChange(set(String(next), ["settings", { _key: settings[existingIndex]!._key ?? key }, "value"]));
    }
  }

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={4}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Privacy policy consent
            </Text>
            <Text size={1} muted>
              The checkbox text and the linked policy are edited in Shared form messages / Privacy Policy — this only
              controls whether the checkbox appears on Contact and whether it&rsquo;s required to submit. / Текст
              прапорця та посилання на політику редагуються у Shared form messages / Privacy Policy — тут керується
              лише те, чи показувати прапорець на сторінці контактів і чи є він обов&rsquo;язковим для надсилання.
            </Text>
            <Flex align="center" gap={2}>
              <Checkbox
                id="contact-privacy-shown"
                checked={privacyShown}
                onChange={(event) => setFlag(PRIVACY_SHOWN_KEY, event.currentTarget.checked)}
              />
              <Text as="label" size={1} htmlFor="contact-privacy-shown">
                Show the privacy consent checkbox / Показувати прапорець згоди з політикою конфіденційності
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Checkbox
                id="contact-privacy-required"
                checked={privacyRequired}
                disabled={!privacyShown}
                onChange={(event) => setFlag(PRIVACY_REQUIRED_KEY, event.currentTarget.checked)}
              />
              <Text as="label" size={1} htmlFor="contact-privacy-required">
                Require it before the form can be submitted / Зробити обов&rsquo;язковим для надсилання форми
              </Text>
            </Flex>
          </Stack>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              FAQ prompt
            </Text>
            <Text size={1} muted>
              The question/link text below Items uses Contact&rsquo;s own &ldquo;FAQ prompt question&rdquo;/&ldquo;FAQ
              prompt link text&rdquo; rows when filled in, otherwise the shared default from Shared form messages. /
              Текст запитання/посилання нижче, у блоці Items, використовує власні рядки сторінки контактів &laquo;FAQ
              prompt question&raquo;/&laquo;FAQ prompt link text&raquo;, якщо вони заповнені, інакше — спільний текст
              за замовчуванням із Shared form messages.
            </Text>
            <Flex align="center" gap={2}>
              <Checkbox
                id="contact-faq-prompt-shown"
                checked={faqPromptShown}
                onChange={(event) => setFlag(FAQ_PROMPT_SHOWN_KEY, event.currentTarget.checked)}
              />
              <Text as="label" size={1} htmlFor="contact-faq-prompt-shown">
                Show the FAQ prompt below the form / Показувати запрошення до FAQ під формою
              </Text>
            </Flex>
          </Stack>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
