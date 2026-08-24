"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";
import { EventsFiltersInput } from "@/sanity/components/EventsFiltersInput";

// Same supported Sanity mechanism as every other custom array input here —
// ArrayOptions.disableActions, not CSS. Applied to every group rendered
// below (field rows AND each reserved single-item row) — "+ Add form field"/
// the explicit "+ Add <reserved row>" buttons are the sole creation paths;
// native "remove" stays enabled everywhere (a manager can still
// intentionally clear a reserved row, e.g. to fall back to the shared FAQ
// prompt default) and native reorder stays enabled for the field rows.
const DISABLE_GENERIC_ADD = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

const FIELD_ITEM_KEY_PREFIX = "field-";

function isPageContact(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-contact";
}

interface ContentItemMember {
  _key: string;
  itemKey?: string;
}

function itemKeyOf(member: ArrayOfObjectsInputProps["members"][number]): string | undefined {
  if (member.kind !== "item") return undefined;
  return (member.item.value as ContentItemMember | undefined)?.itemKey;
}

/**
 * Full `crypto.randomUUID()` (collision-safe by construction — see
 * FaqSectionsInput.tsx's own identical convention), checked against the
 * current items' own keys anyway so two rapid clicks can never collide even
 * in an environment where Web Crypto were ever unavailable.
 */
function generateFieldItemKey(existingKeys: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const key = `${FIELD_ITEM_KEY_PREFIX}${suffix}`;
    if (!existingKeys.has(key)) return key;
  }
  throw new Error("generateFieldItemKey: exhausted retries — this should be statistically impossible");
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY on
 * page-contact's own form section (chained onto ContactDetailsOrderInput,
 * which is `items`'s actual `components.input` once every earlier link in
 * the chain — Catering dishes/offerings, FAQ questions, Contact's hero
 * detail-order rows — has already ruled itself out; see pageSection.ts's own
 * comment on why `items` can only have one `components.input`).
 *
 * Five manager-facing groups over the one underlying array (Task 3):
 *   1. Form fields — the manager-extensible "field-*" rows, in stored
 *      order, native remove/reorder preserved, generic add/duplicate/copy
 *      disabled — "+ Add form field" is the sole creation path, always
 *      producing a minimal, correctly-shaped, empty field (no label/
 *      placeholder pre-written; RoleAwareAllLanguagesInput shows all 3 empty
 *      language rows the instant the manager opens Label).
 *   2. Privacy consent — informational only here: the actual toggle lives in
 *      ContactFormSectionInput's own settings card immediately above this
 *      array (one control, not duplicated in two places).
 *   3. FAQ prompt — the optional "faqPromptQuestion"/"faqPromptLabel"
 *      reserved rows (present = Contact-specific override, absent = the
 *      shared formMessages default still shows — see
 *      lib/sanityContact.ts's resolveFaqPrompt).
 *   4. Submit button — the required "submitLabel" reserved row.
 *   5. Success message — the required "successMessage" reserved row.
 *
 * Every reserved row is rendered through the SAME default single-item form
 * contentItem.ts's own ITEM_ROLE_RULES already restricts to just the
 * relevant field(s) (title/text/href — never itemKey/icon/image/value) —
 * this component only decides grouping/labelling/creation, not per-field
 * visibility, so it can never drift from what validation itself allows.
 *
 * If a required reserved row (Submit button/Success message) is missing,
 * this shows an explicit "+ Add" action instead of silently recreating it on
 * mount — an unexpected absence is a real, visible manager decision to make,
 * not something to paper over (Task 3's explicit instruction).
 */
export function ContactFormItemsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isContactForm = isPageContact(documentId) && parent?.sectionKey === "form";
  const [adding, setAdding] = useState(false);

  if (!isContactForm) {
    // Chained (not both wired independently) — see this file's own doc
    // comment for why `items` can only have one components.input.
    // EventsFiltersInput itself delegates to props.renderDefault for every
    // non-Events-filters items array, so every other section's items are
    // unaffected.
    return <EventsFiltersInput {...props} />;
  }

  const fieldMembers = props.members.filter((m) => itemKeyOf(m)?.startsWith(FIELD_ITEM_KEY_PREFIX));
  const submitLabelMember = props.members.find((m) => itemKeyOf(m) === "submitLabel");
  const successMessageMember = props.members.find((m) => itemKeyOf(m) === "successMessage");
  const faqPromptQuestionMember = props.members.find((m) => itemKeyOf(m) === "faqPromptQuestion");
  const faqPromptLabelMember = props.members.find((m) => itemKeyOf(m) === "faqPromptLabel");
  const knownMembers = new Set([...fieldMembers, submitLabelMember, successMessageMember, faqPromptQuestionMember, faqPromptLabelMember].filter(Boolean));
  // Anything left over (stray/legacy data with an unrecognized itemKey)
  // stays visible via the untouched default list rather than disappearing —
  // same "never silently hide stray data" rule as ContactDetailsOrderInput.
  const otherMembers = props.members.filter((m) => !knownMembers.has(m));

  const fieldsSchemaType: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLE_GENERIC_ADD] },
  };

  function addField() {
    setAdding(true);
    const existingKeys = new Set((props.value ?? []).map((item) => (item as ContentItemMember).itemKey).filter((k): k is string => Boolean(k)));
    const itemKey = generateFieldItemKey(existingKeys);
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey }], "after", [-1]));
    setAdding(false);
  }

  function addReservedRow(itemKey: string) {
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey }], "after", [-1]));
  }

  function renderSingle(member: ArrayOfObjectsInputProps["members"][number] | undefined) {
    if (!member) return null;
    return <Box>{props.renderDefault({ ...props, schemaType: fieldsSchemaType, members: [member] })}</Box>;
  }

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Form fields
        </Text>
        <Text size={1} muted>
          The name/email/phone/message fields visitors fill in, in the order shown here. / Поля (ім&rsquo;я, email,
          телефон, повідомлення), які заповнюють відвідувачі, у показаному тут порядку.
        </Text>
        {fieldMembers.length === 0 ? (
          <Text size={1} muted>
            No form fields are configured — the form has nothing to fill in. / Жодного поля форми не налаштовано — у
            формі немає що заповнювати.
          </Text>
        ) : null}
        <Box>{props.renderDefault({ ...props, schemaType: fieldsSchemaType, members: fieldMembers })}</Box>
        <Card padding={3} radius={2} border tone="primary">
          <Stack space={3}>
            <Text size={1} muted>
              Adds a new, empty field at the end of the form. / Додає нове порожнє поле в кінець форми.
            </Text>
            <Box>
              <Button text="+ Add form field" tone="primary" disabled={adding} onClick={addField} />
            </Box>
          </Stack>
        </Card>
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="semibold">
          Privacy consent
        </Text>
        <Text size={1} muted>
          Shown/required is controlled in the card above Items on this section. / Показ/обов&rsquo;язковість
          керуються карткою вище, над блоком «Items» цього розділу.
        </Text>
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="semibold">
          FAQ prompt
        </Text>
        <Text size={1} muted>
          Optional — fill in both fields below to replace the shared question/link text with Contact&rsquo;s own; leave
          both empty to keep using the shared default. / Необов&rsquo;язково — заповніть обидва поля нижче, щоб
          замінити спільний текст запитання/посилання власним для сторінки контактів; залиште порожніми, щоб
          використовувати спільний текст.
        </Text>
        {renderSingle(faqPromptQuestionMember)}
        {!faqPromptQuestionMember ? (
          <Box>
            <Button text="+ Add FAQ prompt question" mode="ghost" onClick={() => addReservedRow("faqPromptQuestion")} />
          </Box>
        ) : null}
        {renderSingle(faqPromptLabelMember)}
        {!faqPromptLabelMember ? (
          <Box>
            <Button text="+ Add FAQ prompt link" mode="ghost" onClick={() => addReservedRow("faqPromptLabel")} />
          </Box>
        ) : null}
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="semibold">
          Submit button
        </Text>
        {submitLabelMember ? (
          renderSingle(submitLabelMember)
        ) : (
          <Card padding={3} radius={2} border tone="critical">
            <Stack space={3}>
              <Text size={1}>
                Missing — the submit button has no configured text. / Відсутнє — для кнопки надсилання не налаштовано
                текст.
              </Text>
              <Box>
                <Button text="+ Add submit button text" tone="critical" onClick={() => addReservedRow("submitLabel")} />
              </Box>
            </Stack>
          </Card>
        )}
      </Stack>

      <Stack space={2}>
        <Text size={1} weight="semibold">
          Success message
        </Text>
        {successMessageMember ? (
          renderSingle(successMessageMember)
        ) : (
          <Card padding={3} radius={2} border tone="critical">
            <Stack space={3}>
              <Text size={1}>
                Missing — nothing is configured to show after a successful submission. / Відсутнє — не налаштовано, що
                показувати після успішного надсилання.
              </Text>
              <Box>
                <Button text="+ Add success message" tone="critical" onClick={() => addReservedRow("successMessage")} />
              </Box>
            </Stack>
          </Card>
        )}
      </Stack>

      {otherMembers.length > 0 ? (
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Other items
          </Text>
          <Text size={1} muted>
            Unrecognized rows kept visible rather than hidden. / Нерозпізнані рядки залишено видимими, а не приховано.
          </Text>
          <Box>{props.renderDefault({ ...props, schemaType: fieldsSchemaType, members: otherMembers })}</Box>
        </Stack>
      ) : null}
    </Stack>
  );
}
