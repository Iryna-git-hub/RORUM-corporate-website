/**
 * Backfills missing Danish/Ukrainian alt text for Host at RORUM's 14 gallery
 * photos + 1 "Each Session Includes" photo — live audit (raw perspective)
 * found all 15 had EN-only alt on both published and draft, with zero
 * malformed/empty entries (a genuine completeness gap, not residue to
 * clean up). English source text is read live from Sanity (never
 * hardcoded here) and printed for review; only DA/UK are added — the
 * existing approved English value is never touched.
 *
 * Translations are accurate, literal descriptions of each photo's visible
 * content (matching this project's own established alt-text convention —
 * see the Event Decoration/Catering gallery backfills this mirrors) — no
 * invented facts, no SEO keywords not visible in the image.
 *
 * Usage:
 *   npm run sanity:backfill-host-gallery-alt:dry-run
 *   npm run sanity:backfill-host-gallery-alt -- --apply
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-host-at-rorum", "drafts.page-host-at-rorum"] as const;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// Keyed by the EXACT English source text (read live below, matched against
// this table) so a mismatch between what's live and what this script
// expects is caught loudly rather than silently mistranslating the wrong
// photo.
const TRANSLATIONS: Record<string, { da: string; uk: string }> = {
  "RORUM private meeting room set up for a session": {
    da: "RORUM mødelokale klargjort til en session",
    uk: "Приватна переговорна кімната RORUM, підготовлена для сесії",
  },
  "People gathered in a RORUM private meeting session": {
    da: "Mennesker samlet til en privat mødesession hos RORUM",
    uk: "Люди зібралися на приватній зустрічі в RORUM",
  },
  "RORUM private meeting room ready for guests": {
    da: "RORUM mødelokale klar til gæster",
    uk: "Приватна переговорна кімната RORUM, готова для гостей",
  },
  "RORUM private meeting room with tables and chairs arranged": {
    da: "RORUM mødelokale med borde og stole opstillet",
    uk: "Приватна переговорна кімната RORUM зі столами та стільцями",
  },
  "Small group meeting in the RORUM private meeting room": {
    da: "Møde for en lille gruppe i RORUM's private mødelokale",
    uk: "Зустріч невеликої групи у приватній переговорній кімнаті RORUM",
  },
  "RORUM private meeting room set up for a workshop": {
    da: "RORUM mødelokale klargjort til en workshop",
    uk: "Приватна переговорна кімната RORUM, підготовлена для воркшопу",
  },
  "RORUM private meeting room with a calm, organized setup": {
    da: "RORUM mødelokale med en rolig, velorganiseret opsætning",
    uk: "Приватна переговорна кімната RORUM зі спокійним, організованим облаштуванням",
  },
  "RORUM private meeting room prepared for hosting": {
    da: "RORUM mødelokale forberedt til at være vært",
    uk: "Приватна переговорна кімната RORUM, підготовлена для проведення заходу",
  },
  "Guests gathered for a private meeting at RORUM": {
    da: "Gæster samlet til et privat møde hos RORUM",
    uk: "Гості зібралися на приватну зустріч у RORUM",
  },
  "RORUM private meeting room with flexible seating": {
    da: "RORUM mødelokale med fleksible siddepladser",
    uk: "Приватна переговорна кімната RORUM з гнучким розсадженням",
  },
  "RORUM private meeting room with natural light": {
    da: "RORUM mødelokale med naturligt lys",
    uk: "Приватна переговорна кімната RORUM з природним освітленням",
  },
  "RORUM private meeting room ready for a gathering": {
    da: "RORUM mødelokale klar til en sammenkomst",
    uk: "Приватна переговорна кімната RORUM, готова для зібрання",
  },
  "RORUM private meeting room set up for hosting": {
    da: "RORUM mødelokale klargjort til at være vært",
    uk: "Приватна переговорна кімната RORUM, підготовлена для проведення заходу",
  },
  "Hosted meeting room setup at RORUM": {
    da: "Opsætning af mødelokale hos RORUM",
    uk: "Облаштування переговорної кімнати в RORUM",
  },
};

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}
interface MediaItem {
  _key: string;
  kind?: string;
  alt?: I18nEntry[];
}
interface Section {
  _key: string;
  sectionKey?: string;
  media?: MediaItem[];
}
interface PageDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

async function planFor(id: string) {
  const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }

  const mutations: { path: string; language: "da" | "uk"; value: string; photoKey: string }[] = [];
  for (const section of doc.sections ?? []) {
    for (const media of section.media ?? []) {
      const en = media.alt?.find((e) => e.language === "en")?.value?.trim();
      if (!en) continue;
      const translation = TRANSLATIONS[en];
      if (!translation) {
        console.log(`  UNMAPPED: ${section.sectionKey}/${media._key} — EN = ${JSON.stringify(en)} (no translation in this script's table — skipped, not touched)`);
        continue;
      }
      for (const language of ["da", "uk"] as const) {
        const already = media.alt?.find((e) => e.language === language)?.value?.trim();
        if (already) continue; // preserve any existing valid translation, never overwrite
        mutations.push({
          path: `sections[_key=="${section._key}"].media[_key=="${media._key}"].alt`,
          language,
          value: translation[language],
          photoKey: `${section.sectionKey}/${media._key}`,
        });
      }
    }
  }

  console.log(`${id}: ${mutations.length} missing DA/UK alt entries to add`);
  for (const m of mutations) console.log(`  + ${m.photoKey} [${m.language}] = ${JSON.stringify(m.value)}`);
  return { doc, mutations };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== Host at RORUM gallery/session alt DA/UK backfill — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan || plan.mutations.length === 0) continue;

    if (!APPLY) {
      console.log(`  Dry run only for ${id} — no writes performed. Requires explicit authorization before --apply.`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== plan.doc._rev) {
      console.error(`ABORTED for ${id}: changed concurrently since the plan was computed — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    // One mutation per array insert — chaining multiple .insert() calls on
    // one Sanity Patch object silently keeps only the last (see this
    // project's own established fix, e.g. scripts/backfill-seo-copy.ts) —
    // use a transaction with one .patch() per insert instead.
    const tx = client.transaction();
    for (const m of plan.mutations) {
      tx.patch(id, (p) =>
        p.ifRevisionId(fresh._rev).insert("after", `${m.path}[-1]`, [{ _key: m.language, _type: "internationalizedArrayStringValue", language: m.language, value: m.value }]),
      );
    }
    await tx.commit();
    console.log(`  Applied ${plan.mutations.length} insert(s) to ${id}.`);
  }
}

main().catch((error) => {
  console.error("backfill-host-gallery-alt failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
