/**
 * Transforms the `page-work-with-us` document's `cvUploadForm` section from
 * the retired CV-upload form's content into the new fully text-based
 * application form's content (see components/WorkWithUsApplicationForm.tsx).
 * The section's own technical key ("cvUploadForm") is left unchanged — it is
 * never shown to editors — to avoid a separate, riskier section-key
 * migration; only its ITEMS change.
 *
 * What this does, in one atomic operation per document:
 *  1. REPURPOSES 6 existing items whose text was CV-specific, replacing all
 *     three locales with new application-framed copy: modalTitle,
 *     modalTitleSent, description, errorMessage, hero's "cvUploadCta" CTA
 *     button item, and hero's "hero1" paragraph (explicitly mentioned
 *     "send us your CV"). `descriptionSent` is left untouched — its existing
 *     text was never CV-specific.
 *  2. REMOVES 2 items that only ever made sense for a file-upload flow:
 *     `dropzoneText`, `messagePlaceholder`.
 *  3. ADDS 15 new items the new form needs: `roleInterestLabel`, 8 role
 *     checkbox options (`role0`..`role7`), `experienceLabel`,
 *     `experiencePlaceholder`, `whyRorumLabel`, `whyRorumPlaceholder`,
 *     `linksLabel`, `linksPlaceholder` — EN/DA/UK provided for every one, so
 *     production never relies on an English fallback for this form's new
 *     copy. Danish/Ukrainian are newly authored for this migration (this
 *     project's own established "disclosed machine-quality translation"
 *     precedent, same as prior phase migrations — see MIGRATION_REPORT.md
 *     history) — there was no existing equivalent copy anywhere else in the
 *     project to reuse for these brand-new fields.
 *
 * Safety:
 *  - Backs up each document's full current state to scripts/backups/ before
 *    writing anything.
 *  - Idempotent at the whole-document level: if `role0` already exists on a
 *    document's cvUploadForm section, that document is treated as already
 *    migrated and is skipped entirely (updates, removals, AND inserts) —
 *    safe to re-run.
 *  - `ifRevisionId`-guarded: re-fetches the revision immediately before
 *    writing and aborts that document if it changed since the plan was
 *    computed (e.g. an editor published a change concurrently).
 *  - Migrates the published document AND its draft (if one exists)
 *    independently — this project's established convention (see
 *    scripts/migrate-host-additional-services.ts) — never invokes Publish.
 *  - Never touches any other section, item, or document.
 *
 * Usage:
 *   npm run sanity:migrate-work-with-us-form:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-work-with-us-form -- --apply
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { tri, triText } from "./lib/sanityImportUtils";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-work-with-us", "drafts.page-work-with-us"] as const;
const SECTION_KEY = "cvUploadForm";

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
  language?: string;
  value?: unknown;
}
interface ContentItem {
  _key: string;
  itemKey?: string;
  title?: I18nEntry[] | null;
  text?: I18nEntry[] | null;
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

// --- 1. Items to REPURPOSE (existing itemKey, all 3 locales overwritten) ---

const REPURPOSED_TITLE_ITEMS: { sectionKey: string; itemKey: string; en: string; da: string; uk: string }[] = [
  {
    sectionKey: "hero",
    itemKey: "cvUploadCta",
    en: "Apply now",
    da: "Ansøg nu",
    uk: "Подати заявку",
  },
  {
    sectionKey: SECTION_KEY,
    itemKey: "modalTitle",
    en: "Apply to work with us",
    da: "Ansøg om at arbejde med os",
    uk: "Подайте заявку на співпрацю",
  },
  {
    sectionKey: SECTION_KEY,
    itemKey: "modalTitleSent",
    en: "Thank you — we received your application",
    da: "Tak — vi har modtaget din ansøgning",
    uk: "Дякуємо — ми отримали вашу заявку",
  },
];

const REPURPOSED_TEXT_ITEMS: { sectionKey: string; itemKey: string; en: string; da: string; uk: string }[] = [
  {
    sectionKey: "hero",
    itemKey: "hero1",
    en: "If any opportunities arise within our projects or activities that match your experience and interests, we will be sure to get in touch — tell us a bit about yourself below.",
    da: "Hvis der opstår muligheder inden for vores projekter eller aktiviteter, der matcher din erfaring og interesser, kontakter vi dig helt sikkert — fortæl os lidt om dig selv nedenfor.",
    uk: "Якщо в наших проєктах чи активностях з'являться можливості, що відповідають вашому досвіду й інтересам, ми обов'язково з вами зв'яжемося — розкажіть нам трохи про себе нижче.",
  },
  {
    sectionKey: SECTION_KEY,
    itemKey: "description",
    en: "We'd love to hear from you. Tell us about yourself and how you'd like to get involved — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.",
    da: "Vi vil meget gerne høre fra dig. Fortæl os om dig selv, og hvordan du gerne vil være involveret — vi husker dine oplysninger til fremtidige samarbejder, roller eller muligheder hos RORUM.",
    uk: "Ми будемо раді почути від вас. Розкажіть нам про себе і як ви хотіли б долучитися — ми враховуватимемо ваші дані для майбутніх співпраць, ролей чи можливостей у RORUM.",
  },
  {
    sectionKey: SECTION_KEY,
    itemKey: "errorMessage",
    en: "Something went wrong while sending your application. Please try again.",
    da: "Noget gik galt under afsendelsen af din ansøgning. Prøv igen.",
    uk: "Під час надсилання заявки сталася помилка. Спробуйте ще раз.",
  },
];

// --- 2. Items to REMOVE (CV-file-specific, no longer used by any code) ---

const REMOVED_ITEM_KEYS = ["dropzoneText", "messagePlaceholder"];

// --- 3. Items to ADD (new itemKey, EN/DA/UK provided upfront) ---

const NEW_TITLE_ITEMS: { itemKey: string; en: string; da: string; uk: string }[] = [
  { itemKey: "roleInterestLabel", en: "What kind of role are you interested in?", da: "Hvilken slags rolle er du interesseret i?", uk: "Яка роль вас цікавить?" },
  { itemKey: "role0", en: "Social media & content", da: "Sociale medier & indhold", uk: "Соціальні мережі та контент" },
  { itemKey: "role1", en: "Event planning & coordination", da: "Eventplanlægning & koordinering", uk: "Планування та координація подій" },
  { itemKey: "role2", en: "Event support / practical help", da: "Eventsupport / praktisk hjælp", uk: "Підтримка подій / практична допомога" },
  { itemKey: "role3", en: "Kitchen & food preparation", da: "Køkken & madlavning", uk: "Кухня та приготування їжі" },
  { itemKey: "role4", en: "Catering / serving at events", da: "Catering / servering til events", uk: "Кейтеринг / обслуговування на заходах" },
  { itemKey: "role5", en: "Community activities", da: "Fællesskabsaktiviteter", uk: "Громадська діяльність" },
  { itemKey: "role6", en: "Administration & coordination", da: "Administration & koordinering", uk: "Адміністрування та координація" },
  { itemKey: "role7", en: "Other", da: "Andet", uk: "Інше" },
  { itemKey: "experienceLabel", en: "Tell us about your experience and skills", da: "Fortæl os om din erfaring og dine kompetencer", uk: "Розкажіть про свій досвід і навички" },
  {
    itemKey: "experiencePlaceholder",
    en: "Tell us briefly about your relevant experience, practical skills, and what you are good at.",
    da: "Fortæl os kort om din relevante erfaring, praktiske færdigheder, og hvad du er god til.",
    uk: "Коротко розкажіть про свій релевантний досвід, практичні навички та в чому ви добре розбираєтеся.",
  },
  { itemKey: "whyRorumLabel", en: "Why would you like to work with RORUM?", da: "Hvorfor vil du gerne arbejde med RORUM?", uk: "Чому ви хотіли б працювати з RORUM?" },
  {
    itemKey: "whyRorumPlaceholder",
    en: "Tell us what interests you about RORUM and why you would like to work with us.",
    da: "Fortæl os, hvad der interesserer dig ved RORUM, og hvorfor du gerne vil arbejde med os.",
    uk: "Розкажіть, що вас цікавить у RORUM і чому ви хотіли б працювати з нами.",
  },
  { itemKey: "linksLabel", en: "Links", da: "Links", uk: "Посилання" },
  { itemKey: "linksPlaceholder", en: "LinkedIn, portfolio, or personal website", da: "LinkedIn, portfolio eller personlig hjemmeside", uk: "LinkedIn, портфоліо або особистий сайт" },
];

function backup(id: string, doc: PageDoc) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, `${id.replace(/[/.]/g, "_")}-work-with-us-form-${Date.now()}.json`);
  writeFileSync(filepath, JSON.stringify({ createdAt: new Date().toISOString(), purpose: "Pre-migration backup before transforming Work With Us from CV-upload to a text-based application form", id, document: doc }, null, 2));
  console.log(`  Backed up ${id} to ${filepath}`);
}

async function planFor(id: string) {
  const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const cvSection = doc.sections?.find((s) => s.sectionKey === SECTION_KEY);
  if (!cvSection) {
    console.log(`${id}: no "${SECTION_KEY}" section found — nothing to do.`);
    return null;
  }
  const alreadyMigrated = (cvSection.items ?? []).some((i) => i.itemKey === "role0");
  if (alreadyMigrated) {
    console.log(`${id}: "role0" already present — already migrated, skipping.`);
    return null;
  }

  console.log(`${id}: rev=${doc._rev} — plan:`);
  console.log(`  repurpose: ${[...REPURPOSED_TITLE_ITEMS, ...REPURPOSED_TEXT_ITEMS].map((i) => i.itemKey).join(", ")}`);
  console.log(`  remove:    ${REMOVED_ITEM_KEYS.join(", ")}`);
  console.log(`  add:       ${NEW_TITLE_ITEMS.map((i) => i.itemKey).join(", ")}`);

  return { doc, cvSection };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log("== Work With Us: CV-upload -> text application form migration — plan ==");

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan) continue;

    if (!APPLY) {
      console.log(`  Dry run only for ${id} — no writes performed.`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== plan.doc._rev) {
      console.error(`ABORTED for ${id}: changed concurrently since the plan was computed — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    backup(id, plan.doc);

    const tx = client.transaction();
    // Per-item idempotent: only insert a new row if it isn't already present.
    // Defends against a future re-run after a partial manual edit (e.g. an
    // editor deletes just the "role0" row this plan's own fast-path gate
    // above keys off of) re-inserting the other 14 rows as duplicates.
    const existingKeys = new Set((plan.cvSection.items ?? []).map((i) => i.itemKey).filter((k): k is string => Boolean(k)));
    const itemsToInsert = NEW_TITLE_ITEMS.filter((item) => !existingKeys.has(item.itemKey));

    for (const item of REPURPOSED_TITLE_ITEMS) {
      tx.patch(id, (p) =>
        p
          .ifRevisionId(fresh._rev)
          .set({ [`sections[sectionKey=="${item.sectionKey}"].items[itemKey=="${item.itemKey}"].title`]: tri(item.en, item.da, item.uk) }),
      );
    }
    for (const item of REPURPOSED_TEXT_ITEMS) {
      tx.patch(id, (p) =>
        p
          .ifRevisionId(fresh._rev)
          .set({ [`sections[sectionKey=="${item.sectionKey}"].items[itemKey=="${item.itemKey}"].text`]: triText(item.en, item.da, item.uk) }),
      );
    }
    for (const itemKey of REMOVED_ITEM_KEYS) {
      tx.patch(id, (p) => p.ifRevisionId(fresh._rev).unset([`sections[sectionKey=="${SECTION_KEY}"].items[itemKey=="${itemKey}"]`]));
    }
    // One .patch() per distinct insert — chaining multiple .insert() calls on
    // one Patch object silently keeps only the last (this project's own
    // established fix — see scripts/backfill-seo-copy.ts /
    // scripts/migrate-host-additional-services.ts).
    for (const item of itemsToInsert) {
      tx.patch(id, (p) =>
        p.ifRevisionId(fresh._rev).insert("after", `sections[sectionKey=="${SECTION_KEY}"].items[-1]`, [
          { _key: item.itemKey, _type: "contentItem", itemKey: item.itemKey, title: tri(item.en, item.da, item.uk) },
        ]),
      );
    }

    await tx.commit();
    console.log(`  Applied migration to ${id}.`);

    const after = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, sections}`, { id });
    const afterSection = after?.sections?.find((s) => s.sectionKey === SECTION_KEY);
    console.log(
      `  Read-back: ${id}'s "${SECTION_KEY}" section now has ${afterSection?.items?.length ?? 0} item(s): ${(afterSection?.items ?? []).map((i) => i.itemKey).join(", ")}`,
    );
  }
}

main().catch((error) => {
  console.error("migrate-work-with-us-application-form failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
