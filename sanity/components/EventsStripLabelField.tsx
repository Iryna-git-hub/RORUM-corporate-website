"use client";

import { useFormValue, type ObjectFieldProps } from "sanity";
import { Card, Text } from "@sanity/ui";

/**
 * Wraps pageSection's `label` field to add one extra, read-only line of
 * context — but only when this exact section is Home's `eventsStrip`. No
 * new schema field/attribute path: this renders alongside the existing
 * `label` input, it doesn't store anything of its own. Every other
 * section's `label` field renders completely unchanged (just the default
 * input, same as before this component existed).
 */
export function EventsStripLabelField(props: ObjectFieldProps) {
  // `props.path` is the absolute path to this "label" field, e.g.
  // ["sections", {_key: "..."}, "label"] — drop the last segment to read
  // the enclosing pageSection object itself (sectionKey/sectionKind/etc.).
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isEventsStrip = parent?.sectionKey === "eventsStrip";

  return (
    <>
      {isEventsStrip ? (
        <Card tone="primary" padding={3} radius={2} marginBottom={3}>
          <Text size={1}>
            Event cards shown here are managed in the separate Events section. This section controls only the heading and the
            &quot;View all events&quot; button.
          </Text>
        </Card>
      ) : null}
      {props.renderDefault(props)}
    </>
  );
}
