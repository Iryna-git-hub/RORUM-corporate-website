"use client";

import { useState } from "react";
import { insert, useFormValue, type ArrayOfObjectsInputProps, type ArraySchemaType } from "sanity";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";

// Every new offering bullet gets this icon by default — a neutral starting
// point the manager immediately sees and can change via the Lucide picker
// (contentItem.ts's ITEM_ROLE_RULES shows only icon/title/text for this role).
const DEFAULT_OFFER_ICON = "Sparkles";

// Same supported Sanity mechanism CateringMenuSectionsInput.tsx already uses
// for Catering Menu Examples categories — ArrayOptions.disableActions, not
// CSS. "add"/"addBefore"/"addAfter" remove the generic array-add control so
// the ONLY way to create a new bullet is this component's own "+ Add
// offering category" button below, which always assigns a real, frontend-
// readable itemKey (app/[locale]/(site)/catering/page.tsx's getData() only
// picks up philosophy items whose itemKey starts with "format" — a
// manager-added item with no itemKey, unlike a menu-category dish, would
// otherwise save fine but silently never render). "duplicate" is disabled
// too since it would copy the source item's itemKey verbatim, producing two
// bullets with the same key. "remove" and reordering (drag) stay enabled.
const DISABLED_ARRAY_ACTIONS = ["add", "addBefore", "addAfter", "duplicate", "copy"] as const;

// Random, not "lowest unused index off props.value" — the same reasoning as
// CateringMenuSectionsInput's generateSectionKey: `props.value` can be
// stale (Studio hasn't re-rendered with the previous insert's result yet)
// between two clicks in the same session, so deriving the next key from it
// risks a genuine duplicate itemKey/duplicate array _key. A 32-bit random
// suffix makes collision negligible without depending on prop freshness.
// Digits-only so it always matches contentItem.ts's `/^(format\d*)?$/`
// role pattern.
function generateFormatItemKey(): string {
  const random = typeof crypto !== "undefined" && "getRandomValues" in crypto ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967295);
  return `format${random}`;
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY for
 * the "What We Offer" section (sectionKey "philosophy") on page-catering.
 * `items` is a single field shared by every section of every page, so
 * (unlike CateringMenuSectionsInput, which scopes by document id alone,
 * since `page.sections` is document-level) this needs to resolve the
 * *enclosing section's* sectionKey too — done the same way
 * EventsStripLabelField.tsx does it: `props.path` is the absolute path to
 * this items field (e.g. ["sections", {_key:"..."}, "items"]); dropping the
 * last segment and reading it via useFormValue gives the section object
 * itself.
 *
 * Every other items array (every other section of page-catering, and every
 * section of every other page) renders with the unmodified default input.
 *
 * The "+ Add offering category" button inserts a complete, valid bullet in
 * one step — a generated, stable, unique `itemKey` (format<random>) and a
 * default icon, neither of which a non-technical manager should ever need
 * to type in. `itemKey` is hidden once contentItem.ts's
 * ITEM_ROLE_RULES role-matches this item (any format0../blank key already
 * matches — see that file), so opening a bullet added this way never
 * surfaces the technical key field.
 *
 * Renaming a bullet is just editing its title/text — itemKey stays
 * untouched, so a rename or a drag-reorder can never change the stable
 * identifier the frontend looks the bullet up by.
 */
export function CateringOfferItemsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const isPageCatering = documentId?.replace(/^drafts\./, "") === "page-catering";
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isWhatWeOfferSection = isPageCatering && parent?.sectionKey === "philosophy";
  const [adding, setAdding] = useState(false);

  if (!isWhatWeOfferSection) {
    return props.renderDefault(props);
  }

  function addOffering() {
    setAdding(true);
    const itemKey = generateFormatItemKey();
    props.onChange(insert([{ _key: itemKey, _type: "contentItem", itemKey, icon: DEFAULT_OFFER_ICON }], "after", [-1]));
    setAdding(false);
  }

  const schemaTypeWithDisabledActions: ArraySchemaType = {
    ...props.schemaType,
    options: { ...props.schemaType.options, disableActions: [...DISABLED_ARRAY_ACTIONS] },
  };

  return (
    <Stack space={4}>
      <Text size={1} weight="semibold">
        Offering categories
      </Text>
      <Text size={1} muted>
        Each card below is one &ldquo;What We Offer&rdquo; bullet on the Catering page. / Кожна картка нижче — це один пункт
        розділу &ldquo;Що ми пропонуємо&rdquo; на сторінці кейтерингу.
      </Text>
      {props.renderDefault({ ...props, schemaType: schemaTypeWithDisabledActions })}
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Text size={1} muted>
            Adds a new offering card at the end of the list. / Додає нову картку пропозиції в кінець списку.
          </Text>
          <Box>
            <Button text="+ Add offering category" tone="primary" disabled={adding} onClick={addOffering} />
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
