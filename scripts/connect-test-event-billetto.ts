/**
 * Part 36 (2026-09-10) — connect ONE Sanity test event to the Billetto
 * integration test event (id 1994849).
 *
 * Target: `event-ddc618d18d7c` ("Floral mood workshop", slug
 * floral-mood-workshop). The owner had already pasted the Billetto share URL
 * into its `ticketUrl` field; this moves that value into the new
 * `billettoEventUrl` field and clears `ticketUrl` (the Billetto link is now
 * the buy-ticket destination too — Phase 6). No other event is touched.
 * `ticketsLeft` / `isSoldOut` are left as-is (both empty/false already) — the
 * schema hides them for a connected event and the frontend ignores them.
 *
 * Full document backup + `ifRevisionId` guard. Published + draft if present.
 *
 * Usage:
 *   npm run sanity:connect-test-event-billetto:dry-run
 *   npm run sanity:connect-test-event-billetto -- --apply
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;
const TARGET_ID = "event-ddc618d18d7c";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface EventDoc {
  _id: string;
  _rev: string;
  ticketUrl?: string;
  billettoEventUrl?: string;
  "slug"?: { current?: string };
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  for (const id of [TARGET_ID, `drafts.${TARGET_ID}`]) {
    const doc = await client.fetch<EventDoc | null>(`*[_id == $id][0]`, { id });
    if (!doc) { console.log(`\n${id}: not present — skipping.`); continue; }
    console.log(`\n=== ${id} (${doc.slug?.current ?? "?"}, rev ${doc._rev}) ===`);
    console.log(`  ticketUrl        : ${doc.ticketUrl ?? "(unset)"}`);
    console.log(`  billettoEventUrl : ${doc.billettoEventUrl ?? "(unset)"}`);

    if (doc.billettoEventUrl?.includes("billetto")) {
      console.log("  already connected — nothing to do.");
      continue;
    }
    const url = doc.ticketUrl;
    if (!url || !url.includes("billetto.dk/e/")) {
      console.log("  ticketUrl is not a Billetto event link — SKIPPING (nothing safe to move).");
      continue;
    }
    console.log(`  -> billettoEventUrl = ${url}`);
    console.log(`  -> ticketUrl unset`);
    if (!APPLY) continue;

    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, `connect-test-event-billetto-${id.replace(/[^a-z0-9-]/gi, "_")}-${ts}.json`), JSON.stringify(doc, null, 2));

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== doc._rev) { console.error(`  ABORT ${id}: changed concurrently.`); process.exitCode = 1; continue; }
    await client.patch(id).ifRevisionId(fresh._rev).set({ billettoEventUrl: url }).unset(["ticketUrl"]).commit();
    console.log("  applied.");
  }
  console.log("\nDone. Re-run `npm run sanity:audit-validation`.");
}

main().catch((e) => { console.error("connect-test-event-billetto failed:", e instanceof Error ? e.message : e); process.exit(1); });
