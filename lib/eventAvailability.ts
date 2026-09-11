import { getBillettoEventAvailability } from "@/lib/billetto";
import { parseBillettoEventId } from "@/lib/billettoUrl";
import type { RorumEvent } from "@/lib/data";

// The ONE place "how many tickets are left for this event, and is it sold
// out" is decided, for every surface (Home strip, Events listing, Event
// detail). UI components never call Billetto or branch on the source —
// they read `spotsLeft` / `isSoldOut` off the resolved `RorumEvent`.
//
//   - Billetto-connected event (`billettoEventUrl` set) + a successful
//     Billetto fetch  →  live number, sold out iff available === 0.
//   - Billetto-connected event + a FAILED fetch (Billetto down / rate
//     limited / bad URL / no credentials)  →  NO availability shown
//     (spotsLeft undefined, isSoldOut false) so the site never states a
//     false "0 spots left" / "Sold out". The Buy-ticket CTA stays.
//   - Non-connected (legacy) event  →  the manager's own Sanity
//     `ticketsLeft` / `isSoldOut`, unchanged (returned by reference).

/**
 * Resolve availability for a batch of events, calling the Billetto API at
 * most ONCE per distinct connected event id (deduped) and in parallel.
 * Returns new `RorumEvent` objects with `spotsLeft` / `ticketsLeft` /
 * `isSoldOut` / `ticketUrl` reflecting the resolved source. Non-connected
 * events are returned unchanged.
 */
export async function applyBillettoAvailability(events: RorumEvent[]): Promise<RorumEvent[]> {
  const idByUrl = new Map<string, string | null>();
  for (const event of events) {
    if (event.billettoEventUrl && !idByUrl.has(event.billettoEventUrl)) {
      idByUrl.set(event.billettoEventUrl, parseBillettoEventId(event.billettoEventUrl));
    }
  }

  const distinctIds = [...new Set([...idByUrl.values()].filter((id): id is string => id !== null))];
  if (distinctIds.length === 0) return events;

  const resultById = new Map<string, Awaited<ReturnType<typeof getBillettoEventAvailability>>>();
  await Promise.all(
    distinctIds.map(async (id) => {
      resultById.set(id, await getBillettoEventAvailability(id));
    }),
  );

  return events.map((event) => {
    const url = event.billettoEventUrl;
    if (!url) return event;

    // Phase 6: the Billetto page is the buy-ticket destination when the
    // event has no separate purchase URL.
    const ticketUrl = event.ticketUrl || url;

    const id = idByUrl.get(url) ?? null;
    const result = id ? resultById.get(id) : undefined;

    if (result && result.ok && typeof result.available === "number") {
      const available = result.available;
      return {
        ...event,
        ticketUrl,
        spotsLeft: available,
        ticketsLeft: available,
        isSoldOut: available === 0,
      };
    }

    // Connected but Billetto couldn't tell us — show no availability, keep the CTA.
    return { ...event, ticketUrl, spotsLeft: undefined, ticketsLeft: undefined, isSoldOut: false };
  });
}

/** Single-event convenience wrapper (Event detail page). */
export async function applyBillettoAvailabilityToEvent(event: RorumEvent): Promise<RorumEvent> {
  const [resolved] = await applyBillettoAvailability([event]);
  return resolved ?? event;
}
