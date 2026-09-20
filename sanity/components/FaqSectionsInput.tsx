"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";

// Same supported Sanity mechanism used by every other custom array input in
// this project — ArrayOptions.disableActions, not CSS. The generic add path
// would create a blank pageSection with no sectionKey/sectionKind at all,
// which pageSection.ts's own validation would then correctly (but
// confusingly, for a non-technical manager) block on — "+ Add FAQ category"
// below is the sole intended creation path, always producing a correctly-
// keyed, correctly-kinded category immediately.
const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

function isPageFaq(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-faq";
}

// Full crypto.randomUUID() (128 bits, not truncated) — collision-safe by
// construction, per the task's explicit "generate, don't assume uniqueness
// from a small random value" requirement. Falls back to a timestamp+random
// string only in an environment without Web Crypto (never true in Studio's
// own browser runtime, but keeps this from throwing if ever server-rendered).
function generateFaqCategorySectionKey(): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  return `group-${suffix}`;
}

/**
 * Replaces the default array input for `page.sections` — but ONLY on
 * `page-faq` (chained from CateringMenuSectionsInput.tsx, which is the
 * field's actual `components.input` — `sections` can only ever have one).
 * Every other page keeps the unmodified default editor.
 *
 * Sanity's array widget can't cleanly render two independently-scrollable/
 * reorderable sub-lists bound to one underlying array (splitting `members`
 * by index, the way CateringMenuDishItemsInput filters OUT one reserved
 * item, would still leave both "halves" sharing one continuous drag-reorder
 * space — reordering a category into slot 0 would silently swap it with
 * Hero). Rather than reimplement drag-and-drop, this renders the array as a
 * single native list with a label above it — the FAQ intro (Hero) is
 * already always first in stored order (nothing here re-orders it), and
 * every category below is native-reorderable.
 *
 * Two things make "+ Add FAQ category" the only manager-facing FAQ-category
 * creation path:
 *   1. `disableActions` removes the generic array add/duplicate/copy
 *      controls (native reorder/remove stay enabled).
 *   2. "+ Add FAQ category" inserts a minimal, correctly-shaped, EMPTY
 *      category in one step — a generated collision-safe `sectionKey`,
 *      `sectionKind: "faqCategory"`, and an empty `items` array. No title is
 *      pre-populated (RoleAwareAllLanguagesInput shows all 3 empty
 *      language rows the instant the manager opens Title, with nothing
 *      pre-written to the document until they actually type).
 */
export function FaqSectionsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const [adding, setAdding] = useState(false);

  if (!isPageFaq(documentId)) {
    return props.renderDefault(props);
  }

  function addCategory() {
    setAdding(true);
    const sectionKey = generateFaqCategorySectionKey();
    props.onChange(
      insert(
        [{ _key: sectionKey, _type: "pageSection", sectionKey, sectionKind: "faqCategory", items: [] }],
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
        Frequently Asked Questions
      </Text>
      <Text size={1} muted>
        The first card is the page intro (shown at the top of /faq). Every card below it is one FAQ category — drag to
        reorder, open a category to edit its questions.
      </Text>
      {props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions })}
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Text size={1} muted>
            Adds a new, empty FAQ category card at the end of the list — give it a title, then use its own &ldquo;+ Add
            question&rdquo; button.
          </Text>
          <Box>
            <Button text="+ Add FAQ category" tone="primary" disabled={adding} onClick={addCategory} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
