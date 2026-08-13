"use client";

import { useMemo, useState } from "react";
import { set, unset, type StringInputProps } from "sanity";
import { Box, Button, Card, Flex, Grid, Stack, Text, TextInput } from "@sanity/ui";
import { icons as lucideIcons, type LucideIcon } from "lucide-react";

// Every named export of `lucide-react` keyed by its PascalCase component
// name (e.g. "UtensilsCrossed") — the exact same string this project has
// always stored in `iconCard.icon` (see lib/iconCardIcons.ts, which reads
// this same map on the frontend). No renaming/migration needed: this picker
// just replaces how an editor CHOOSES that string, not what's stored.
const iconEntries = Object.entries(lucideIcons as Record<string, LucideIcon>).sort(([a], [b]) =>
  a.localeCompare(b),
);

// Rendering all ~1700 icons at once is slow and not useful — an editor is
// always searching for something specific. Cap the grid and let the search
// query narrow it down instead of paginating.
const MAX_RESULTS = 90;

export function IconPickerInput(props: StringInputProps) {
  const { value, onChange, elementProps, schemaType } = props;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? iconEntries.filter(([name]) => name.toLowerCase().includes(q)) : iconEntries;
    return matches.slice(0, MAX_RESULTS);
  }, [query]);

  const SelectedIcon = value ? lucideIcons[value as keyof typeof lucideIcons] : undefined;

  function selectIcon(name: string) {
    onChange(set(name));
  }

  function clearIcon() {
    onChange(unset());
  }

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} border tone={value ? "positive" : "default"}>
        <Flex align="center" gap={3}>
          <Flex align="center" justify="center" style={{ width: 32, height: 32, flexShrink: 0 }}>
            {SelectedIcon ? <SelectedIcon size={24} strokeWidth={1.8} /> : <Text muted size={1}>—</Text>}
          </Flex>
          <Box flex={1}>
            <Text size={1} weight="semibold">
              {value || "No icon selected"}
            </Text>
          </Box>
          {value ? (
            <Button mode="ghost" tone="critical" text="Clear" fontSize={1} padding={2} onClick={clearIcon} />
          ) : null}
        </Flex>
      </Card>

      <TextInput
        {...elementProps}
        value={query}
        placeholder={`Search ${schemaType.title?.toLowerCase() ?? "icon"}… (e.g. "flower", "chef")`}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      <Card padding={2} radius={2} border style={{ maxHeight: 320, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <Box padding={3}>
            <Text muted size={1}>
              No icons match “{query}”.
            </Text>
          </Box>
        ) : (
          <Grid columns={[4, 5, 6]} gap={2}>
            {filtered.map(([name, Icon]) => {
              const isSelected = name === value;
              return (
                <Card
                  as="button"
                  key={name}
                  type="button"
                  padding={3}
                  radius={2}
                  tone={isSelected ? "primary" : "default"}
                  shadow={isSelected ? 1 : 0}
                  onClick={() => selectIcon(name)}
                  title={name}
                  style={{ cursor: "pointer", border: "none" }}
                >
                  <Flex direction="column" align="center" gap={2}>
                    <Icon size={20} strokeWidth={1.8} />
                    <Text size={0} muted style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {name}
                    </Text>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        )}
      </Card>
      {filtered.length === MAX_RESULTS ? (
        <Text muted size={1}>
          Showing first {MAX_RESULTS} matches — refine your search for more specific results.
        </Text>
      ) : null}
    </Stack>
  );
}
