/**
 * Copies the already-approved Danish/Ukrainian labels from the
 * `application` section's "apply" action ("Bliv medlem" / "Стати учасницею")
 * onto the `hero` section's own "apply" action, which shares the identical
 * href (https://forms.gle/MpadaPTyL8YCHtAa9) and English label
 * ("Become a Member") but is currently EN-only — confirmed live via a raw-
 * perspective read. No new translation is invented; the value written is
 * byte-identical to the value already approved and live on `application`'s
 * own apply action.
 *
 * Usage:
 *   npm run sanity:migrate-cm-hero-apply-label:dry-run
 *   npm run sanity:migrate-cm-hero-apply-label -- --apply
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
interface ActionItem {
  _key: string;
  actionKey?: string;
  label?: I18nEntry[];
}
interface Section {
  _key: string;
  sectionKey?: string;
  actions?: ActionItem[];
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
  const hero = doc.sections?.find((s) => s.sectionKey === "hero");
  const application = doc.sections?.find((s) => s.sectionKey === "application");
  const heroApply = hero?.actions?.find((a) => a.actionKey === "apply");
  const applicationApply = application?.actions?.find((a) => a.actionKey === "apply");
  if (!hero || !heroApply) {
    console.log(`${id}: no hero "apply" action found — nothing to do.`);
    return null;
  }
  if (!applicationApply) {
    console.log(`${id}: no application "apply" action found to copy from — nothing to do.`);
    return null;
  }

  const missing = ["da", "uk"].filter((lang) => !heroApply.label?.find((e) => e.language === lang)?.value?.trim());
  if (missing.length === 0) {
    console.log(`${id}: hero "apply" action already has da/uk labels — nothing to do.`);
    return null;
  }

  const toInsert = missing.map((language) => {
    const source = applicationApply.label!.find((e) => e.language === language)!;
    return { _key: language, _type: "internationalizedArrayStringValue", language, value: source.value };
  });
  console.log(`${id}: hero "apply" action missing labels for: ${missing.join(", ")}`);
  for (const entry of toInsert) console.log(`  + [${entry.language}] = ${JSON.stringify(entry.value)}`);

  return { doc, hero, heroApply, toInsert };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== Community Membership hero "apply" action DA/UK label copy — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan) continue;

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

    await client
      .patch(id)
      .ifRevisionId(fresh._rev)
      .insert("after", `sections[_key=="${plan.hero._key}"].actions[_key=="${plan.heroApply._key}"].label[-1]`, plan.toInsert)
      .commit();
    console.log(`  Applied ${plan.toInsert.length} insert(s) to ${id}.`);
  }
}

main().catch((error) => {
  console.error("migrate-community-membership-hero-apply-label failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
