/**
 * FULL-DATASET VALIDATION INTEGRITY REPAIR (2026-09 audit).
 *
 * Fixes every safely-repairable BLOCKING validation defect found by
 * `npm run sanity:audit-validation` (`sanity documents validate --level error`)
 * across the live production dataset. Each mutation is minimal and
 * field-scoped — nothing here rewrites approved copy, changes layout, or
 * touches a field that wasn't itself invalid.
 *
 * Root cause of the owner-reported problem: `page-community-membership`'s 9
 * "Benefit" card images are rendered decoratively (`<Image alt="" aria-hidden>`
 * — see community-membership/page.tsx) but `imageWithAlt.alt` required English
 * alt text, so the whole document sat in a 9-error state and the manager could
 * not publish ANY unrelated change (e.g. adding a gallery photo). That half is
 * fixed in the SCHEMA (sanity/schemaTypes/objects/imageWithAlt.ts —
 * DECORATIVE_CONTENT_ITEM_IMAGE_ROLES now covers the benefit role); this
 * script cleans up the remaining genuine DATA defects.
 *
 * Covers, published + draft where both exist:
 *   1. page-community-membership
 *        - donation.items[bank0..bank8].title    -> add DA + UK (standard
 *          banking-row labels; CVR/IBAN/SWIFT-BIC kept verbatim as acronyms)
 *        - donation.items[bank4].title            -> drop 2 stray valueless
 *          i18n entries (Studio residue -> "Required" on .language)
 *        - application.text                       -> add DA + UK (one sentence)
 *   2. page-volunteer
 *        - hero.media[image].alt                  -> add DA + UK
 *        - applicationForm.items[*].title/.text   -> add DA + UK (modal microcopy)
 *   3. page-work-with-us
 *        - hero.media[collab0/collab1].alt        -> add DA + UK
 *        - features.items[feature0..2].title      -> add DA + UK (mirrors the
 *          section's own already-approved hero paragraphs)
 *        - cvUploadForm.items[*].title/.text      -> add DA + UK (modal microcopy)
 *   4. socialLinks (published only)
 *        - links[icon=="linkedin"]                -> remove the obsolete row
 *          (RORUM's own "no LinkedIn in the shared social list" decision is
 *          already reflected in drafts.socialLinks and socialLink.ts's
 *          SELECTABLE_PLATFORMS — this makes the published doc match)
 *
 * NOT touched (reported as owner content decisions in the final report):
 *   - event 4db90711 ("one-more-event-test": Lorem Ipsum overview, "da test"
 *     title, Russian-not-Ukrainian text) and event 4112b7ff
 *     ("a-new-event-at-the-rorom"): test/demo events. Delete them, or give
 *     them real content — not this script's call.
 *   - drafts.siteSettings: pure empty Studio residue (every diff vs the clean
 *     published doc is a valueless stub). The SCHEMA fix
 *     (ctaLink.ts: an entirely-empty siteSettings.announcementLink is valid)
 *     removes the publish blocker; the residual draft is deleted separately by
 *     `--delete-empty-sitesettings-draft` below once confirmed still empty.
 *   - orphaned legacy singletons (homePage/aboutPage/…) and the stray
 *     `event.host` / `formMessages.privacyConsentLabel` fields: unknown-type /
 *     unknown-field WARNINGS, never blocking — pre-existing cleanup backlog.
 *
 * Usage:
 *   npm run sanity:repair-validation-integrity:dry-run
 *   npm run sanity:repair-validation-integrity           # applies (needs write token)
 *   npm run sanity:repair-validation-integrity -- --apply --delete-empty-sitesettings-draft
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const DELETE_SS_DRAFT = process.argv.includes("--delete-empty-sitesettings-draft");
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: TOKEN,
  useCdn: false,
  perspective: "raw",
});

type Lang = "da" | "uk";
type Tri = { en: string; da: string; uk: string };

// ── translation tables ──────────────────────────────────────────────────────
// Keyed by the EXACT existing English value so a table entry can only ever be
// applied to the row it was written for; a row whose English value changes
// later simply won't match and is left untouched + reported.
const BANK_LABELS: Record<string, Tri> = {
  Beneficiary: { en: "Beneficiary", da: "Modtager", uk: "Отримувач" },
  CVR: { en: "CVR", da: "CVR", uk: "CVR" },
  Bank: { en: "Bank", da: "Bank", uk: "Банк" },
  "Account Type": { en: "Account Type", da: "Kontotype", uk: "Тип рахунку" },
  "Account No.": { en: "Account No.", da: "Kontonr.", uk: "Номер рахунку" },
  "Reg. No.": { en: "Reg. No.", da: "Reg.nr.", uk: "Реєстраційний номер" },
  IBAN: { en: "IBAN", da: "IBAN", uk: "IBAN" },
  "SWIFT/BIC": { en: "SWIFT/BIC", da: "SWIFT/BIC", uk: "SWIFT/BIC" },
  Currency: { en: "Currency", da: "Valuta", uk: "Валюта" },
};

const STRINGS: Record<string, Tri> = {
  // community-membership application.text
  "Together, we are building a strong international community.": {
    en: "Together, we are building a strong international community.",
    da: "Sammen bygger vi et stærkt internationalt fællesskab.",
    uk: "Разом ми будуємо сильну міжнародну спільноту.",
  },
  // volunteer hero image alt
  "RORUM volunteers welcoming guests and preparing a gathering": {
    en: "RORUM volunteers welcoming guests and preparing a gathering",
    da: "RORUM-frivillige byder gæster velkommen og forbereder en sammenkomst",
    uk: "Волонтери RORUM зустрічають гостей і готують зустріч",
  },
  // volunteer applicationForm
  "Volunteer With Us": { en: "Volunteer With Us", da: "Bliv frivillig hos os", uk: "Станьте волонтером із нами" },
  "Tell us what kinds of activities you would be interested in helping with and how you would like to contribute.": {
    en: "Tell us what kinds of activities you would be interested in helping with and how you would like to contribute.",
    da: "Fortæl os, hvilke slags aktiviteter du kunne være interesseret i at hjælpe med, og hvordan du gerne vil bidrage.",
    uk: "Розкажіть, у яких видах діяльності ви хотіли б допомагати та як хотіли б долучитися.",
  },
  "Thank you. Your volunteer application has been sent to the RORUM team.": {
    en: "Thank you. Your volunteer application has been sent to the RORUM team.",
    da: "Tak. Din frivilligansøgning er sendt til RORUM-teamet.",
    uk: "Дякуємо. Вашу заявку на волонтерство надіслано команді RORUM.",
  },
  "We could not send your application. Please check your connection and try again.": {
    en: "We could not send your application. Please check your connection and try again.",
    da: "Vi kunne ikke sende din ansøgning. Tjek din forbindelse, og prøv igen.",
    uk: "Не вдалося надіслати вашу заявку. Перевірте з'єднання та спробуйте ще раз.",
  },
  // work-with-us hero media alt
  "RORUM collaborators cooking together in the kitchen": {
    en: "RORUM collaborators cooking together in the kitchen",
    da: "RORUM-samarbejdspartnere laver mad sammen i køkkenet",
    uk: "Партнери RORUM разом готують на кухні",
  },
  "Light RORUM collaboration scene with planning materials": {
    en: "Light RORUM collaboration scene with planning materials",
    da: "Lys RORUM-samarbejdsscene med planlægningsmaterialer",
    uk: "Світла сцена співпраці RORUM із матеріалами для планування",
  },
  // work-with-us features (wording taken from this section's own approved
  // hero paragraphs — hero2 da/uk already live on the page)
  "Opportunities grow through people": {
    en: "Opportunities grow through people",
    da: "Muligheder vokser gennem mennesker",
    uk: "Можливості зростають завдяки людям",
  },
  "The right environment opens new doors": {
    en: "The right environment opens new doors",
    da: "Det rette miljø åbner nye døre",
    uk: "Правильне середовище відкриває нові двері",
  },
  "Let's create something meaningful together": {
    en: "Let's create something meaningful together",
    da: "Lad os skabe noget meningsfuldt sammen",
    uk: "Створімо щось значуще разом",
  },
  // work-with-us cvUploadForm
  "Send your CV": { en: "Send your CV", da: "Send dit CV", uk: "Надішліть резюме" },
  "Thank you — we received your CV": {
    en: "Thank you — we received your CV",
    da: "Tak — vi har modtaget dit CV",
    uk: "Дякуємо — ми отримали ваше резюме",
  },
  "We'd love to hear from you. Upload your CV and tell us a little about yourself — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.": {
    en: "We'd love to hear from you. Upload your CV and tell us a little about yourself — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.",
    da: "Vi vil meget gerne høre fra dig. Upload dit CV, og fortæl os lidt om dig selv — vi husker dine oplysninger til fremtidige samarbejder, roller eller muligheder hos RORUM.",
    uk: "Ми будемо раді почути від вас. Завантажте резюме й розкажіть трохи про себе — ми враховуватимемо ваші дані для майбутніх співпраць, ролей чи можливостей у RORUM.",
  },
  "Thank you for reaching out and sharing your story with RORUM. We'll keep your details in mind for future collaborations, roles, or opportunities.": {
    en: "Thank you for reaching out and sharing your story with RORUM. We'll keep your details in mind for future collaborations, roles, or opportunities.",
    da: "Tak, fordi du tog kontakt og delte din historie med RORUM. Vi husker dine oplysninger til fremtidige samarbejder, roller eller muligheder.",
    uk: "Дякуємо, що звернулися й поділилися своєю історією з RORUM. Ми враховуватимемо ваші дані для майбутніх співпраць, ролей чи можливостей.",
  },
  "Tell us briefly what kind of collaboration you are interested in.": {
    en: "Tell us briefly what kind of collaboration you are interested in.",
    da: "Fortæl os kort, hvilken slags samarbejde du er interesseret i.",
    uk: "Коротко розкажіть, який тип співпраці вас цікавить.",
  },
  "Choose a PDF, DOC, or DOCX file": {
    en: "Choose a PDF, DOC, or DOCX file",
    da: "Vælg en PDF-, DOC- eller DOCX-fil",
    uk: "Виберіть файл PDF, DOC або DOCX",
  },
  "Something went wrong while sending your CV. Please try again.": {
    en: "Something went wrong while sending your CV. Please try again.",
    da: "Noget gik galt under afsendelsen af dit CV. Prøv igen.",
    uk: "Під час надсилання резюме сталася помилка. Спробуйте ще раз.",
  },
};

// ── generic i18n-array helpers ──────────────────────────────────────────────
interface I18nEntry {
  _key: string;
  _type?: string;
  language?: string;
  value?: string;
}
const STRING_TYPE = "internationalizedArrayStringValue";
const TEXT_TYPE = "internationalizedArrayTextValue";

function enValue(entries: I18nEntry[] | undefined | null): string | undefined {
  return entries?.find((e) => (e.language ?? e._key) === "en")?.value?.trim() || undefined;
}
function hasLang(entries: I18nEntry[] | undefined | null, lang: Lang): boolean {
  return Boolean(entries?.find((e) => (e.language ?? e._key) === lang)?.value?.trim());
}
function strayKeys(entries: I18nEntry[] | undefined | null): string[] {
  // entries with no `language` at all (Studio residue) — these produce the
  // "Required" marker on `<field>[_key].language`
  return (entries ?? []).filter((e) => !e.language).map((e) => e._key);
}

interface Mut {
  doc: string;
  path: string;
  op: "insert-i18n" | "remove-i18n-entry";
  lang?: Lang;
  value?: string;
  itemType?: string;
  entryKey?: string;
  note: string;
}

// ── plan builders ───────────────────────────────────────────────────────────
type RawSection = {
  _key: string;
  sectionKey?: string;
  text?: I18nEntry[];
  media?: { _key: string; alt?: I18nEntry[] }[];
  items?: { _key: string; itemKey?: string; title?: I18nEntry[]; text?: I18nEntry[] }[];
};
type RawDoc = { _id: string; _rev: string; sections?: RawSection[]; links?: { _key: string; icon?: string }[] };

function fill(
  muts: Mut[],
  docId: string,
  basePath: string,
  entries: I18nEntry[] | undefined,
  tri: Tri | undefined,
  itemType: string,
  note: string,
) {
  const en = enValue(entries);
  if (!en) return; // nothing to anchor to — leave + (reported by caller if needed)
  if (!tri || tri.en !== en) {
    muts.push({ doc: docId, path: basePath, op: "insert-i18n", note: `SKIPPED (no matching translation for ${JSON.stringify(en)}) — ${note}` });
    return;
  }
  for (const lang of ["da", "uk"] as const) {
    if (hasLang(entries, lang)) continue;
    muts.push({ doc: docId, path: basePath, op: "insert-i18n", lang, value: tri[lang], itemType, note });
  }
}

function planCommunityMembership(doc: RawDoc, muts: Mut[]) {
  for (const s of doc.sections ?? []) {
    if (s.sectionKey === "donation") {
      for (const it of s.items ?? []) {
        if (!/^bank\d*$/.test(it.itemKey ?? "")) continue;
        const base = `sections[_key=="${s._key}"].items[_key=="${it._key}"].title`;
        for (const k of strayKeys(it.title)) {
          muts.push({ doc: doc._id, path: base, op: "remove-i18n-entry", entryKey: k, note: `bank row ${it.itemKey}: drop stray valueless title entry` });
        }
        fill(muts, doc._id, base, it.title, BANK_LABELS[enValue(it.title) ?? ""], STRING_TYPE, `bank row ${it.itemKey} label`);
      }
    }
    if (s.sectionKey === "application") {
      fill(muts, doc._id, `sections[_key=="${s._key}"].text`, s.text, STRINGS[enValue(s.text) ?? ""], TEXT_TYPE, "application closing sentence");
    }
  }
}

function planPageSectionsGeneric(doc: RawDoc, muts: Mut[], targets: { sectionKey: string; mediaAlt?: boolean; itemKeys?: RegExp; itemField?: "title" | "text" | "both" }[]) {
  for (const s of doc.sections ?? []) {
    const t = targets.find((x) => x.sectionKey === s.sectionKey);
    if (!t) continue;
    if (t.mediaAlt) {
      for (const m of s.media ?? []) {
        fill(muts, doc._id, `sections[_key=="${s._key}"].media[_key=="${m._key}"].alt`, m.alt, STRINGS[enValue(m.alt) ?? ""], STRING_TYPE, `${s.sectionKey} media ${m._key} alt`);
      }
    }
    for (const it of s.items ?? []) {
      if (t.itemKeys && !t.itemKeys.test(it.itemKey ?? "")) continue;
      const doTitle = t.itemField === "title" || t.itemField === "both";
      const doText = t.itemField === "text" || t.itemField === "both";
      if (doTitle && enValue(it.title))
        fill(muts, doc._id, `sections[_key=="${s._key}"].items[_key=="${it._key}"].title`, it.title, STRINGS[enValue(it.title) ?? ""], STRING_TYPE, `${s.sectionKey}/${it.itemKey} title`);
      if (doText && enValue(it.text))
        fill(muts, doc._id, `sections[_key=="${s._key}"].items[_key=="${it._key}"].text`, it.text, STRINGS[enValue(it.text) ?? ""], TEXT_TYPE, `${s.sectionKey}/${it.itemKey} text`);
    }
  }
}

async function loadDoc(id: string): Promise<RawDoc | null> {
  return client.fetch<RawDoc | null>(`*[_id == $id][0]`, { id });
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) {
    console.error("--apply given but SANITY_API_WRITE_TOKEN is not set. Aborting.");
    process.exit(1);
  }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  const ids = [
    "page-community-membership", "drafts.page-community-membership",
    "page-volunteer", "drafts.page-volunteer",
    "page-work-with-us", "drafts.page-work-with-us",
    "socialLinks",
  ];
  const docs = (await Promise.all(ids.map(loadDoc))).filter((d): d is RawDoc => Boolean(d));
  if (APPLY) {
    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, `validation-integrity-${ts}.json`), JSON.stringify(docs, null, 2));
    console.log(`Backed up ${docs.length} document(s) to scripts/backups/validation-integrity-${ts}.json\n`);
  }

  const muts: Mut[] = [];
  for (const d of docs) {
    const base = d._id.replace(/^drafts\./, "");
    if (base === "page-community-membership") planCommunityMembership(d, muts);
    if (base === "page-volunteer")
      planPageSectionsGeneric(d, muts, [
        { sectionKey: "hero", mediaAlt: true },
        { sectionKey: "applicationForm", itemField: "both" },
      ]);
    if (base === "page-work-with-us")
      planPageSectionsGeneric(d, muts, [
        { sectionKey: "hero", mediaAlt: true },
        { sectionKey: "features", itemKeys: /^feature\d*$/, itemField: "title" },
        { sectionKey: "cvUploadForm", itemField: "both" },
      ]);
    if (d._id === "socialLinks") {
      for (const l of d.links ?? []) {
        if (l.icon === "linkedin") muts.push({ doc: d._id, path: `links[_key=="${l._key}"]`, op: "remove-i18n-entry", entryKey: l._key, note: "remove obsolete LinkedIn social row" });
      }
    }
  }

  const real = muts.filter((m) => m.op === "remove-i18n-entry" || m.lang);
  const skipped = muts.filter((m) => m.note.startsWith("SKIPPED"));

  console.log(`== Planned mutations (${real.length}) ==`);
  for (const m of real) {
    console.log(
      m.op === "remove-i18n-entry"
        ? `  - ${m.doc}  ${m.path}  remove entry _key=${m.entryKey}  (${m.note})`
        : `  + ${m.doc}  ${m.path}  [${m.lang}] = ${JSON.stringify(m.value)}  (${m.note})`,
    );
  }
  if (skipped.length) {
    console.log(`\n== Skipped (${skipped.length}) — reported, not guessed ==`);
    for (const m of skipped) console.log(`  ? ${m.doc}  ${m.path}  (${m.note})`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply and a write token to apply.");
    return;
  }

  const byDoc = new Map<string, Mut[]>();
  for (const m of real) byDoc.set(m.doc, [...(byDoc.get(m.doc) ?? []), m]);

  for (const [docId, list] of byDoc) {
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: docId });
    const planned = docs.find((d) => d._id === docId)!._rev;
    if (!fresh || fresh._rev !== planned) {
      console.error(`ABORTED for ${docId}: changed concurrently since plan (planned ${planned}, now ${fresh?._rev}). Re-run.`);
      process.exitCode = 1;
      continue;
    }
    let tx = client.transaction();
    for (const m of list) {
      if (m.op === "remove-i18n-entry") {
        const sel = m.path.endsWith("]") ? `${m.path}` : `${m.path}[_key=="${m.entryKey}"]`;
        tx = tx.patch(docId, (p) => p.ifRevisionId(fresh._rev).unset([sel]));
      } else {
        tx = tx.patch(docId, (p) =>
          p.ifRevisionId(fresh._rev).insert("after", `${m.path}[-1]`, [
            { _key: m.lang, _type: m.itemType, language: m.lang, value: m.value },
          ]),
        );
      }
    }
    await tx.commit();
    console.log(`Applied ${list.length} mutation(s) to ${docId}.`);
  }

  if (DELETE_SS_DRAFT) {
    const ss = await client.fetch<Record<string, unknown> | null>(`*[_id == "drafts.siteSettings"][0]`);
    if (!ss) {
      console.log("drafts.siteSettings: already gone.");
    } else {
      // Full-document backup FIRST — a delete is irreversible.
      mkdirSync(backupDir, { recursive: true });
      const bfile = join(backupDir, `drafts-siteSettings-pre-delete-${ts}.json`);
      writeFileSync(bfile, JSON.stringify(ss, null, 2));
      // "Empty residue" = every non-system field is either identical to the
      // published doc or holds no trimmed value in ANY nested entry.
      const pub = (await client.fetch<Record<string, unknown> | null>(`*[_id == "siteSettings"][0]`)) ?? {};
      const carriesRealData = (v: unknown): boolean => {
        if (Array.isArray(v)) return v.some(carriesRealData);
        if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).some(([k, val]) => !["_key", "_type", "language", "_ref"].includes(k) && carriesRealData(val));
        if (typeof v === "string") return v.trim() !== "";
        return v !== null && v !== undefined && v !== false;
      };
      const dirtyFields = Object.keys(ss).filter(
        (k) => !["_id", "_rev", "_type", "_system", "_createdAt", "_updatedAt"].includes(k) && JSON.stringify(ss[k]) !== JSON.stringify(pub[k]) && carriesRealData(ss[k]),
      );
      if (dirtyFields.length === 0) {
        await client.delete("drafts.siteSettings");
        console.log(`Deleted drafts.siteSettings — pure empty residue, backed up to ${bfile}. Published siteSettings untouched.`);
      } else {
        console.log(`drafts.siteSettings carries real draft-only data in ${dirtyFields.join(", ")} — NOT deleted (backup at ${bfile}). Inspect manually.`);
      }
    }
  }

  console.log("\nDone. Re-run `npm run sanity:audit-validation` to confirm.");
}

main().catch((e) => {
  console.error("repair-validation-integrity failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
