/**
 * Backfills missing Danish/Ukrainian alt text for Community Membership's 8
 * gallery photos/videos + 1 donation QR code image — live audit (raw
 * perspective) found all 9 had EN-only alt on both published and draft,
 * with zero malformed/empty entries (a genuine completeness gap, not
 * residue). English source text is read live from Sanity (never hardcoded
 * here) and matched against a translation table; only DA/UK are added —
 * the existing approved English value is never touched.
 *
 * Same convention as scripts/backfill-host-gallery-alt.ts: accurate,
 * literal descriptions of each photo/video's visible content, no invented
 * facts, no SEO keywords not visible in the media.
 *
 * Usage:
 *   npm run sanity:backfill-cm-alt:dry-run
 *   npm run sanity:backfill-cm-alt -- --apply
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-community-membership", "drafts.page-community-membership"] as const;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const TRANSLATIONS: Record<string, { da: string; uk: string }> = {
  "WECODA members celebrating in the garden by a green and white balloon arch": {
    da: "WECODA-medlemmer fejrer i haven ved en grøn og hvid ballonbue",
    uk: "Учасниці WECODA святкують у саду біля зелено-білої арки з кульок",
  },
  "Muted video from the WECODA membership gathering": {
    da: "Video uden lyd fra WECODA-medlemsarrangementet",
    uk: "Відео без звуку із зустрічі учасниць WECODA",
  },
  "WECODA members smiling around a garden table": {
    da: "WECODA-medlemmer smiler rundt om et havebord",
    uk: "Учасниці WECODA посміхаються за садовим столом",
  },
  "Catering table prepared for a WECODA member gathering": {
    da: "Cateringbord klargjort til et WECODA-medlemsarrangement",
    uk: "Кейтеринговий стіл, підготовлений для зустрічі учасниць WECODA",
  },
  "Muted video of members gathering outdoors": {
    da: "Video uden lyd af medlemmer, der samles udendørs",
    uk: "Відео без звуку зустрічі учасниць на відкритому повітрі",
  },
  "WECODA members seated at a long outdoor table": {
    da: "WECODA-medlemmer siddende ved et langt udendørs bord",
    uk: "Учасниці WECODA сидять за довгим столом просто неба",
  },
  "Group portrait of WECODA members in the garden": {
    da: "Gruppebillede af WECODA-medlemmer i haven",
    uk: "Групове фото учасниць WECODA в саду",
  },
  "Two WECODA members smiling at the gathering": {
    da: "To WECODA-medlemmer smiler til arrangementet",
    uk: "Дві учасниці WECODA посміхаються на зустрічі",
  },
  "QR code for supporting WECODA": {
    da: "QR-kode til at støtte WECODA",
    uk: "QR-код для підтримки WECODA",
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
    if (section.sectionKey !== "gallery" && section.sectionKey !== "donation") continue;
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
        if (already) continue;
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
  console.log(`== Community Membership gallery/QR alt DA/UK backfill — plan ==`);

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
  console.error("backfill-community-membership-alt failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
