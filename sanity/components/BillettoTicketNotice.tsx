"use client";

import { useFormValue, type StringFieldProps } from "sanity";
import { Card, Text } from "@sanity/ui";
import { isBillettoEventUrl } from "@/lib/billettoUrl";

/**
 * Wraps the `billettoEventUrl` field. When the pasted URL is a recognised
 * Billetto event link, it shows a short confirmation that ticket
 * availability is now automatic — so the manager knows not to touch the
 * "Tickets left" / "Sold out" fields below (which the schema also hides
 * while a valid link is present).
 *
 * No stored data of its own — renders alongside the default string input.
 */
export function BillettoTicketNotice(props: StringFieldProps) {
  const value = useFormValue(props.path) as string | undefined;
  const connected = isBillettoEventUrl(value);

  return (
    <>
      {props.renderDefault(props)}
      {connected ? (
        <Card tone="positive" padding={3} radius={2} marginTop={3}>
          <Text size={1}>
            Ticket availability is managed automatically by Billetto. The
            &ldquo;Tickets left&rdquo; and &ldquo;Sold out&rdquo; fields are
            hidden while this link is connected — the website reads the live
            number from Billetto and uses this link as the &ldquo;Buy
            ticket&rdquo; button. / Наявність квитків керується автоматично
            через Billetto.
          </Text>
        </Card>
      ) : null}
    </>
  );
}
