"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";
import { ContactDetailsOrderInput } from "@/sanity/components/ContactDetailsOrderInput";

// Same supported Sanity mechanism as every other custom array input here —
// ArrayOptions.disableActions, not CSS. The generic add control would create
// a blank contentItem with every generic field (icon/image/value) visible
// until an itemKey/role happens to match — "+ Add question" below is the
// sole intended creation path, always producing an item that immediately
// matches contentItem.ts's "FAQ question" role.
const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

function generateQuestionItemKey(): string {
  const random = typeof crypto !== "undefined" && "getRandomValues" in crypto ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967295);
  return `q${random}`;
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY when
 * the enclosing section is a `faqCategory` (chained from
 * CateringOfferItemsInput.tsx, which is `items`'s actual `components.input`
 * once CateringMenuDishItemsInput has already ruled out a menu category's
 * Dishes — `items` can only ever have one `components.input`). Every other
 * `items` array delegates to `props.renderDefault` unchanged.
 *
 * "+ Add question" inserts a minimal, correctly-shaped question in one
 * step — a random, stable `_key`/`itemKey` matching contentItem.ts's
 * "FAQ question" role pattern (`/^(q\d*)?$/`), with Question/Answer/link
 * left entirely unset (RoleAwareAllLanguagesInput shows all 3 empty
 * language rows the instant the manager opens Question/Answer).
 */
export function FaqQuestionItemsInput(props: ArrayOfObjectsInputProps) {
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKind?: string } | undefined;
  const isFaqCategoryQuestions = parent?.sectionKind === "faqCategory";
  const [adding, setAdding] = useState(false);

  if (!isFaqCategoryQuestions) {
    // Chained (not both wired independently) — see this file's own doc
    // comment for why `items` can only have one components.input.
    // ContactDetailsOrderInput itself delegates to props.renderDefault for
    // every non-Contact-hero items array, so every other section's items
    // are unaffected.
    return <ContactDetailsOrderInput {...props} />;
  }

  function addQuestion() {
    setAdding(true);
    const itemKey = generateQuestionItemKey();
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey }], "after", [-1]));
    setAdding(false);
  }

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      <Text size={1} weight="semibold">
        Questions
      </Text>
      {props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions })}
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Text size={1} muted>
            Adds a new question at the end of this category.
          </Text>
          <Box>
            <Button text="+ Add question" tone="primary" disabled={adding} onClick={addQuestion} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
