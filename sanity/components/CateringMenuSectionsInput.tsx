"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";

// Every category a manager adds through this component gets this icon by
// default — a neutral, genuinely food-related starting point they can
// immediately change via the Lucide picker on the category's own
// "categoryIcon" item (see contentItem.ts's ITEM_ROLE_RULES — that item
// shows only the icon field, nothing else).
const DEFAULT_CATEGORY_ICON = "UtensilsCrossed";

// Sanity's own supported mechanism for suppressing specific array actions —
// `ArrayOptions.disableActions` (see @sanity/types) — not a CSS selector.
// "add"/"addBefore"/"addAfter" remove the generic array-add control
// entirely (the ONLY creation path left is this component's own
// "+ Add category" button, below). "duplicate"/"copy" are disabled too:
// duplicating a section would copy its `sectionKey` verbatim, producing two
// sections with the same key — exactly the "duplicate sectionKey" defect
// class the Catering audit checks for. "remove" (delete) and reordering
// (drag — not an entry in ArrayActionName, always available) are left
// enabled, matching "manager can reorder/delete categories."
const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

function generateSectionKey(): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "").slice(0, 10) : Math.random().toString(36).slice(2, 12);
  return `menuCategory-${random}`;
}

/**
 * Replaces the default array input for `page.sections` — but ONLY on
 * `page-catering-menu-examples` (every other page's sections array keeps
 * the unmodified default editor: generic add, duplicate, everything).
 *
 * Two things, together, make "+ Add category" the ONLY manager-facing
 * creation path on this document:
 *   1. `renderDefault` is called with a `schemaType` whose `options`
 *      carries `disableActions` (see above) — Sanity's own array UI hides
 *      its generic add/duplicate/copy controls entirely when told to.
 *      Reordering (native drag) and per-item open/edit/delete are
 *      untouched, since those aren't in this array's disabled-action list.
 *   2. The "+ Add category" button, rendered BELOW the existing category
 *      list (real DOM order — the list is rendered first, the button
 *      after; not a CSS reorder), inserts a FULLY VALID menu category in
 *      one step, appended to the end: `_type`, a generated stable
 *      `sectionKey`, `sectionKind: "menuCategory"`, and a `categoryIcon`
 *      item — none of which a non-technical manager should ever need to
 *      type in by hand. `sectionKind`/`sectionKey` are hidden on this
 *      document's sections by pageSection.ts's own `hidden` logic once
 *      they're set (which this button always ensures), so opening a
 *      category added this way never surfaces either field.
 *
 * Renaming a category is just editing its `title`/`label` — `sectionKey`
 * stays untouched (locked once set, see pageSection.ts), so a rename can
 * never change the stable identifier the frontend looks the category up
 * by.
 */
export function CateringMenuSectionsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const isCateringMenuExamples = documentId?.replace(/^drafts\./, "") === "page-catering-menu-examples";
  const [adding, setAdding] = useState(false);

  if (!isCateringMenuExamples) {
    return props.renderDefault(props);
  }

  function addCategory() {
    setAdding(true);
    const sectionKey = generateSectionKey();
    props.onChange(
      insert(
        [
          {
            _key: sectionKey,
            _type: "pageSection",
            sectionKey,
            sectionKind: "menuCategory",
            items: [{ _key: "categoryIcon", _type: "contentItem", itemKey: "categoryIcon", icon: DEFAULT_CATEGORY_ICON }],
          },
        ],
        "after",
        [-1],
      ),
    );
    setAdding(false);
  }

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      <Text size={1} weight="semibold">
        Menu categories
      </Text>
      {props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions })}
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Text size={1} muted>
            Adds a new category card at the end of the list — it starts empty with a default icon you can change right away.
            To add dishes, open the category and use its own &ldquo;+ Add dish&rdquo; button. / Додає нову картку категорії в
            кінець списку — вона починається порожньою, зі стандартною іконкою, яку можна одразу змінити. Щоб додати страви,
            відкрийте категорію та скористайтеся власною кнопкою &laquo;+ Додати страву&raquo;.
          </Text>
          <Box>
            <Button text="+ Add category" tone="primary" disabled={adding} onClick={addCategory} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
