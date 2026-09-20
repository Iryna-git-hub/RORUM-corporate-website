"use client";

import { useEffect, useState } from "react";
import { insert, PatchEvent, unset, useClient, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { IntentLink } from "sanity/router";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { ContactFormItemsInput } from "@/sanity/components/ContactFormItemsInput";

const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

const SUPPORTED_DETAILS = [
  { itemKey: "contactDetail-address", label: "Address" },
  { itemKey: "contactDetail-phone", label: "Phone" },
  { itemKey: "contactDetail-email", label: "Email" },
] as const;

const PREVIEW_FIELD: Record<string, string> = {
  "contactDetail-address": "address",
  "contactDetail-phone": "phone",
  "contactDetail-email": "email",
};

const SOCIAL_PLATFORM_TITLES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

function isPageContact(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-contact";
}

interface ContentItemMember {
  _key: string;
  itemKey?: string;
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY on
 * page-contact's own hero section (chained onto FaqQuestionItemsInput,
 * which is `items`'s actual `components.input` once every earlier link in
 * the chain — Catering dishes/offerings, FAQ questions — has already ruled
 * itself out; see pageSection.ts's own comment on why `items` can only have
 * one `components.input`).
 *
 * Three independent things live in/around this one array:
 *   - the "followUsTitle" reserved row (its own ITEM_ROLE_RULES role) —
 *     rendered via the untouched default single-item list, so its own
 *     editing chrome (open/edit) is unaffected. Immediately below it, a
 *     "Follow us — social links" card summarizes which platforms are
 *     currently enabled (read-only, live-fetched) and links out to the
 *     `socialLinks` singleton via IntentLink — this component never patches
 *     `socialLinks` itself, only navigates to it (Task 6).
 *   - up to 3 "contactDetail-{address,phone,email}" reserved rows — pure
 *     display/order markers (see contentItem.ts's "Contact detail display
 *     row" role, `visible: []`): presence = shown, array order = display
 *     order, no content of their own (the underlying facts live in the
 *     separate `contactInfo` singleton). Rendered as friendly cards with a
 *     read-only live preview of the current contactInfo value, "Move up"/
 *     "Move down"/"Remove" controls, an "Add" row offering only the
 *     currently-absent supported details, and an "Edit shared contact
 *     information" IntentLink that opens the `contactInfo` singleton
 *     directly (with an explanation that the Footer reads the same values)
 *     — this never patches `contactInfo` from here, only navigates to it.
 *
 * An unrecognized `contactDetail-*` marker (anything other than
 * address/phone/email) is never treated as one of the 3 known cards — it's
 * left in the untouched default item list below instead, so stray/malformed
 * data stays visible and editable rather than silently disappearing.
 *
 * Simplification (disclosed, matching FaqSectionsInput's precedent): native
 * drag-and-drop reorder isn't used for the contactDetail-* subset — Sanity's
 * array reorder always operates on the FULL underlying array by index, and
 * safely reordering only a filtered subset (while followUsTitle stays
 * fixed) isn't something the native mechanism supports without
 * reimplementing drag-and-drop. Up/down buttons are a fully correct,
 * simpler substitute for reordering exactly 3 possible rows — each move is
 * still a key-addressed `unset`+`insert` PatchEvent (see `moveDetail`
 * below), never a full-array `set(next)` overwrite.
 */
export function ContactDetailsOrderInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isContactHero = isPageContact(documentId) && parent?.sectionKey === "hero";
  const client = useClient({ apiVersion: "2025-02-19" });
  const [preview, setPreview] = useState<Record<string, string | undefined>>({});
  const [socialLinksSummary, setSocialLinksSummary] = useState<{ icon?: string }[] | undefined>(undefined);

  useEffect(() => {
    if (!isContactHero) return;
    let cancelled = false;
    client
      .fetch<{ address?: string; phone?: string; email?: string } | null>(`*[_id == "contactInfo"][0]{address, phone, email}`)
      .then((doc) => {
        if (!cancelled) setPreview({ address: doc?.address, phone: doc?.phone, email: doc?.email });
      })
      .catch(() => {
        if (!cancelled) setPreview({});
      });
    client
      .fetch<{ links?: { icon?: string }[] } | null>(`*[_id == "socialLinks"][0]{links[]{icon}}`)
      .then((doc) => {
        if (!cancelled) setSocialLinksSummary(doc?.links ?? []);
      })
      .catch(() => {
        if (!cancelled) setSocialLinksSummary([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isContactHero, client]);

  if (!isContactHero) {
    // Chained (not both wired independently) — see this file's own doc
    // comment for why `items` can only have one components.input.
    // ContactFormItemsInput itself delegates to props.renderDefault for
    // every non-Contact-form items array, so every other section's items
    // are unaffected.
    return <ContactFormItemsInput {...props} />;
  }

  function isDetailMember(member: (typeof props.members)[number]): boolean {
    if (member.kind !== "item") return false;
    const value = member.item.value as ContentItemMember | undefined;
    // Only the 3 supported detail types — an unrecognized
    // "contactDetail-something" (stray/malformed data) is left in the
    // "other members" group instead, rendered by the untouched default item
    // list rather than silently treated as one of the 3 known cards.
    return Boolean(value?.itemKey && SUPPORTED_DETAILS.some((d) => d.itemKey === value.itemKey));
  }

  const otherMembers = props.members.filter((m) => !isDetailMember(m));
  const detailMembers = props.members
    .filter(isDetailMember)
    .map((m) => ({ key: m.key, value: (m as { item: { value: ContentItemMember } }).item.value }));

  const presentKeys = new Set(detailMembers.map((m) => m.value.itemKey));
  const availableToAdd = SUPPORTED_DETAILS.filter((d) => !presentKeys.has(d.itemKey));

  function addDetail(itemKey: string) {
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey }], "after", [-1]));
  }

  function removeDetail(itemObjectKey: string) {
    props.onChange(unset([{ _key: itemObjectKey }]));
  }

  /**
   * Reorders by moving one contactDetail-* entry to just before/after its
   * detail-list neighbor — a key-addressed `unset` + `insert` combined into
   * one atomic PatchEvent (the same primitive Sanity's own array-reorder
   * machinery uses internally), never a full-array `set(next)` overwrite.
   * followUsTitle (or any other non-detail item) is addressed by `_key`
   * throughout, so it's never touched or repositioned by this.
   */
  function moveDetail(itemObjectKey: string, direction: -1 | 1) {
    const fullArray = (props.value ?? []) as ContentItemMember[];
    const detailKeys = fullArray.filter((item) => item.itemKey && SUPPORTED_DETAILS.some((d) => d.itemKey === item.itemKey)).map((item) => item._key);
    const currentPosition = detailKeys.indexOf(itemObjectKey);
    const neighborPosition = currentPosition + direction;
    if (currentPosition === -1 || neighborPosition < 0 || neighborPosition >= detailKeys.length) return;

    const itemToMove = fullArray.find((item) => item._key === itemObjectKey);
    const neighborKey = detailKeys[neighborPosition]!;
    if (!itemToMove) return;

    props.onChange(
      PatchEvent.from([
        unset([{ _key: itemObjectKey }]),
        insert([itemToMove], direction === -1 ? "before" : "after", [{ _key: neighborKey }]),
      ]),
    );
  }

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      <Box>{props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions, members: otherMembers })}</Box>

      <Card padding={3} radius={2} border tone="transparent">
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Follow us — social links
          </Text>
          <Text size={1} muted>
            The heading above is edited here on Contact; the actual Instagram/Facebook links are edited in one shared
            place, also used by the site&rsquo;s header and footer. / Заголовок вище редагується тут, на сторінці
            контактів; самі посилання на Instagram/Facebook редагують в одному спільному місці, яке також
            використовують шапка і підвал сайту.
          </Text>
          {socialLinksSummary === undefined ? null : socialLinksSummary.length === 0 ? (
            <Text size={1} muted>
              No social links are currently shown anywhere on the site. / Наразі жодні посилання на соцмережі на сайті
              не показуються.
            </Text>
          ) : (
            <Text size={1} muted>
              Currently shown: {socialLinksSummary.map((l) => SOCIAL_PLATFORM_TITLES[l.icon ?? ""] ?? l.icon).filter(Boolean).join(", ")}
            </Text>
          )}
          <Box>
            <Button as={IntentLink} intent="edit" params={{ id: "socialLinks", type: "socialLinks" }} text="Edit shared social links" tone="primary" mode="ghost" />
          </Box>
        </Stack>
      </Card>

      <Stack space={3}>
        <Text size={1} weight="semibold">
          Contact details shown on this page
        </Text>
        <Text size={1} muted>
          Choose which details appear and in what order, using Up/Down below each one. / Виберіть, які контактні дані
          показувати і в якому порядку — кнопками «Вгору»/«Вниз» під кожним пунктом.
        </Text>
        {detailMembers.length === 0 ? (
          <Text size={1} muted>
            No contact details are shown on the page right now. / Наразі жодні контактні дані на сторінці не показуються.
          </Text>
        ) : null}
        {detailMembers.map((m, index) => {
          const itemKey = m.value.itemKey ?? "";
          const info = SUPPORTED_DETAILS.find((d) => d.itemKey === itemKey);
          const previewValue = preview[PREVIEW_FIELD[itemKey] ?? ""];
          return (
            <Card key={m.key} padding={3} radius={2} border>
              <Flex align="center" justify="space-between" gap={3}>
                <Stack space={1}>
                  <Text size={1} weight="semibold">
                    {info?.label ?? itemKey}
                  </Text>
                  {previewValue ? (
                    <Text size={1} muted>
                      {previewValue}
                    </Text>
                  ) : (
                    <Text size={1} muted>
                      Not set yet — set it in Contact information. / Ще не заповнено — заповніть у Контактній інформації.
                    </Text>
                  )}
                </Stack>
                <Flex gap={2}>
                  <Button
                    text="↑"
                    mode="ghost"
                    disabled={index === 0}
                    onClick={() => moveDetail(m.value._key, -1)}
                    aria-label={`Move ${info?.label ?? itemKey} up`}
                  />
                  <Button
                    text="↓"
                    mode="ghost"
                    disabled={index === detailMembers.length - 1}
                    onClick={() => moveDetail(m.value._key, 1)}
                    aria-label={`Move ${info?.label ?? itemKey} down`}
                  />
                  <Button
                    text="Remove"
                    tone="critical"
                    mode="ghost"
                    onClick={() => removeDetail(m.value._key)}
                  />
                </Flex>
              </Flex>
            </Card>
          );
        })}
        {availableToAdd.length > 0 ? (
          <Flex gap={2} wrap="wrap">
            {availableToAdd.map((d) => (
              <Button key={d.itemKey} text={`+ Add ${d.label}`} tone="primary" mode="ghost" onClick={() => addDetail(d.itemKey)} />
            ))}
          </Flex>
        ) : null}
      </Stack>

      <Card padding={3} radius={2} border tone="transparent">
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Address, phone and email themselves
          </Text>
          <Text size={1} muted>
            The actual address, phone number and email are edited in one shared place, also used by the site&rsquo;s
            footer. / Саму адресу, телефон і email редагують в одному спільному місці, яке також використовує підвал
            сайту.
          </Text>
          <Box>
            <Button as={IntentLink} intent="edit" params={{ id: "contactInfo", type: "contactInfo" }} text="Edit shared contact information" tone="primary" mode="ghost" />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
