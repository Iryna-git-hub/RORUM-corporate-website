/**
 * Seeds page-contact's form section with the 4 reserved "field-*" Contact
 * form field rows (Name/Phone/Email/Message, in that order) — see
 * contentItem.ts's "Contact form field" role and
 * lib/sanityContact.ts's resolveContactFormFields(). Labels/placeholders
 * are copied verbatim from the ALREADY-APPROVED `formMessages` singleton
 * (fullNameLabel/phoneLabel/emailLabel/messageLabel/
 * contactFormMessagePlaceholder) — no new translations are invented — and
 * the phone/email placeholders reuse the exact literal strings
 * ContactForm.tsx already hardcoded before this migration
 * ("+45 12 34 56 78" / "you@example.com").
 *
 * Only runs if the form section has ZERO field-* rows yet. Stable itemKeys
 * (field-name/field-phone/field-email/field-message) match the exact HTML
 * input names ContactForm.tsx already used, so this migration doesn't
 * change what a submitted FormData looks like.
 *
 * Usage:
 *   npm run sanity:migrate-contact-form-fields:dry-run
 *   npm run sanity:migrate-contact-form-fields
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

interface I18nEntry {
  _key: string;
  _type?: string;
  language?: string;
  value?: string;
}
interface Section {
  _key: string;
  sectionKey?: string;
  items?: { _key?: string; itemKey?: string }[];
}
interface ContactDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}
interface FormMessagesDoc {
  fullNameLabel?: I18nEntry[];
  phoneLabel?: I18nEntry[];
  emailLabel?: I18nEntry[];
  messageLabel?: I18nEntry[];
  contactFormMessagePlaceholder?: I18nEntry[];
}

const DOC_IDS = ["page-contact", "drafts.page-contact"];
const LOCALES = ["en", "da", "uk"] as const;

function titleEntries(entries: I18nEntry[] | undefined, typeName: string): I18nEntry[] {
  return LOCALES.filter((l) => entries?.some((e) => e.language === l && e.value)).map((l) => ({
    _key: l,
    _type: typeName,
    language: l,
    value: entries!.find((e) => e.language === l)!.value,
  })) as I18nEntry[];
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("== Contact form field seed (Task 7) — plan ==");

  const messages = await client.fetch<FormMessagesDoc | null>(`*[_type == "formMessages"][0]`);
  if (!messages) {
    console.error("formMessages document not found — cannot seed labels. Aborting.");
    process.exitCode = 1;
    return;
  }

  // Phone/email get NO seeded placeholder — the original hardcoded UI only
  // ever showed an English-only format example ("+45 12 34 56 78" /
  // "you@example.com"), which isn't real translatable copy, and
  // contentItem.text's allOrNothingLanguages-style validation correctly
  // requires either all 3 languages or none (an EN-only value blocks
  // Publish — this was caught and fixed live after this script's first
  // run; see MIGRATION_REPORT.md). Placeholder is optional for this role,
  // so leaving it unset is a fully valid, non-broken state.
  const fields: { name: string; type: string; title: I18nEntry[]; text: I18nEntry[] }[] = [
    { name: "name", type: "text", title: titleEntries(messages.fullNameLabel, "internationalizedArrayStringValue"), text: titleEntries(messages.fullNameLabel, "internationalizedArrayTextValue") },
    { name: "phone", type: "phone", title: titleEntries(messages.phoneLabel, "internationalizedArrayStringValue"), text: [] },
    { name: "email", type: "email", title: titleEntries(messages.emailLabel, "internationalizedArrayStringValue"), text: [] },
    { name: "message", type: "multiline", title: titleEntries(messages.messageLabel, "internationalizedArrayStringValue"), text: titleEntries(messages.contactFormMessagePlaceholder, "internationalizedArrayTextValue") },
  ];

  console.log("\nProposed rows:");
  for (const f of fields) {
    console.log(`  field-${f.name} (${f.type}): label EN="${f.title.find((e) => e.language === "en")?.value ?? "(missing)"}"`);
  }

  for (const id of DOC_IDS) {
    const doc = await client.fetch<ContactDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
    if (!doc) {
      console.log(`\n${id}: document not found — skipped.`);
      continue;
    }
    const form = doc.sections?.find((s) => s.sectionKey === "form");
    if (!form) {
      console.log(`\n${id}: no form section found — skipped (unexpected shape, needs manual review).`);
      continue;
    }
    const existing = (form.items ?? []).filter((i) => i.itemKey?.startsWith("field-"));
    console.log(`\n${id}: form section "${form._key}" — ${existing.length} field-* row(s) already present.`);
    if (existing.length > 0) {
      console.log("  Already has form-field rows — left untouched.");
      continue;
    }

    if (DRY_RUN) {
      console.log(`  Would insert ${fields.length} row(s).`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== doc._rev) {
      console.error(`  ABORTED (${id}): changed concurrently — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    const toInsert = fields.map((f) => ({ _key: `field-${f.name}`, _type: "contentItem" as const, itemKey: `field-${f.name}`, value: f.type, title: f.title, text: f.text }));
    await client
      .patch(id)
      .ifRevisionId(fresh._rev)
      .insert("after", `sections[_key=="${form._key}"].items[-1]`, toInsert)
      .commit();
    console.log("  Applied.");
  }

  console.log(DRY_RUN ? "\nDry run only — no writes performed." : "\nLive migration complete.");
}

main().catch((error) => {
  console.error("migrate-contact-form-fields failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
