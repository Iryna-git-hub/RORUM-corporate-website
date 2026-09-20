"use client";

import { useFormValue, type ObjectFieldProps } from "sanity";
import { Card, Text } from "@sanity/ui";

const LOCALE_NAMES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

/**
 * Wraps `title` — the very first localized field on the event form, right
 * after "Show on website languages" itself and the technical slug/image
 * fields — with a short, read-only reminder of which website languages this
 * specific event is currently shown in, sourced live from the document's
 * own `visibleLocales` field. Sits at the top of every localized field
 * below it (title, image alt, Event Overview, What to Expect, arrival,
 * ticket button/provider text, SEO), since every one of those fields is
 * wired to the same active-locale filtering (see EventLocaleAwareInput) and
 * shares this one explanation rather than repeating it per field.
 *
 * No new schema field/attribute: this renders alongside the existing
 * default input, it doesn't store anything of its own. Every other document
 * type's fields render completely unchanged — this component is only ever
 * wired onto this one event field.
 */
export function EventLocalizedFieldNotice(props: ObjectFieldProps) {
  const visibleLocales = useFormValue(["visibleLocales"]) as string[] | undefined;
  const names = Array.isArray(visibleLocales) ? visibleLocales.map((l) => LOCALE_NAMES[l] ?? l) : [];

  return (
    <>
      <Card tone="primary" padding={3} radius={2} marginBottom={3}>
        <Text size={1}>
          {names.length
            ? `This event is currently shown in: ${names.join(", ")}. Every translation field below (title, image alt text, overview, what to expect, arrival note, ticket text, SEO) only shows editors for these languages. Change "Show on website languages" above to reveal, hide, or add a language — nothing already written is ever deleted.`
            : `No website language is selected yet. Set "Show on website languages" above before filling in translations below.`}
        </Text>
      </Card>
      {props.renderDefault(props)}
    </>
  );
}
