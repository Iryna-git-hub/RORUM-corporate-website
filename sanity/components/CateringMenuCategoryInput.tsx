"use client";

import { set, unset, useFormValue, type ObjectInputProps, type StringInputProps } from "sanity";
import { Box, Card, Stack, Text } from "@sanity/ui";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";

const RESERVED_ICON_ITEM_KEY = "categoryIcon";

function isPageCateringMenuExamples(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-catering-menu-examples";
}

interface ReservedIconItem {
  _key: string;
  itemKey?: string;
  icon?: string;
}

/**
 * Replaces the default object input for `pageSection` — but ONLY for a
 * `menuCategory`-kind section on `page-catering-menu-examples`. Every other
 * section, on every other document, renders exactly as before via
 * `props.renderDefault(props)`.
 *
 * Required manager-facing field order for a menu category: Icon, Label,
 * Title, Text, Dishes. The schema's own field order is already Label,
 * Title, Text, Items (sectionKey/sectionKind are hidden for a correctly-
 * shaped category — see pageSection.ts), so this only needs to prepend one
 * Icon control above the unmodified default render of everything else —
 * it does not reorder or duplicate label/title/text/items itself.
 *
 * Canonical storage is preserved exactly: the icon still lives at
 * `items[itemKey=="categoryIcon"].icon` (the same reserved contentItem
 * CateringMenuSectionsInput.tsx's "+ Add category" already creates) — this
 * component is a presentation-only reordering, not a new schema attribute
 * or a second source of truth. Selecting an icon here reuses the exact same
 * `IconPickerInput` used everywhere else in Studio, patching only that one
 * nested `icon` value by `_key` (`set`/`unset` on
 * `["items", {_key: "categoryIcon"}, "icon"]`) — it never touches the
 * item's own `_key`/`itemKey`, so rename/reorder of the category itself has
 * no way to disturb it. `CateringMenuDishItemsInput` (wired on the `items`
 * field itself) is what keeps this reserved item out of the rendered
 * Dishes list — this component does not need to filter it too.
 */
export function CateringMenuCategoryInput(props: ObjectInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const value = props.value as { sectionKind?: string; items?: ReservedIconItem[] } | undefined;
  const isMenuCategory = isPageCateringMenuExamples(documentId) && value?.sectionKind === "menuCategory";

  if (!isMenuCategory) {
    return props.renderDefault(props);
  }

  const iconItem = value?.items?.find((item) => item.itemKey === RESERVED_ICON_ITEM_KEY);
  const iconPath = ["items", { _key: RESERVED_ICON_ITEM_KEY }, "icon"];

  function handleIconChange(patch: ReturnType<typeof set> | ReturnType<typeof unset>) {
    if (patch.type === "set") {
      props.onChange(set(patch.value, iconPath));
    } else if (patch.type === "unset") {
      props.onChange(unset(iconPath));
    }
  }

  const iconInputProps = {
    value: iconItem?.icon,
    onChange: handleIconChange,
    elementProps: {},
    schemaType: { title: "Icon" },
  } as unknown as StringInputProps;

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border>
        <Stack space={3}>
          <Text size={1} weight="semibold">
            Icon
          </Text>
          <Text size={1} muted>
            Shown in this category&rsquo;s navigation tab. / Показується на вкладці навігації цієї категорії.
          </Text>
          {iconItem ? (
            <IconPickerInput {...iconInputProps} />
          ) : (
            <Box>
              <Text size={1} muted>
                Icon item not found — this category may need to be recreated via &ldquo;+ Add category&rdquo;.
              </Text>
            </Box>
          )}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
