"use client";

import { useMemo, useState } from "react";
import { set, unset, type StringInputProps } from "sanity";
import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { icons as lucideIcons, type LucideIcon } from "lucide-react";
import styled from "styled-components";

// Every named export of lucide-react's `icons` map, keyed by its exact
// PascalCase component name (e.g. "UtensilsCrossed") — the exact same string
// this project has always stored in contentItem.icon/iconCard.icon (see
// lib/iconCardIcons.ts, which resolves this same map on the frontend). No
// renaming/migration needed: this picker just replaces how an editor CHOOSES
// that string, not what's stored. `icons` is the package's own canonical,
// de-duplicated catalog (verified: every one of its ~1700 entries points to a
// distinct component — no aliases to collapse), not a hand-maintained
// allowlist, so a lucide-react upgrade grows/shrinks this list automatically.
const iconEntries = Object.entries(lucideIcons as Record<string, LucideIcon>).sort(([a], [b]) => a.localeCompare(b));
const TOTAL_ICON_COUNT = iconEntries.length;

// Initial page size AND load-more increment — not a hard cap. Rendering all
// ~1700 icons at once is slow and unnecessary; this keeps the DOM small by
// default while `loadMore` lets an editor keep growing the visible set until
// every match is available. Search itself always runs against the full
// `iconEntries` catalog above, never just the currently-visible slice.
const PAGE_SIZE = 90;

/**
 * "ArrowDownLeft" -> "Arrow Down Left", "CircleUserRound" -> "Circle User
 * Round". Purely presentational — the canonical PascalCase name (not this
 * label) is always what gets stored via `set()`. Exported so tests can
 * verify label generation directly instead of parsing rendered DOM text.
 */
export function humanizeIconName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .trim();
}

// The official Lucide icon library site — the one safe external link this
// picker offers, for the case a manager knows roughly what they want but
// can't find it by guessing a search term. Opens in a new tab; no custom
// in-app navigation is invented.
const LUCIDE_WEBSITE_URL = "https://lucide.dev/icons/";

// Sanity UI's Card has no built-in hover/selected/focus-visible treatment
// when used as a plain `as="button"` grid cell (that styling is normally
// reserved for Sanity's own interactive primitives like Button/MenuItem).
// These rules reuse the Studio theme's own CSS custom properties
// (--card-focus-ring-color) so they look correct in both light and dark
// Studio themes, with a safe static fallback.
const IconGridButton = styled(Card)`
  cursor: pointer;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    filter: brightness(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color, #2276fc);
    outline-offset: 2px;
  }

  &[data-selected="true"] {
    border-color: var(--card-focus-ring-color, #2276fc);
  }
`;

export function IconPickerInput(props: StringInputProps) {
  const { value, onChange, elementProps, schemaType } = props;
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filters the COMPLETE catalog (both the canonical and human-readable
  // name), never just the currently-rendered page — so "arrow down" finds
  // every Arrow Down icon regardless of alphabetical position.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconEntries;
    return iconEntries.filter(([name]) => name.toLowerCase().includes(q) || humanizeIconName(name).toLowerCase().includes(q));
  }, [query]);

  const visible = matches.slice(0, visibleCount);
  const hasMore = visibleCount < matches.length;

  function handleQueryChange(next: string) {
    setQuery(next);
    setVisibleCount(PAGE_SIZE); // a new search always starts from a fresh first page
  }

  function loadMore() {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, matches.length));
  }

  const SelectedIcon = value ? (lucideIcons as Record<string, LucideIcon>)[value] : undefined;
  // A stored value that doesn't match any current icon (e.g. renamed/removed
  // in a lucide-react upgrade) must never be silently swapped for something
  // else — surface it clearly instead so an editor/developer can decide.
  const isUnsupportedStoredValue = Boolean(value) && !SelectedIcon;

  function selectIcon(name: string) {
    onChange(set(name));
  }

  function clearIcon() {
    onChange(unset());
  }

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} border tone={isUnsupportedStoredValue ? "caution" : value ? "positive" : "default"}>
        <Flex align="center" gap={3}>
          <Flex align="center" justify="center" style={{ width: 32, height: 32, flexShrink: 0 }}>
            {SelectedIcon ? (
              <SelectedIcon size={24} strokeWidth={1.8} />
            ) : (
              <Text muted size={1}>
                —
              </Text>
            )}
          </Flex>
          <Box flex={1}>
            <Text size={1} weight="semibold">
              {value || "No icon selected"}
            </Text>
            {isUnsupportedStoredValue ? (
              <Box marginTop={2}>
                <Text size={1} muted>
                  This icon name isn&rsquo;t recognized by the currently installed icon set — it may have been renamed or removed.
                  It has NOT been changed automatically. Pick a new icon below, or check with a developer first if you want to keep
                  the stored value.
                </Text>
              </Box>
            ) : null}
          </Box>
          {value ? <Button mode="ghost" tone="critical" text="Clear" fontSize={1} padding={2} onClick={clearIcon} /> : null}
        </Flex>
      </Card>

      <Text size={1} muted>
        Search the Lucide icon library. If you cannot find an icon, find its name on the Lucide website and paste the name into
        the search field. / Пошук у бібліотеці іконок Lucide. Якщо ви не можете знайти потрібну іконку, знайдіть її назву на
        сайті Lucide та вставте цю назву в поле пошуку.{" "}
        <a href={LUCIDE_WEBSITE_URL} target="_blank" rel="noopener noreferrer">
          Browse the Lucide icon library ↗
        </a>
      </Text>

      <Flex gap={2} align="center">
        <Box flex={1}>
          <TextInput
            {...elementProps}
            value={query}
            placeholder={`Search ${schemaType.title?.toLowerCase() ?? "icon"}… (e.g. "flower", "chef", "arrow down")`}
            onChange={(event) => handleQueryChange(event.currentTarget.value)}
          />
        </Box>
        {query ? <Button mode="ghost" text="Clear search" fontSize={1} padding={2} onClick={() => handleQueryChange("")} /> : null}
      </Flex>

      <Card padding={2} radius={2} border style={{ maxHeight: 440, overflowY: "auto", overflowX: "hidden" }}>
        {visible.length === 0 ? (
          <Box padding={3}>
            <Text muted size={1}>
              No icons found for &ldquo;{query}&rdquo;.
            </Text>
          </Box>
        ) : (
          <Box data-testid="icon-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 6 }}>
            {visible.map(([name, Icon]) => {
              const isSelected = name === value;
              const label = humanizeIconName(name);
              return (
                <IconGridButton
                  as="button"
                  key={name}
                  type="button"
                  padding={2}
                  radius={2}
                  tone={isSelected ? "primary" : "default"}
                  shadow={isSelected ? 1 : 0}
                  data-selected={isSelected}
                  onClick={() => selectIcon(name)}
                  title={name}
                  aria-label={`${label} (${name})${isSelected ? ", selected" : ""}`}
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </IconGridButton>
              );
            })}
          </Box>
        )}
      </Card>

      {matches.length > 0 ? (
        <Flex align="center" justify="space-between" gap={2} wrap="wrap">
          <Text muted size={1}>
            {query ? `Showing ${visible.length} of ${matches.length} matching icons.` : `Showing ${visible.length} of ${TOTAL_ICON_COUNT} icons.`}
          </Text>
          {hasMore ? <Button mode="ghost" text="Load more" fontSize={1} padding={2} onClick={loadMore} /> : null}
        </Flex>
      ) : null}
    </Stack>
  );
}
