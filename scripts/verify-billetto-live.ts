/**
 * Part 36 — LIVE Billetto integration check (Phase 18). Opt-in, run by hand.
 *
 *   1. Start the site locally:  npm run build && npx next start -p 3000
 *      (or `npm run dev`) — the server must have BILLETTO_* in .env.local.
 *   2. In another terminal:     npm run billetto:verify-live
 *
 * It calls the Billetto API directly for the integration test event
 * (id 1994849), then scrapes the same number off the rendered
 * /events/floral-mood-workshop page, and reports both with a timestamp
 * (Billetto takes ~2 min to propagate a capacity change, and the site caches
 * for ~90s, so a brief mismatch right after an edit is expected).
 *
 * Credentials are read from the environment and never printed.
 */
const SITE = process.env.BILLETTO_VERIFY_SITE ?? "http://localhost:3000";
const SLUG = process.env.BILLETTO_VERIFY_SLUG ?? "floral-mood-workshop";
const EVENT_ID = process.env.BILLETTO_VERIFY_EVENT_ID ?? "1994849";

async function billettoNumber(): Promise<string> {
  const id = process.env.BILLETTO_API_KEY_ID;
  const secret = process.env.BILLETTO_ACCESS_KEY_SECRET;
  if (!id || !secret) return "(no credentials in env)";
  try {
    const r = await fetch(`https://billetto.dk/api/v3/organiser/events/${EVENT_ID}`, {
      headers: { "Api-Keypair": `${id}:${secret}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return `(HTTP ${r.status})`;
    const body = (await r.json()) as { availability?: { available?: unknown; status?: unknown } };
    return `available=${String(body.availability?.available)} status=${String(body.availability?.status)}`;
  } catch (e) {
    return `(error: ${e instanceof Error ? e.name : "unknown"})`;
  }
}

async function siteNumber(locale: string): Promise<string> {
  const path = locale === "en" ? `/events/${SLUG}` : `/${locale}/events/${SLUG}`;
  try {
    const r = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return `(HTTP ${r.status})`;
    const html = await r.text();
    const m =
      html.match(/(\d+)\s+(spots? left|plads(?:er)? tilbage|місц[ье] залишилось)/i) ??
      html.match(/(sold ?out|udsolgt|розпродано)/i);
    return m ? m[0] : "(no availability shown)";
  } catch (e) {
    return `(error: ${e instanceof Error ? e.name : "unknown"})`;
  }
}

(async () => {
  console.log(`Billetto live verification — ${new Date().toISOString()}`);
  console.log(`  event id           : ${EVENT_ID}   slug: ${SLUG}   site: ${SITE}`);
  console.log(`  Billetto API says  : ${await billettoNumber()}`);
  for (const locale of ["en", "da", "uk"]) {
    console.log(`  site (/${locale.padEnd(2)}) shows  : ${await siteNumber(locale)}`);
  }
  console.log("\nNote: Billetto propagates capacity changes in ~2 min; the site re-polls every ~90s.");
})();
