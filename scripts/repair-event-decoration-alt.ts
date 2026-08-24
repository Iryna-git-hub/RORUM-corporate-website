/**
 * Backfills DA/UK alt text for page-event-decoration's gallery photos and
 * the styling section's photo — the exact gap identified by a live manual
 * Studio Publish-blocker report: `drafts.page-event-decoration` couldn't be
 * published after adding a new, fully-valid gallery video, because 14
 * gallery photos + 1 styling photo only ever had English alt text (never
 * received the DA/UK backfill Catering's equivalent photos got). Proven
 * against the official `sanity documents validate` engine before writing
 * anything — see the session report for the exact command/output.
 *
 * Every English value below is copied verbatim from the live, already-
 * approved EN alt text (read-only audit; nothing invented). Danish and
 * Ukrainian are AI-provided translations of that exact English meaning —
 * disclosed, not yet reviewed by a native speaker, same precedent as every
 * other translation in this project (see MIGRATION_REPORT.md).
 *
 * Rules:
 *   - only ADDS a da/uk entry where one is entirely missing;
 *   - never touches an existing non-empty da/uk value (would abort loudly
 *     if one were found — see the "already has X" check below);
 *   - never touches the en value;
 *   - never touches any other field, item, section, or document;
 *   - revision-guarded (`ifRevisionId`) — re-fetches immediately before
 *     each write and aborts that item if the document changed underneath;
 *   - idempotent — a second run (dry or live) after a successful live run
 *     reports 0 planned changes.
 *
 * Two strategies, chosen with --scope (default "draft" — the recommended,
 * safer one):
 *   --scope=draft  (default) — patches ONLY drafts.page-event-decoration.
 *                   Published content is never touched by this script; the
 *                   manager reviews and publishes everything (the new video
 *                   AND these translations) together, through Studio's own
 *                   Publish action, at a moment of their choosing. This
 *                   matches the project's own established convention: every
 *                   other content correction in this project has gone
 *                   through a draft + Studio Publish step, never a direct
 *                   write to a published document.
 *   --scope=both   — ALSO patches page-event-decoration (the live,
 *                    currently-published document) with the same 15 DA/UK
 *                    backfills, immediately, independent of Studio Publish.
 *                    This makes published content match the draft's alt
 *                    text right away, but is a direct production write
 *                    that bypasses the manager's own Publish review for
 *                    that document — a real tradeoff, not a strictly
 *                    "better" option. Only use this if the manager
 *                    specifically wants the translations live before
 *                    they're ready to publish the rest of the draft
 *                    (e.g. the new video).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/repair-event-decoration-alt.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/repair-event-decoration-alt.ts --dry-run --scope=both
 *   npx tsx --env-file=.env.local scripts/repair-event-decoration-alt.ts
 */
import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const SCOPE_ARG = process.argv.find((a) => a.startsWith("--scope="))?.split("=")[1];
const SCOPE: "draft" | "both" = SCOPE_ARG === "both" ? "both" : "draft";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface Translation {
  key: string; // media _key
  sectionKey: string;
  en: string; // the existing, approved English value (verbatim, for cross-check only)
  da: string;
  uk: string;
}

// sections[gallery].media[*] — 14 photos.
const GALLERY_TRANSLATIONS: Translation[] = [
  { key: "img0", sectionKey: "gallery", en: "Balloon wall decoration for a RORUM event", da: "Ballonvægdekoration til et RORUM-arrangement", uk: "Декорація зі стіни з кульок для заходу RORUM" },
  { key: "img1", sectionKey: "gallery", en: "Dinner table styled under a garden pergola", da: "Middagsbord stylet under en havepergola", uk: "Обідній стіл, оформлений під садовою перголою" },
  { key: "img2", sectionKey: "gallery", en: "Long table styled with florals and place settings", da: "Langbord stylet med blomster og kuverter", uk: "Довгий стіл, оформлений квітами та сервіруванням" },
  { key: "img3", sectionKey: "gallery", en: "Modern dining table styled in natural daylight", da: "Moderne spisebord stylet i naturligt dagslys", uk: "Сучасний обідній стіл, оформлений при природному денному світлі" },
  { key: "img4", sectionKey: "gallery", en: "Close-up of balloon decor accents", da: "Nærbillede af ballondekorationer", uk: "Крупний план декоративних акцентів із кульок" },
  { key: "img5", sectionKey: "gallery", en: "Candlelit dinner table styled for an evening event", da: "Middagsbord med levende lys stylet til en aftenfest", uk: "Обідній стіл зі свічками, оформлений для вечірнього заходу" },
  { key: "img6", sectionKey: "gallery", en: "Cake table styled with decorative accents", da: "Kagebord stylet med dekorative detaljer", uk: "Стіл для торта, оформлений декоративними акцентами" },
  { key: "img7", sectionKey: "gallery", en: "Garden reception styled at dusk", da: "Havereception stylet i skumringen", uk: "Прийом у саду, оформлений у сутінках" },
  { key: "img8", sectionKey: "gallery", en: "Decorated table with flowers and place settings", da: "Dekoreret bord med blomster og kuverter", uk: "Прикрашений стіл із квітами та сервіруванням" },
  { key: "img9", sectionKey: "gallery", en: "Elegant banquet table styled in daylight", da: "Elegant bankettbord stylet i dagslys", uk: "Елегантний банкетний стіл, оформлений при денному світлі" },
  { key: "img10", sectionKey: "gallery", en: "Close-up of a styled table place setting", da: "Nærbillede af en stylet kuvert", uk: "Крупний план оформленого сервірування столу" },
  { key: "img11", sectionKey: "gallery", en: "Modern lounge area styled with floral accents", da: "Moderne loungeområde stylet med blomsteraccenter", uk: "Сучасна лаунж-зона, оформлена квітковими акцентами" },
  { key: "img12", sectionKey: "gallery", en: "Table styling with contrasting floral accents", da: "Bordstyling med kontrasterende blomsteraccenter", uk: "Оформлення столу з контрастними квітковими акцентами" },
  { key: "img13", sectionKey: "gallery", en: "Decorated entrance arch for an event", da: "Dekoreret indgangsbue til et arrangement", uk: "Прикрашена арка при вході для заходу" },
];

// sections[styling].media[*] — 1 photo (separate section; also blocks Publish).
const STYLING_TRANSLATIONS: Translation[] = [
  { key: "image", sectionKey: "styling", en: "Decorated entrance arch for an event", da: "Dekoreret indgangsbue til et arrangement", uk: "Прикрашена арка при вході для заходу" },
];

const ALL_TRANSLATIONS = [...GALLERY_TRANSLATIONS, ...STYLING_TRANSLATIONS];

const TARGET_DOC_IDS = ["page-event-decoration", "drafts.page-event-decoration"];
const DOCS_TO_PATCH = SCOPE === "both" ? TARGET_DOC_IDS : ["drafts.page-event-decoration"];

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}
interface RawMedia {
  _key: string;
  kind?: string;
  alt?: I18nEntry[];
}
interface RawSection {
  _key: string;
  sectionKey?: string;
  media?: RawMedia[];
}
interface RawDoc {
  _id: string;
  _rev: string;
  sections?: RawSection[];
}

function statusFor(doc: RawDoc | undefined, t: Translation): string {
  if (!doc) return "(document not found)";
  const section = doc.sections?.find((s) => s.sectionKey === t.sectionKey);
  const media = section?.media?.find((m) => m._key === t.key);
  if (!media) return "(item not found)";
  const alt = media.alt ?? [];
  const da = alt.find((e) => e.language === "da")?.value?.trim();
  const uk = alt.find((e) => e.language === "uk")?.value?.trim();
  if (da && uk) return "already complete (da+uk present)";
  if (da) return "missing uk only";
  if (uk) return "missing da only";
  return "missing both da and uk";
}

async function main() {
  console.log(`== Event Decoration alt-text backfill (${DRY_RUN ? "DRY RUN" : "LIVE"}, scope=${SCOPE}) ==\n`);

  const docs = await client.fetch<RawDoc[]>(`*[_id in $ids]`, { ids: TARGET_DOC_IDS });
  const publishedDoc = docs.find((d) => d._id === "page-event-decoration");
  const draftDoc = docs.find((d) => d._id === "drafts.page-event-decoration");

  // --- Human review table (Task 3): all 15 affected paths, English
  // source, proposed DA/UK, and each document's own current status.
  // Deduplicated by identical EN source text across published/draft for
  // readability — published and draft currently hold IDENTICAL English
  // alt text for all 15 items (confirmed below per-row anyway), so this is
  // one review row per item, not per item-per-document. The MUTATION plan
  // below this table remains fully path- and document-specific — dedup is
  // presentation only, never applied to what actually gets patched.
  console.log("== Review table (15 affected paths) ==\n");
  for (const t of ALL_TRANSLATIONS) {
    const publishedEn = publishedDoc?.sections?.find((s) => s.sectionKey === t.sectionKey)?.media?.find((m) => m._key === t.key)?.alt?.find((e) => e.language === "en")?.value?.trim();
    const draftEn = draftDoc?.sections?.find((s) => s.sectionKey === t.sectionKey)?.media?.find((m) => m._key === t.key)?.alt?.find((e) => e.language === "en")?.value?.trim();
    const enSourcesMatch = publishedEn === draftEn;
    console.log(`Path: sections[${t.sectionKey}].media[${t.key}].alt`);
    console.log(`  EN source${enSourcesMatch ? " (identical on published + draft)" : ""}: "${t.en}"`);
    if (!enSourcesMatch) {
      console.log(`    published EN: "${publishedEn ?? "(missing)"}"  |  draft EN: "${draftEn ?? "(missing)"}"`);
    }
    console.log(`  Proposed DA: "${t.da}"`);
    console.log(`  Proposed UK: "${t.uk}"`);
    console.log(`  Published document status: ${statusFor(publishedDoc, t)}`);
    console.log(`  Draft document status:     ${statusFor(draftDoc, t)}`);
    console.log("");
  }
  console.log(`== End review table ==\n`);

  console.log(
    SCOPE === "draft"
      ? "Scope: DRAFT ONLY. page-event-decoration (published) will NOT be patched — only drafts.page-event-decoration. Nothing here touches live content; the manager publishes everything (video + these translations) together via Studio.\n"
      : "Scope: BOTH. page-event-decoration (published, LIVE content) WILL be patched directly, immediately, independent of Studio Publish — plus drafts.page-event-decoration.\n",
  );

  let totalPlanned = 0;
  let totalSkippedAlreadyPresent = 0;
  let totalAborted = 0;

  for (const doc of docs.filter((d) => DOCS_TO_PATCH.includes(d._id))) {
    console.log(`-- ${doc._id} --`);
    const patches: { key: string; sectionKey: string; da?: string; uk?: string }[] = [];

    for (const t of ALL_TRANSLATIONS) {
      const section = doc.sections?.find((s) => s.sectionKey === t.sectionKey);
      const media = section?.media?.find((m) => m._key === t.key);
      if (!media) {
        console.log(`  [SKIP] sections[${t.sectionKey}].media[${t.key}] not found on this document`);
        continue;
      }
      const alt = media.alt ?? [];
      const en = alt.find((e) => e.language === "en")?.value?.trim();
      const da = alt.find((e) => e.language === "da")?.value?.trim();
      const uk = alt.find((e) => e.language === "uk")?.value?.trim();

      if (en !== t.en) {
        console.log(`  [ABORT] sections[${t.sectionKey}].media[${t.key}] — stored EN ("${en}") doesn't match the audited EN ("${t.en}") — data changed since diagnosis, skipping this item to avoid acting on stale assumptions`);
        totalAborted++;
        continue;
      }

      const patch: { key: string; sectionKey: string; da?: string; uk?: string } = { key: t.key, sectionKey: t.sectionKey };
      if (da) {
        console.log(`  [SKIP] sections[${t.sectionKey}].media[${t.key}].alt[da] already has a value ("${da}") — never overwritten`);
        totalSkippedAlreadyPresent++;
      } else {
        patch.da = t.da;
      }
      if (uk) {
        console.log(`  [SKIP] sections[${t.sectionKey}].media[${t.key}].alt[uk] already has a value ("${uk}") — never overwritten`);
        totalSkippedAlreadyPresent++;
      } else {
        patch.uk = t.uk;
      }
      if (patch.da || patch.uk) {
        patches.push(patch);
        console.log(`  [PLAN] sections[${t.sectionKey}].media[${t.key}].alt +=${patch.da ? ` da="${patch.da}"` : ""}${patch.uk ? ` uk="${patch.uk}"` : ""}`);
        totalPlanned += (patch.da ? 1 : 0) + (patch.uk ? 1 : 0);
      }
    }

    if (patches.length === 0) {
      console.log("  No pending changes for this document.\n");
      continue;
    }

    if (DRY_RUN) {
      console.log(`  (dry run — ${patches.length} media item(s) would be patched)\n`);
      continue;
    }

    // Re-fetch immediately before writing — abort this document's writes if
    // it changed underneath since the plan above was computed.
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: doc._id });
    if (!fresh || fresh._rev !== doc._rev) {
      console.log(`  [ABORT] ${doc._id} changed since this run started (_rev mismatch) — re-run to pick up the current state.\n`);
      continue;
    }

    // `insert(..., "after", path[-1])` targeting the array by _key (not
    // index) — immune to reordering between the read and the write, same
    // convention the official validator's own marker paths use
    // (`sections[_key=="gallery"].media[_key=="img0"].alt`).
    //
    // One `client.patch(id)` mutation object holds exactly ONE `insert`
    // operation internally — chaining `.insert()` multiple times on the
    // SAME Patch builder (as an earlier version of this script did)
    // silently REPLACES the previous insert instead of accumulating them,
    // so only the last item in the loop would actually get written. Fixed
    // by using `client.transaction()` with one separate `.patch(id, ...)`
    // mutation PER item — still one atomic, single-revision-guarded
    // transaction (all share the same `ifRevisionId`), but each item's
    // insert is now its own mutation object.
    let tx = client.transaction();
    for (const p of patches) {
      const altPath = `sections[_key=="${doc.sections!.find((s) => s.sectionKey === p.sectionKey)!._key}"].media[_key=="${p.key}"].alt`;
      const toInsert: I18nEntry[] = [];
      if (p.da) toInsert.push({ _key: randomUUID().replace(/-/g, "").slice(0, 32), _type: "internationalizedArrayStringValue", language: "da", value: p.da });
      if (p.uk) toInsert.push({ _key: randomUUID().replace(/-/g, "").slice(0, 32), _type: "internationalizedArrayStringValue", language: "uk", value: p.uk });
      tx = tx.patch(doc._id, (patch) => patch.ifRevisionId(fresh._rev).insert("after", `${altPath}[-1]`, toInsert));
    }
    await tx.commit();
    console.log(`  Applied ${patches.length} media item patch(es) to ${doc._id}.\n`);
  }

  console.log(`== Summary ==`);
  console.log(`  Planned/applied language entries: ${totalPlanned}`);
  console.log(`  Already-present values skipped (never overwritten): ${totalSkippedAlreadyPresent}`);
  console.log(`  Aborted (stale EN mismatch): ${totalAborted}`);
}

main().catch((error) => {
  console.error("repair-event-decoration-alt failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
