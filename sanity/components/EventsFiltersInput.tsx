"use client";

import { insert, PatchEvent, unset, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { EventsClosingCtaItemsInput } from "@/sanity/components/EventsClosingCtaItemsInput";
import { EVENT_FILTER_GROUPS as FILTER_GROUPS, EVENT_FILTER_MESSAGE_ROWS as MESSAGE_ROWS } from "@/shared/eventFilterDefinitions";

// Never add/duplicate/copy/remove — these 17 rows are a fixed, closed
// semantic set the filtering algorithm itself depends on (see
// shared/eventFilterDefinitions.ts's own doc comment); a manager can edit
// label text and reorder options within their own group, never add a new
// option or delete one the code still expects to exist.
const DISABLE_ALL_GENERIC_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy", "remove"] as const;

// FILTER_GROUPS/MESSAGE_ROWS now come from shared/eventFilterDefinitions.ts —
// the one dependency-free module both this Studio component and
// lib/eventFilters.ts import, so the two can never drift out of sync again
// (see MIGRATION_REPORT.md's Events Listing follow-up for the incident this
// replaces). Note the shared module's groups also carry each option's stable
// filter `value`, unused here — this component only needs itemKey/label.

function isPageEvents(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-events";
}

interface ContentItemMember {
  _key: string;
  itemKey?: string;
}

type Member = ArrayOfObjectsInputProps["members"][number];

function itemKeyOf(member: Member): string | undefined {
  if (member.kind !== "item") return undefined;
  return (member.item.value as ContentItemMember | undefined)?.itemKey;
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY on
 * page-events' own "filters" section (chained onto ContactFormItemsInput,
 * which is `items`'s actual `components.input` once every earlier link in
 * the chain has already ruled itself out; see pageSection.ts's own comment
 * on why `items` can only have one `components.input`).
 *
 * Presents the 14 pre-existing + 3 new (Events Listing Studio task, Section
 * 6) filter-label rows as 5 manager-facing groups — Date / Language / Price
 * / Availability, each with its own heading row and options in the
 * manager's own stored order, plus a separate "Filter messages" group for
 * the 3 rows that aren't part of any group (Clear filters / Empty-state
 * title / Empty-state text). Every row's own field editing (the Title
 * input, always showing EN/DA/UK immediately — see
 * RoleAwareAllLanguagesInput.tsx) is the untouched default single-item form;
 * this component only decides grouping, labelling and reorder-within-group.
 *
 * No add/duplicate/copy/remove anywhere in this array (Section 10: a fixed,
 * non-extensible semantic set) — only label editing and Move up/down,
 * constrained to stay inside each option's own group (a key-addressed
 * `unset`+`insert` PatchEvent, the same primitive
 * ContactDetailsOrderInput.tsx's own `moveDetail` uses, never a full-array
 * `set(next)`). Reordering genuinely changes what the public site renders —
 * `lib/eventFilters.ts`'s `resolveOrderedFilterOptions` reads this exact
 * stored order, it isn't cosmetic.
 *
 * If page-events' filters section is missing one of the 17 known rows
 * (shouldn't happen once scripts/migrate-events-filter-labels.ts has run),
 * that row's own card shows an explicit "Missing" note (and no Move
 * buttons, since there's nothing to move) rather than being silently
 * fabricated — a genuine data gap stays visible instead of being papered
 * over by an auto-created placeholder.
 */
export function EventsFiltersInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isEventsFilters = isPageEvents(documentId) && parent?.sectionKey === "filters";

  if (!isEventsFilters) {
    // Chained (not both wired independently) — see this file's own doc
    // comment for why `items` can only have one components.input.
    // EventsClosingCtaItemsInput itself delegates to props.renderDefault
    // for every non-Events-closingCta items array, so every other
    // section's items are unaffected.
    return <EventsClosingCtaItemsInput {...props} />;
  }

  const memberByItemKey = new Map(props.members.map((m) => [itemKeyOf(m), m] as const));
  const knownItemKeys = new Set<string>([
    ...FILTER_GROUPS.flatMap((g) => [g.headingItemKey as string, ...g.options.map((o) => o.itemKey as string)]),
    ...MESSAGE_ROWS.map((m) => m.itemKey as string),
  ]);
  const otherMembers = props.members.filter((m) => !knownItemKeys.has(itemKeyOf(m) ?? ""));

  const rowsSchemaType: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLE_ALL_GENERIC_ACTIONS] },
  };

  function renderRow(itemKey: string) {
    const member = memberByItemKey.get(itemKey);
    if (!member) {
      return (
        <Text key={itemKey} size={1} muted>
          Missing — this row doesn&rsquo;t exist yet on this document. / Відсутнє — цього рядка ще немає в цьому документі.
        </Text>
      );
    }
    return <Box key={itemKey}>{props.renderDefault({ ...props, schemaType: rowsSchemaType, members: [member] })}</Box>;
  }

  /** Moves an option's stored position within its OWN group only — never past the group's own first/last option, and never touching any other group's rows or the heading row. */
  function moveOption(group: (typeof FILTER_GROUPS)[number], itemKey: string, direction: -1 | 1) {
    const fullArray = (props.value ?? []) as ContentItemMember[];
    const groupItemKeysInOrder = fullArray.filter((item) => group.options.some((o) => o.itemKey === item.itemKey)).map((item) => item._key);
    const itemToMoveKey = fullArray.find((item) => item.itemKey === itemKey)?._key;
    if (!itemToMoveKey) return;
    const currentPosition = groupItemKeysInOrder.indexOf(itemToMoveKey);
    const neighborPosition = currentPosition + direction;
    if (currentPosition === -1 || neighborPosition < 0 || neighborPosition >= groupItemKeysInOrder.length) return;

    const itemToMove = fullArray.find((item) => item._key === itemToMoveKey);
    const neighborKey = groupItemKeysInOrder[neighborPosition]!;
    if (!itemToMove) return;

    props.onChange(
      PatchEvent.from([
        unset([{ _key: itemToMoveKey }]),
        insert([itemToMove], direction === -1 ? "before" : "after", [{ _key: neighborKey }]),
      ]),
    );
  }

  return (
    <Stack space={5}>
      {FILTER_GROUPS.map((group) => {
        const presentOptionKeys = group.options.map((o) => o.itemKey).filter((k) => memberByItemKey.has(k));
        return (
          <Stack key={group.groupKey} space={3}>
            <Text size={1} weight="semibold">
              {group.label}
            </Text>
            <Card padding={3} radius={2} border tone="transparent">
              <Stack space={2}>
                <Text size={1} muted>
                  Group heading shown above these options. / Заголовок групи, що показується над цими варіантами.
                </Text>
                {renderRow(group.headingItemKey)}
              </Stack>
            </Card>
            <Stack space={2}>
              {group.options.map((option) => {
                const itemKey = option.itemKey;
                const isPresent = memberByItemKey.has(itemKey);
                const presentIndex = presentOptionKeys.indexOf(itemKey);
                return (
                  <Card key={itemKey} padding={3} radius={2} border>
                    <Flex align="center" justify="space-between" gap={3}>
                      <Box flex={1}>
                        <Stack space={2}>
                          <Text size={1} muted>
                            {option.label}
                          </Text>
                          {renderRow(itemKey)}
                        </Stack>
                      </Box>
                      {isPresent ? (
                        <Flex gap={2}>
                          <Button
                            text="↑"
                            mode="ghost"
                            disabled={presentIndex === 0}
                            onClick={() => moveOption(group, itemKey, -1)}
                            aria-label={`Move ${option.label} up`}
                          />
                          <Button
                            text="↓"
                            mode="ghost"
                            disabled={presentIndex === presentOptionKeys.length - 1}
                            onClick={() => moveOption(group, itemKey, 1)}
                            aria-label={`Move ${option.label} down`}
                          />
                        </Flex>
                      ) : null}
                    </Flex>
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        );
      })}

      <Stack space={3}>
        <Text size={1} weight="semibold">
          Filter messages
        </Text>
        <Text size={1} muted>
          Text shown around the filters, not tied to one specific group. / Текст навколо фільтрів, не прив&rsquo;язаний до конкретної групи.
        </Text>
        <Stack space={2}>{MESSAGE_ROWS.map((row) => renderRow(row.itemKey))}</Stack>
      </Stack>

      {otherMembers.length > 0 ? (
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Other items
          </Text>
          <Text size={1} muted>
            Unrecognized rows kept visible rather than hidden. / Нерозпізнані рядки залишено видимими, а не приховано.
          </Text>
          <Box>{props.renderDefault({ ...props, schemaType: rowsSchemaType, members: otherMembers })}</Box>
        </Stack>
      ) : null}
    </Stack>
  );
}
