/**
 * Sets `copyEnabled: true` on the two Community Membership bank-detail rows
 * that WecodaDonationSection.tsx's own `defaultBankFields` fallback already
 * treats as copyable — "Account No." (bank4) and "IBAN" (bank6) — and
 * leaves every other bank row (Beneficiary, CVR, Bank, Account Type,
 * Reg. No., SWIFT/BIC, Currency) at the schema's `initialValue: false`.
 * This is the live-data half of fixing the "every row shows a Copy button,
 * even ones with no value / not meant to be copied" defect: page.tsx's
 * frontend fix (reading `copyEnabled` instead of hardcoding `copyable: true`)
 * is a separate, non-Sanity change.
 *
 * Confirmed live (raw perspective) via a one-off inspection query:
 *   bank4 | title(en): "Account No." | value: "14165789"
 *   bank6 | title(en): "IBAN"        | value: "DK96 3000 0014 1657 89"
 *
 * Usage:
 *   npm run sanity:migrate-cm-bank-copy:dry-run
 *   npm run sanity:migrate-cm-bank-copy -- --apply
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-community-membership", "drafts.page-community-membership"] as const;
const COPYABLE_ITEM_KEYS = new Set(["bank4", "bank6"]);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface ContentItem {
  _key: string;
  itemKey?: string;
  title?: I18nEntry[];
  copyEnabled?: boolean;
}
interface Section {
  _key: string;
  sectionKey?: string;
  items?: ContentItem[];
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
  const donation = doc.sections?.find((s) => s.sectionKey === "donation");
  if (!donation) {
    console.log(`${id}: no "donation" section found — nothing to do.`);
    return null;
  }

  const targets = (donation.items ?? []).filter((i) => i.itemKey && COPYABLE_ITEM_KEYS.has(i.itemKey) && i.copyEnabled !== true);
  console.log(`${id}: ${targets.length} bank row(s) need copyEnabled set to true`);
  for (const t of targets) {
    const enTitle = t.title?.find((e) => e.language === "en")?.value;
    console.log(`  + ${t.itemKey} (${JSON.stringify(enTitle)}) copyEnabled: ${t.copyEnabled ?? "unset"} -> true`);
  }
  return { doc, donation, targets };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== Community Membership bank-detail copyEnabled migration — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan || plan.targets.length === 0) continue;

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

    const patchSet: Record<string, boolean> = {};
    for (const t of plan.targets) {
      patchSet[`sections[_key=="${plan.donation._key}"].items[_key=="${t._key}"].copyEnabled`] = true;
    }
    await client.patch(id).ifRevisionId(fresh._rev).set(patchSet).commit();
    console.log(`  Applied ${plan.targets.length} update(s) to ${id}.`);
  }
}

main().catch((error) => {
  console.error("migrate-community-membership-bank-copy failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
