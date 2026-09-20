"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";
import { CateringOfferItemsInput } from "@/sanity/components/CateringOfferItemsInput";

// Same supported Sanity mechanism used by every other custom array input in
// this project — ArrayOptions.disableActions, not CSS. The generic add path
// would create a blank contentItem whose role only gets inferred after the
// fact (matched by sectionKind, per contentItem.ts's "Catering menu dish"
// ITEM_ROLE_RULES entry) — "+ Add dish" below is the sole intended creation
// path, always producing a correctly-keyed, correctly-typed dish immediately.
const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

const RESERVED_ICON_ITEM_KEY = "categoryIcon";

function generateDishItemKey(): string {
  const random = typeof crypto !== "undefined" && "getRandomValues" in crypto ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967295);
  return `dish${random}`;
}

function isPageCateringMenuExamples(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-catering-menu-examples";
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY when
 * the enclosing section is a `menuCategory` on `page-catering-menu-examples`
 * (a category's Dishes list). Every other `items` array (including
 * page-catering's own "philosophy" What We Offer bullets) delegates
 * unchanged to `CateringOfferItemsInput`, which itself is scoped to that one
 * case and otherwise renders the unmodified default input — chained because
 * `items` can only ever have one `components.input` registered.
 *
 * Two things make "+ Add dish" the ONLY manager-facing dish-creation path:
 *   1. `disableActions` removes the generic array add/duplicate/copy
 *      controls (Sanity's own supported mechanism — see
 *      CateringMenuSectionsInput.tsx for the identical precedent). Native
 *      reorder (drag) and remove stay enabled.
 *   2. "+ Add dish" inserts a minimal, correctly-shaped dish in one step: a
 *      random, stable `_key`, `_type: "contentItem"`, and an `itemKey`
 *      matching contentItem.ts's `Catering menu dish` role pattern
 *      (`/^(dish\d*)?$/`) — so it's never mistaken for an unaudited generic
 *      item and never exposes icon/link/value fields. Title/text/image are
 *      left entirely unset: CateringAllLanguagesInput (wired onto
 *      contentItem's title/text fields) shows all 3 language rows the
 *      instant the manager opens them, with nothing pre-written to the
 *      document until they actually type.
 *
 * The reserved `categoryIcon` item (this category's own tab icon, rendered
 * separately and up top by CateringMenuCategoryInput) is filtered out of
 * what's rendered here — Dishes must contain only actual dishes. This
 * filters `members` (what's DISPLAYED) only; `props.value`/`props.onChange`
 * are passed through completely untouched, so add/remove/reorder patches
 * (which Sanity computes by stable `_key`, not raw array index) are
 * unaffected by one item being hidden from view. `categoryIcon` itself is
 * never deleted, moved, or otherwise touched by this component.
 */
export function CateringMenuDishItemsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKind?: string } | undefined;
  const isMenuCategoryDishes = isPageCateringMenuExamples(documentId) && parent?.sectionKind === "menuCategory";
  const [adding, setAdding] = useState(false);

  if (!isMenuCategoryDishes) {
    return <CateringOfferItemsInput {...props} />;
  }

  function addDish() {
    setAdding(true);
    const itemKey = generateDishItemKey();
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey }], "after", [-1]));
    setAdding(false);
  }

  const dishMembers = props.members.filter((member) => {
    if (member.kind !== "item") return true; // never hide a real ArrayItemError — errors must always stay visible
    const value = member.item.value as { itemKey?: string } | undefined;
    return value?.itemKey !== RESERVED_ICON_ITEM_KEY;
  });

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      {props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions, members: dishMembers })}
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Text size={1} muted>
            Each dish becomes a card in this category&rsquo;s menu. Fill in a title, description and photo — icon and link
            fields are not used for dishes. / Кожна страва стає карткою в меню цієї категорії. Заповніть назву, опис і фото —
            поле іконки та посилання для страв не використовуються.
          </Text>
          <Box>
            <Button text="+ Add dish" tone="primary" disabled={adding} onClick={addDish} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
