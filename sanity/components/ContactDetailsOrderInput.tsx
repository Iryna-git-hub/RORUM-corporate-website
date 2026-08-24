"use client";

import { useEffect, useState } from "react";
import { insert, set, unset, useClient, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";

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
 * Two independent things live in this one array:
 *   - the "followUsTitle" reserved row (its own ITEM_ROLE_RULES role) —
 *     rendered via the untouched default single-item list, so its own
 *     editing chrome (open/edit) is unaffected.
 *   - up to 3 "contactDetail-{address,phone,email}" reserved rows — pure
 *     display/order markers (see contentItem.ts's "Contact detail display
 *     row" role, `visible: []`): presence = shown, array order = display
 *     order, no content of their own (the underlying facts live in the
 *     separate `contactInfo` singleton). Rendered as friendly cards with a
 *     read-only live preview of the current contactInfo value, "Move up"/
 *     "Move down"/"Remove" controls, and an "Add" row offering only the
 *     currently-absent supported details.
 *
 * Simplification (disclosed, matching FaqSectionsInput's precedent): native
 * drag-and-drop reorder isn't used for the contactDetail-* subset — Sanity's
 * array reorder always operates on the FULL underlying array by index, and
 * safely reordering only a filtered subset (while followUsTitle stays
 * fixed) isn't something the native mechanism supports without
 * reimplementing drag-and-drop. Up/down buttons are a fully correct,
 * simpler substitute for reordering exactly 3 possible rows.
 */
export function ContactDetailsOrderInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isContactHero = isPageContact(documentId) && parent?.sectionKey === "hero";
  const client = useClient({ apiVersion: "2025-02-19" });
  const [preview, setPreview] = useState<Record<string, string | undefined>>({});

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
    return () => {
      cancelled = true;
    };
  }, [isContactHero, client]);

  if (!isContactHero) {
    return props.renderDefault(props);
  }

  function isDetailMember(member: (typeof props.members)[number]): boolean {
    if (member.kind !== "item") return false;
    const value = member.item.value as ContentItemMember | undefined;
    return Boolean(value?.itemKey?.startsWith("contactDetail-"));
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
   * Reorders by swapping two adjacent contactDetail-* entries' positions
   * within the FULL underlying array (props.value), then writing the whole
   * array back in one atomic `set` — the simplest fully-correct way to
   * reorder a subset when Sanity's own array patches address items by
   * position or `_key`, not "the Nth item of a filtered view". followUsTitle
   * (or any other non-detail item) never moves, since only the positions of
   * the two swapped contactDetail entries change.
   */
  function moveDetail(itemObjectKey: string, direction: -1 | 1) {
    const fullArray = (props.value ?? []) as ContentItemMember[];
    const detailIndexes = fullArray
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemKey?.startsWith("contactDetail-"))
      .map(({ index }) => index);
    const currentPositionInDetails = detailIndexes.findIndex((i) => fullArray[i]?._key === itemObjectKey);
    const swapWithPositionInDetails = currentPositionInDetails + direction;
    if (currentPositionInDetails === -1 || swapWithPositionInDetails < 0 || swapWithPositionInDetails >= detailIndexes.length) return;

    const arrayIndexA = detailIndexes[currentPositionInDetails]!;
    const arrayIndexB = detailIndexes[swapWithPositionInDetails]!;
    const next = [...fullArray];
    [next[arrayIndexA], next[arrayIndexB]] = [next[arrayIndexB]!, next[arrayIndexA]!];
    props.onChange(set(next));
  }

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      <Box>{props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions, members: otherMembers })}</Box>

      <Stack space={3}>
        <Text size={1} weight="semibold">
          Contact details shown (drag order not supported here — use Move up/down)
        </Text>
        {detailMembers.length === 0 ? (
          <Text size={1} muted>
            No contact details are shown on the page right now.
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
                      (set in Contact information)
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
    </Stack>
  );
}
