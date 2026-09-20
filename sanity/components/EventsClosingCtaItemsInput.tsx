"use client";

import { useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { IntentLink } from "sanity/router";
import { Button, Card, Stack, Text } from "@sanity/ui";

function isPageEvents(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-events";
}

/**
 * Replaces the default array input for `pageSection.items` — but ONLY on
 * page-events' own "closingCta" section (chained onto EventsFiltersInput,
 * which is `items`'s actual `components.input` once every earlier link has
 * already ruled itself out — see pageSection.ts's own comment on why
 * `items` can only have one `components.input`).
 *
 * Live audit (Events Listing Studio task, Section 12): this section stores
 * 2 reserved items (`faqQuestion`/`faqLabel`, matching the shared "Closing
 * CTA FAQ prompt row" role Home/About also use) — but
 * `app/[locale]/(site)/events/page.tsx` never reads them. The public "Have
 * questions?" prompt on the Events listing is built entirely from the
 * shared `formMessages.faqQuestion`/`.faqLabel` singleton
 * (`data.faqQuestion = messages.faqQuestion`, not from this section's own
 * items). Presenting `faqQuestion`/`faqLabel` here as a live, editable
 * override — the way Contact's own FAQ-prompt-override workflow genuinely
 * works — would be exactly the "fake editable field the frontend ignores"
 * the task explicitly warns against. Instead of hiding or deleting this
 * stored (harmless, inert) data, this shows a read-only explanation and an
 * IntentLink to the actual live source.
 */
export function EventsClosingCtaItemsInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const parentPath = props.path.slice(0, -1);
  const parent = useFormValue(parentPath) as { sectionKey?: string } | undefined;
  const isEventsClosingCta = isPageEvents(documentId) && parent?.sectionKey === "closingCta";

  if (!isEventsClosingCta) {
    return props.renderDefault(props);
  }

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Have questions? prompt
        </Text>
        <Text size={1} muted>
          This prompt&rsquo;s question and link text come from Shared form messages, not from this page — edit them
          there. / Текст цього запитання та посилання береться зі спільних повідомлень форми (Shared form messages), а
          не з цієї сторінки — редагуйте його там.
        </Text>
        <Button as={IntentLink} intent="edit" params={{ id: "formMessages", type: "formMessages" }} text="Edit shared form messages" tone="primary" mode="ghost" />
      </Stack>
    </Card>
  );
}
