/**
 * Migrates Community Membership's hero section's two intro paragraphs —
 * currently stored as two generic contentItem rows, itemKey "intro0"/
 * "intro1" (each with real, non-empty text — confirmed live, NOT unused
 * residue), each holding one paragraph in `.text` — into the section's own
 * real `text` field, joined per language with a real blank-paragraph
 * separator (`\n\n`), preserving the approved copy exactly. Mirrors
 * scripts/migrate-event-decoration-styling-text.ts's own proven pattern.
 * Every language present on EITHER intro0 or intro1 is included. Published
 * and draft are migrated independently; never invokes Publish.
 *
 * Usage:
 *   npm run sanity:migrate-cm-hero-text:dry-run
 *   npm run sanity:migrate-cm-hero-text -- --apply
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

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}
interface ContentItem {
  _key: string;
  itemKey?: string;
  text?: I18nEntry[];
}
interface Section {
  _key: string;
  sectionKey?: string;
  items?: ContentItem[];
  text?: I18nEntry[];
}
interface PageDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

function joinParagraphs(intro0: I18nEntry[] | undefined, intro1: I18nEntry[] | undefined): I18nEntry[] {
  const languages = new Set<string>();
  for (const e of intro0 ?? []) if (e.language && e.value?.trim()) languages.add(e.language);
  for (const e of intro1 ?? []) if (e.language && e.value?.trim()) languages.add(e.language);

  return Array.from(languages).map((language) => {
    const v0 = intro0?.find((e) => e.language === language)?.value?.trim();
    const v1 = intro1?.find((e) => e.language === language)?.value?.trim();
    const joined = [v0, v1].filter(Boolean).join("\n\n");
    return { _key: language, _type: "internationalizedArrayTextValue", language, value: joined };
  });
}

async function planFor(id: string) {
  const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const hero = doc.sections?.find((s) => s.sectionKey === "hero");
  if (!hero) {
    console.log(`${id}: no "hero" section found — nothing to do.`);
    return null;
  }
  const intro0 = hero.items?.find((i) => i.itemKey === "intro0");
  const intro1 = hero.items?.find((i) => i.itemKey === "intro1");
  if (!intro0 && !intro1) {
    console.log(`${id}: no intro0/intro1 items found — already migrated or never present.`);
    return null;
  }

  const joined = joinParagraphs(intro0?.text, intro1?.text);
  console.log(`${id}: hero section _key = ${hero._key}`);
  console.log(`  intro0.text = ${JSON.stringify(intro0?.text ?? null)}`);
  console.log(`  intro1.text = ${JSON.stringify(intro1?.text ?? null)}`);
  console.log(`  computed hero.text (joined with \\n\\n) = ${JSON.stringify(joined)}`);
  console.log(`  current hero.text (before) = ${JSON.stringify(hero.text ?? null)}`);

  const alreadyMigrated =
    hero.text &&
    joined.every((entry) => hero.text!.find((e) => e.language === entry.language)?.value === entry.value) &&
    joined.length === (hero.text?.length ?? 0);
  if (alreadyMigrated && !intro0 && !intro1) return null;

  return { doc, hero, joined, needsTextSet: !alreadyMigrated, needsItemsUnset: Boolean(intro0 || intro1) };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== Community Membership hero.text migration — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan) continue;
    console.log(`  -> would set hero.text to the computed joined value: ${plan.needsTextSet}`);
    console.log(`  -> would unset hero.items[itemKey in ["intro0","intro1"]]: ${plan.needsItemsUnset}`);

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

    let patch = client.patch(id).ifRevisionId(fresh._rev);
    if (plan.needsTextSet) {
      patch = patch.set({ [`sections[_key=="${plan.hero._key}"].text`]: plan.joined });
    }
    if (plan.needsItemsUnset) {
      patch = patch.unset([
        `sections[_key=="${plan.hero._key}"].items[itemKey=="intro0"]`,
        `sections[_key=="${plan.hero._key}"].items[itemKey=="intro1"]`,
      ]);
    }
    await patch.commit();
    console.log(`  Applied to ${id}.`);
  }
}

main().catch((error) => {
  console.error("migrate-community-membership-hero-text failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
