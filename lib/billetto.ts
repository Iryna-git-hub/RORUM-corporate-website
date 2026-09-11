import "server-only";

// Server-only Billetto integration. The API key pair
// (BILLETTO_API_KEY_ID / BILLETTO_ACCESS_KEY_SECRET) is read from the
// server environment here and NEVER leaves this module: not the return
// value, not a log line, not an error message. Callers get a narrow
// normalized result, never the raw Billetto response.
//
// One key pair for the whole organisation — configured once in the
// deployment environment, never per event, never touched by the manager.
//
// Billetto asks integrators to cache and minimise calls; the per-event
// endpoint is cached via Next's fetch cache (`revalidate` below), so many
// EventCards for the same event dedupe to one request and each connected
// event is polled at most once per revalidation window.

const BILLETTO_API_BASE = "https://billetto.dk/api/v3";

// ~90s: inside Billetto's recommended 60–120s window, and well above the
// "a couple of minutes" Billetto itself takes to propagate a capacity
// change — sub-minute polling would gain nothing.
const AVAILABILITY_REVALIDATE_SECONDS = 90;

const REQUEST_TIMEOUT_MS = 5000;

export type BillettoAvailability =
  | {
      ok: true;
      /** Remaining tickets. `null` when Billetto returned a non-numeric/absent value. */
      available: number | null;
      /** Billetto's own coarse label ("high" / "low" / …). Informational only — the number is authoritative. */
      status: string | null;
    }
  | {
      ok: false;
      reason:
        | "no-credentials"
        | "not-found"
        | "unauthorized"
        | "rate-limited"
        | "server-error"
        | "network"
        | "malformed";
    };

let warnedMissingCredentials = false;

function credentials(): { id: string; secret: string } | null {
  const id = process.env.BILLETTO_API_KEY_ID;
  const secret = process.env.BILLETTO_ACCESS_KEY_SECRET;
  if (!id || !secret) {
    if (!warnedMissingCredentials) {
      warnedMissingCredentials = true;
      // Safe diagnostic — names only, never values.
      console.warn(
        "[billetto] BILLETTO_API_KEY_ID / BILLETTO_ACCESS_KEY_SECRET not set — " +
          "Billetto-connected events will show NO ticket-availability figure (the buy-ticket " +
          "link still works). Expected in environments without the integration configured.",
      );
    }
    return null;
  }
  return { id, secret };
}

interface BillettoEventResponse {
  availability?: { available?: unknown; status?: unknown } | null;
}

/**
 * Live (Next-cached) ticket availability for one Billetto event id.
 *
 * Never throws — every failure mode maps to `{ ok: false, reason }`, so a
 * page rendering a connected event still renders when Billetto is down,
 * rate-limiting, or unconfigured. The caller decides what to show; this
 * function only reports what it could (not) learn.
 */
export async function getBillettoEventAvailability(eventId: string): Promise<BillettoAvailability> {
  const creds = credentials();
  if (!creds) return { ok: false, reason: "no-credentials" };

  let response: Response;
  try {
    response = await fetch(`${BILLETTO_API_BASE}/organiser/events/${encodeURIComponent(eventId)}`, {
      headers: {
        // Built here, server-side only. Do not log this value.
        "Api-Keypair": `${creds.id}:${creds.secret}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: {
        // Time-based refresh today. The per-event `tag` is here so a future
        // Billetto webhook route could `revalidateTag("billetto-event-<id>")`
        // for instant updates — nothing invalidates it by tag yet.
        revalidate: AVAILABILITY_REVALIDATE_SECONDS,
        tags: [`billetto-event-${eventId}`],
      },
    });
  } catch (error) {
    // AbortError (timeout) or a real network error. Message is generic —
    // never includes the header.
    console.warn(`[billetto] event ${eventId}: request failed (${error instanceof Error ? error.name : "network"})`);
    return { ok: false, reason: "network" };
  }

  if (response.status === 401 || response.status === 403) return { ok: false, reason: "unauthorized" };
  if (response.status === 404) return { ok: false, reason: "not-found" };
  if (response.status === 429) {
    console.warn(`[billetto] event ${eventId}: rate limited (429) — backing off until the cache window expires`);
    return { ok: false, reason: "rate-limited" };
  }
  if (response.status >= 500) return { ok: false, reason: "server-error" };
  if (!response.ok) return { ok: false, reason: "server-error" };

  let body: BillettoEventResponse;
  try {
    body = (await response.json()) as BillettoEventResponse;
  } catch {
    console.warn(`[billetto] event ${eventId}: response was not valid JSON`);
    return { ok: false, reason: "malformed" };
  }

  const availability = body?.availability;
  if (!availability || typeof availability !== "object") {
    // 200 but no availability block — treat as "couldn't learn it", not "0".
    return { ok: false, reason: "malformed" };
  }

  const rawAvailable = (availability as { available?: unknown }).available;
  const available =
    typeof rawAvailable === "number" && Number.isFinite(rawAvailable) ? Math.max(0, Math.trunc(rawAvailable)) : null;
  const rawStatus = (availability as { status?: unknown }).status;
  const status = typeof rawStatus === "string" ? rawStatus : null;

  return { ok: true, available, status };
}
