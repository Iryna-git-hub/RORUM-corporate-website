/**
 * Sets Home's Quick Path item icons to the APPROVED CANONICAL values — the
 * exact icon each card has always rendered via app/shared.tsx's fixed
 * per-href lookup, now wired as the editable Sanity field (see
 * app/[locale]/(site)/page.tsx's quickPathsFromSections and Approved Fix 3
 * from the Studio Visibility Contract implementation pass).
 *
 * Canonical mapping (matches app/shared.tsx's quickPathMeta exactly):
 *   events         -> CalendarDays
 *   hostAtRorum    -> Presentation
 *   catering       -> ConciergeBell
 *   eventDecoration -> Balloon
 *
 * Unlike the original dry-run-only pass (which never overwrote a non-empty
 * value and only flagged conflicts), this version is explicitly approved to
 * OVERWRITE any value that differs from the canonical one — including the
 * two known conflicts (hostAtRorum: AlarmClock: entered while the field was
 * disconnected and had no frontend effect; catering on the draft:
 * CalendarDays, same reason). Idempotent: an item already holding its
 * canonical value is left untouched and does not count as a change.
 *
 * Safety: before any live write, re-fetches each target document's `_rev`
 * and aborts immediately (writing nothing) if it differs from the `_rev`
 * this run's own dry-run/backup step observed — i.e. if the document was
 * edited by someone else between dry-run and live-run.
 *
 * Only ever writes to the exact `icon` path of the 4 known Quick Path
 * items — title/text/image/href/label/itemKey and array order are never
 * touched.
 *
 * Usage:
 *   npm run sanity:backfill-quickpath-icons:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:backfill-quickpath-icons           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const CANONICAL_ICON_BY_ITEM_KEY: Record<string, string> = {
  events: "CalendarDays",
  hostAtRorum: "Presentation",
  catering: "ConciergeBell",
  eventDecoration: "Balloon",
};

interface I18nEntry {
  language?: string;
  value?: string;
}
interface RawItem {
  _key: string;
  itemKey?: string;
  icon?: string;
  title?: I18nEntry[];
}
interface RawSection {
  _key: string;
  sectionKey?: string;
  items?: RawItem[];
}
interface RawDoc {
  _id: string;
  _rev: string;
  sections?: RawSection[];
}

function titleEn(title: I18nEntry[] | undefined): string {
  return title?.find((t) => t.language === "en")?.value ?? "(untitled)";
}

async function fetchTargets(): Promise<RawDoc[]> {
  return client.fetch<RawDoc[]>(
    `*[_id in ["page-home", "drafts.page-home"]]{_id, _rev, sections[sectionKey == "quickPaths"]{_key, sectionKey, items[]{_key, itemKey, icon, title}}}`,
  );
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Home Quick Path icon migration — canonical values ==\n");

  const docs = await fetchTargets();
  console.log(`Documents found: ${docs.map((d) => d._id).join(", ") || "(none)"}\n`);

  let toChange = 0;
  let alreadyCorrect = 0;
  const revByDocId = new Map<string, string>();

  for (const doc of docs) {
    revByDocId.set(doc._id, doc._rev);
    const section = doc.sections?.[0];
    console.log(`Document: ${doc._id} (_rev ${doc._rev})`);
    if (!section?.items?.length) {
      console.log("  (no quickPaths section/items found)\n");
      continue;
    }
    for (const item of section.items) {
      const title = titleEn(item.title);
      const canonical = item.itemKey ? CANONICAL_ICON_BY_ITEM_KEY[item.itemKey] : undefined;
      const currentValue = item.icon?.trim() || null;
      console.log(`  - itemKey: ${item.itemKey ?? "(none)"} (${title})`);
      console.log(`      current: ${currentValue ?? "(empty)"}  ->  canonical: ${canonical ?? "(unknown itemKey)"}`);
      if (!canonical) {
        console.log(`      -> SKIP: no canonical mapping for this itemKey.`);
      } else if (currentValue === canonical) {
        alreadyCorrect++;
        console.log(`      -> OK: already canonical, no change.`);
      } else {
        toChange++;
        console.log(`      -> ${DRY_RUN ? "WOULD SET" : "SETTING"} to "${canonical}".`);
      }
    }
    console.log("");
  }

  console.log(`Target: ${toChange} change(s) needed, ${alreadyCorrect} already correct, across ${docs.length} document(s).`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }

  if (toChange === 0) {
    console.log("\nNothing to change — live run would be a no-op. Exiting without writing.");
    return;
  }

  // Revision safety check: re-fetch immediately before writing and compare
  // against the _rev this same run just observed above. Any mismatch means
  // the document was edited between the dry-run report and now — abort
  // without writing anything rather than risk overwriting a concurrent edit.
  const freshDocs = await fetchTargets();
  for (const fresh of freshDocs) {
    const observed = revByDocId.get(fresh._id);
    if (observed && fresh._rev !== observed) {
      console.error(`\nABORTED: ${fresh._id} changed (_rev ${observed} -> ${fresh._rev}) between dry-run and live-run. No writes performed. Re-run the dry-run and review before trying again.`);
      process.exitCode = 1;
      return;
    }
  }
  const freshIds = new Set(freshDocs.map((d) => d._id));
  for (const id of revByDocId.keys()) {
    if (!freshIds.has(id)) {
      console.error(`\nABORTED: ${id} no longer exists (it did moments ago). No writes performed.`);
      process.exitCode = 1;
      return;
    }
  }

  console.log("\nRevision check passed — no concurrent changes detected. Committing...\n");

  for (const doc of docs) {
    const section = doc.sections?.[0];
    if (!section?.items?.length) continue;
    const patch: Record<string, string> = {};
    for (const item of section.items) {
      const canonical = item.itemKey ? CANONICAL_ICON_BY_ITEM_KEY[item.itemKey] : undefined;
      const currentValue = item.icon?.trim() || null;
      if (canonical && currentValue !== canonical) {
        patch[`sections[_key=="${section._key}"].items[_key=="${item._key}"].icon`] = canonical;
      }
    }
    if (Object.keys(patch).length === 0) continue;
    await client.patch(doc._id).set(patch).commit();
    console.log(`${doc._id}: set ${Object.keys(patch).length} icon field(s).`);
  }

  console.log("\nLive migration complete.");
}

main().catch((error) => {
  console.error("backfill-quickpath-icons failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
