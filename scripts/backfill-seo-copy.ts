/**
 * Backfills the owner-approved `seo.title`/`seo.description` copy (SEO task
 * Section 7) onto every `page`/`legalPage` document, EN/DA/UK, for whichever
 * locale is currently empty — never overwriting a value that already
 * exists. Writes only to the DRAFT (`drafts.<id>`), creating it as a full
 * copy of the published document if no draft exists yet (confirmed live:
 * none of the 14 `page` + 3 `legalPage` documents currently has one) —
 * never to the published document directly, and never publishes: the
 * manager reviews and publishes each draft themselves.
 *
 * Dry-run by default. Requires `--apply` AND a real write token to write
 * anything. Every write is revision-guarded against a freshly re-fetched
 * revision (aborts, not overwrites, on a concurrent change).
 *
 * If a locale already has a NON-empty value that differs from the approved
 * copy, that one field is skipped (both values printed) — never silently
 * overwritten. This can happen per-field; the rest of the plan still runs.
 *
 * Usage:
 *   npm run sanity:backfill-seo:dry-run
 *   npm run sanity:backfill-seo -- --apply   (only after reviewing the dry run)
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

type Locale = "en" | "da" | "uk";
const LOCALES: Locale[] = ["en", "da", "uk"];

interface ApprovedCopy {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

// Exact copy from the SEO task's Section 7 — never altered by this script,
// only compared against and (when the target field is empty) written
// verbatim, including the "| RORUM" suffix already baked into each title.
const APPROVED: Record<string, ApprovedCopy> = {
  home: {
    title: { en: "RORUM | Events, Community & Creative Space", da: "RORUM | Events, fællesskab og kreativt rum", uk: "RORUM | Події, спільнота та творчий простір" },
    description: {
      en: "Discover RORUM — a place for events, community, hosting, catering and creative collaboration where people and ideas come together.",
      da: "Oplev RORUM — et sted for events, fællesskab, værtskab, catering og kreative samarbejder, hvor mennesker og idéer mødes.",
      uk: "Відкрийте для себе RORUM — простір для подій, спільноти, гостинності, кейтерингу та творчої співпраці, де зустрічаються люди й ідеї.",
    },
  },
  about: {
    title: { en: "About RORUM | Our Space, Purpose & Community", da: "Om RORUM | Vores sted, formål og fællesskab", uk: "Про RORUM | Простір, мета та спільнота" },
    description: {
      en: "Learn about RORUM, our purpose and our approach to creating thoughtful events, welcoming experiences and meaningful communities.",
      da: "Lær RORUM at kende, vores formål og vores tilgang til at skabe nærværende events, imødekommende oplevelser og meningsfulde fællesskaber.",
      uk: "Дізнайтеся про RORUM, нашу мету та підхід до створення продуманих подій, гостинних вражень і змістовних спільнот.",
    },
  },
  events: {
    title: { en: "Upcoming Events at RORUM | Find Your Next Event", da: "Kommende events hos RORUM | Find dit næste event", uk: "Майбутні події в RORUM | Знайдіть свою подію" },
    description: {
      en: "Explore upcoming events at RORUM, find practical information and choose an experience that interests and inspires you.",
      da: "Se kommende events hos RORUM, find praktisk information, og vælg en oplevelse, der interesserer og inspirerer dig.",
      uk: "Переглядайте майбутні події в RORUM, знаходьте практичну інформацію та обирайте подію, яка вас зацікавить і надихне.",
    },
  },
  catering: {
    title: { en: "Catering for Events | RORUM", da: "Catering til events | RORUM", uk: "Кейтеринг для подій | RORUM" },
    description: {
      en: "Explore RORUM catering for meetings, receptions, dinners and events, with menus tailored to the occasion and your guests.",
      da: "Oplev RORUMs catering til møder, receptioner, middage og events med menuer, der tilpasses anledningen og dine gæster.",
      uk: "Відкрийте для себе кейтеринг RORUM для зустрічей, прийомів, вечерь і подій із меню, адаптованими до нагоди та ваших гостей.",
    },
  },
  eventDecoration: {
    title: { en: "Event Decoration & Styling | RORUM", da: "Eventdekoration og styling | RORUM", uk: "Декор та оформлення подій | RORUM" },
    description: {
      en: "Create the right atmosphere for your event with RORUM decoration and styling tailored to your format, space and vision.",
      da: "Skab den rette stemning til dit event med dekoration og styling fra RORUM, tilpasset formatet, stedet og din vision.",
      uk: "Створіть потрібну атмосферу події з декором та оформленням від RORUM, адаптованими до формату, простору й вашого бачення.",
    },
  },
  hostAtRorum: {
    title: { en: "Host Your Event at RORUM | Venue & Support", da: "Afhold dit event hos RORUM | Lokale og støtte", uk: "Проведіть подію в RORUM | Простір і підтримка" },
    description: {
      en: "Plan and host your event at RORUM with a flexible setting, practical support and an experience shaped around your guests.",
      da: "Planlæg og afhold dit event hos RORUM med fleksible rammer, praktisk støtte og en oplevelse formet omkring dine gæster.",
      uk: "Сплануйте та проведіть подію в RORUM із гнучким простором, практичною підтримкою та досвідом, створеним для ваших гостей.",
    },
  },
  communityMembership: {
    title: { en: "Community Membership | Join RORUM", da: "Medlemskab af fællesskabet | Bliv en del af RORUM", uk: "Участь у спільноті | Приєднуйтеся до RORUM" },
    description: {
      en: "Become part of the RORUM community, meet people, exchange ideas and take part in activities and shared experiences.",
      da: "Bliv en del af RORUMs fællesskab, mød mennesker, udveksl idéer og deltag i aktiviteter og fælles oplevelser.",
      uk: "Станьте частиною спільноти RORUM, знайомтеся з людьми, обмінюйтеся ідеями та долучайтеся до активностей і спільних подій.",
    },
  },
  volunteer: {
    title: { en: "Volunteer at RORUM | Join the Community", da: "Bliv frivillig hos RORUM | Deltag i fællesskabet", uk: "Волонтерство в RORUM | Долучайтеся до спільноти" },
    description: {
      en: "Discover ways to volunteer at RORUM, contribute your skills and energy, and help create welcoming events and communities.",
      da: "Se mulighederne for at blive frivillig hos RORUM, bidrag med dine evner og din energi, og vær med til at skabe imødekommende events og fællesskaber.",
      uk: "Дізнайтеся про можливості волонтерства в RORUM, діліться навичками й енергією та допомагайте створювати гостинні події й спільноти.",
    },
  },
  workWithUs: {
    title: { en: "Work With Us | Opportunities at RORUM", da: "Arbejd sammen med os | Muligheder hos RORUM", uk: "Працюйте з нами | Можливості в RORUM" },
    description: {
      en: "Explore opportunities to work and collaborate with RORUM and contribute to events, hospitality and community experiences.",
      da: "Udforsk mulighederne for at arbejde og samarbejde med RORUM og bidrage til events, værtskab og fællesskabsoplevelser.",
      uk: "Дізнайтеся про можливості роботи та співпраці з RORUM і долучайтеся до створення подій, гостинності та спільнотного досвіду.",
    },
  },
  contact: {
    title: { en: "Contact RORUM | Get in Touch", da: "Kontakt RORUM | Kom i kontakt med os", uk: "Зв'язатися з RORUM | Напишіть нам" },
    description: {
      en: "Contact RORUM with questions about events, hosting, catering, membership, collaboration or visiting the space.",
      da: "Kontakt RORUM med spørgsmål om events, værtskab, catering, medlemskab, samarbejde eller et besøg hos os.",
      uk: "Зв'яжіться з RORUM із питаннями про події, проведення заходів, кейтеринг, участь у спільноті, співпрацю або відвідування простору.",
    },
  },
  faq: {
    title: { en: "Frequently Asked Questions | RORUM", da: "Ofte stillede spørgsmål | RORUM", uk: "Поширені запитання | RORUM" },
    description: {
      en: "Find answers to common questions about RORUM events, hosted programmes, volunteering, services and practical information.",
      da: "Find svar på almindelige spørgsmål om RORUMs events, værtsprogrammer, frivilligt arbejde, services og praktiske forhold.",
      uk: "Знайдіть відповіді на поширені запитання про події RORUM, програми, волонтерство, послуги та практичну інформацію.",
    },
  },
  terms: {
    title: { en: "Terms and Conditions | RORUM", da: "Vilkår og betingelser | RORUM", uk: "Умови користування | RORUM" },
    description: {
      en: "Read the terms and conditions that apply when using the RORUM website, services and related features.",
      da: "Læs de vilkår og betingelser, der gælder ved brug af RORUMs website, services og tilknyttede funktioner.",
      uk: "Ознайомтеся з умовами користування сайтом RORUM, його послугами та пов'язаними функціями.",
    },
  },
  "privacy-policy": {
    title: { en: "Privacy Policy | RORUM", da: "Privatlivspolitik | RORUM", uk: "Політика конфіденційності | RORUM" },
    description: {
      en: "Learn how RORUM collects, uses, stores and protects personal information when you use the website or contact us.",
      da: "Læs, hvordan RORUM indsamler, bruger, opbevarer og beskytter personoplysninger, når du bruger websitet eller kontakter os.",
      uk: "Дізнайтеся, як RORUM збирає, використовує, зберігає та захищає персональні дані під час користування сайтом або звернення до нас.",
    },
  },
  "cookie-policy": {
    title: { en: "Cookie Policy | RORUM", da: "Cookiepolitik | RORUM", uk: "Політика використання cookie | RORUM" },
    description: {
      en: "Learn which cookies the RORUM website uses, why they are used and how you can manage your cookie preferences.",
      da: "Læs, hvilke cookies RORUMs website bruger, hvorfor de bruges, og hvordan du kan administrere dine cookieindstillinger.",
      uk: "Дізнайтеся, які файли cookie використовує сайт RORUM, навіщо вони потрібні та як керувати своїми налаштуваннями cookie.",
    },
  },
  // page-catering-menu-examples is deliberately excluded — it has no
  // route of its own (see page.ts's own comment hiding its seo field) and
  // must never receive SEO copy implying it has a public search result.
};

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}
interface PageLikeDoc {
  _id: string;
  _type: "page" | "legalPage";
  _rev: string;
  pageKey?: string;
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
  [key: string]: unknown;
}

interface PlannedField {
  docId: string;
  draftId: string;
  field: "title" | "description";
  locale: Locale;
  proposed: string;
  /**
   * The `_key` of an already-present-but-empty (no `value`, or a
   * whitespace-only one) entry for this exact locale, if one exists — set
   * ONLY when a real Studio-created row for this locale is already there.
   * Confirmed live and real (not hypothetical): several fields on this
   * dataset have exactly this shape (an English row with `language` set but
   * no `value` — created the moment a manager opened the field in Studio,
   * before this row was ever filled in). When present, the field is
   * addressed by `_key` and its `value` is SET; when absent, a brand-new
   * entry is INSERTed. Using insert unconditionally would create a second,
   * duplicate entry for the same language sitting next to the empty one —
   * `pickLocalized()` would then only ever see the first (still-empty) one.
   */
  existingKey: string | undefined;
}
interface SkippedField {
  docId: string;
  field: "title" | "description";
  locale: Locale;
  existing: string;
  approved: string;
}

/** The real value for this locale, if a non-empty one is stored — trims and treats whitespace-only as absent. */
function currentValue(entries: I18nEntry[] | undefined, locale: Locale): string | undefined {
  const raw = entries?.find((e) => e.language === locale)?.value;
  return raw?.trim() ? raw : undefined;
}

/** The `_key` of any entry already tagged with this exact locale, present or not — used to decide set() vs insert() regardless of whether it currently holds a value. */
function existingEntryKey(entries: I18nEntry[] | undefined, locale: Locale): string | undefined {
  return entries?.find((e) => e.language === locale)?._key;
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);

  const publishedDocs = await client.fetch<PageLikeDoc[]>(
    `*[_type in ["page", "legalPage"] && !(_id in path("drafts.**"))]{_id, _type, _rev, pageKey, seo}`,
  );
  const draftDocs = await client.fetch<PageLikeDoc[]>(
    `*[_type in ["page", "legalPage"] && _id in path("drafts.**")]{_id, _type, _rev, pageKey, seo}`,
  );
  const draftByPublishedId = new Map(draftDocs.map((d) => [d._id.replace(/^drafts\./, ""), d]));

  const planned: PlannedField[] = [];
  const skipped: SkippedField[] = [];
  const missingCounts: Record<Locale, { title: number; description: number }> = {
    en: { title: 0, description: 0 },
    da: { title: 0, description: 0 },
    uk: { title: 0, description: 0 },
  };

  for (const doc of publishedDocs) {
    const key = doc.pageKey;
    if (!key || !(key in APPROVED)) {
      console.log(`${doc._id}: no pageKey/approved-copy entry (pageKey="${key}") — skipped entirely (e.g. cateringMenuExamples).`);
      continue;
    }
    const approved = APPROVED[key]!;
    // The draft (if one exists) is the actual write target and the actual
    // next-published state — plan against ITS content, not the published
    // doc's, so a field a manager has already started editing on the draft
    // is correctly read as "existing", never silently duplicated.
    const draft = draftByPublishedId.get(doc._id);
    const current = draft ?? doc;
    for (const field of ["title", "description"] as const) {
      const entries = field === "title" ? current.seo?.title : current.seo?.description;
      for (const locale of LOCALES) {
        const existing = currentValue(entries, locale);
        const approvedValue = approved[field][locale];
        if (existing === undefined) {
          missingCounts[locale][field] += 1;
          planned.push({
            docId: doc._id,
            draftId: `drafts.${doc._id}`,
            field,
            locale,
            proposed: approvedValue,
            existingKey: existingEntryKey(entries, locale),
          });
        } else if (existing !== approvedValue) {
          skipped.push({ docId: doc._id, field, locale, existing, approved: approvedValue });
        }
        // existing === approvedValue: already correct, nothing to do.
      }
    }
  }

  console.log("\n== Missing-value counts (about to be filled) ==");
  for (const locale of LOCALES) {
    console.log(`  ${locale}: missing title = ${missingCounts[locale].title}, missing description = ${missingCounts[locale].description}`);
  }

  if (skipped.length > 0) {
    console.log(`\n== ${skipped.length} field(s) SKIPPED — existing non-empty value differs from approved copy (never overwritten) ==`);
    for (const s of skipped) {
      console.log(`  ${s.docId}.seo.${s.field}[${s.locale}]:`);
      console.log(`    existing:  ${JSON.stringify(s.existing)}`);
      console.log(`    approved:  ${JSON.stringify(s.approved)}`);
    }
  } else {
    console.log("\nNo existing values differ from the approved copy — nothing skipped.");
  }

  console.log(`\n== Plan: ${planned.length} field(s) to fill on their drafts ==`);
  for (const p of planned) {
    const how = p.existingKey ? `set existing empty row (_key="${p.existingKey}")` : "insert new row";
    console.log(`  ${p.draftId}: seo.${p.field}[${p.locale}] = ${JSON.stringify(p.proposed)}  (${how})`);
  }

  if (!APPLY) {
    console.log("\nDry run only — no writes performed. Requires explicit authorization before --apply.");
    return;
  }

  if (planned.length === 0) {
    console.log("\nNothing to apply — idempotent, already up to date.");
    return;
  }

  // Group by document so each doc's draft is created/patched exactly once.
  const byDoc = new Map<string, PlannedField[]>();
  for (const p of planned) {
    const list = byDoc.get(p.docId) ?? [];
    list.push(p);
    byDoc.set(p.docId, list);
  }

  for (const [docId, fields] of byDoc) {
    const draftId = `drafts.${docId}`;
    // Re-fetch both fresh, right before writing — never trust the plan's
    // now-possibly-stale snapshot for anything other than WHICH locales to
    // fill; every decision about set() vs insert() and every revision guard
    // below uses this fresh read.
    const freshPublished = await client.fetch<PageLikeDoc | null>(`*[_id == $id][0]`, { id: docId });
    const freshDraft = await client.fetch<PageLikeDoc | null>(`*[_id == $id][0]`, { id: draftId });
    const originalDoc = publishedDocs.find((d) => d._id === docId)!;
    if (!freshPublished || freshPublished._rev !== originalDoc._rev) {
      console.error(`ABORTED for ${docId}: published document changed concurrently since the plan was computed — re-run to recompute. Skipping this document only.`);
      continue;
    }

    if (!freshDraft) {
      // No draft exists yet — create one as a full copy of the published
      // document, with only the approved fields for THIS document's
      // missing locales added on top. Every other field is copied verbatim;
      // nothing else about the document changes.
      const draftBody: PageLikeDoc = { ...freshPublished, _id: draftId };
      const seo = { ...(draftBody.seo ?? {}) } as { title?: I18nEntry[]; description?: I18nEntry[] };
      for (const f of fields) {
        const arrayField = f.field;
        const existingEntries = seo[arrayField] ?? [];
        const valueType = f.field === "title" ? "internationalizedArrayStringValue" : "internationalizedArrayTextValue";
        const targetIndex = existingEntries.findIndex((e) => e.language === f.locale);
        if (targetIndex !== -1) {
          // A same-locale row already exists on the published doc (e.g. an
          // English row created by opening the field in Studio, with no
          // value ever typed in) — fill THAT row in, never append a
          // duplicate for the same language.
          seo[arrayField] = existingEntries.map((e, i) => (i === targetIndex ? { ...e, value: f.proposed } : e));
        } else {
          seo[arrayField] = [...existingEntries, { _key: f.locale, _type: valueType, language: f.locale, value: f.proposed }];
        }
      }
      draftBody.seo = seo;
      await client.createIfNotExists(draftBody);
      console.log(`Created ${draftId} (copy of ${docId}) with ${fields.length} SEO field(s) filled in.`);
    } else {
      // A draft already exists — patch only the missing locale entries onto
      // it, revision-guarded, never touching anything else a manager may
      // have already changed on it.
      //
      // Each PatchOperations object (@sanity/client's PatchOperations type)
      // has ONE `insert` slot, period — it cannot describe "insert here AND
      // also insert there" in a single patch, unlike `set`, whose object can
      // hold multiple keys at once. Confirmed live, the hard way: this
      // script's first --apply run chained multiple `.insert()` calls (one
      // per locale, sometimes across both `seo.title` and `seo.description`)
      // onto ONE patch builder — only the LAST insert survived, silently
      // discarding every earlier one for that document. Fixed by giving each
      // distinct insert PATH (`seo.title`, `seo.description`) its own
      // separate patch mutation inside one atomic transaction — still one
      // commit, still fully revision-guarded, but each insert now has its
      // own slot instead of competing for the one the previous fix still
      // shared.
      const setPayload: Record<string, string> = {};
      const setIfMissingPayload: Record<string, unknown[]> = {};
      const insertsByPath = new Map<string, { after: string; items: I18nEntry[] }>();

      for (const f of fields) {
        const arrayField = f.field;
        const currentEntries = freshDraft.seo?.[arrayField] ?? [];
        const existingKey = currentEntries.find((e) => e.language === f.locale)?._key;
        const valueType = f.field === "title" ? "internationalizedArrayStringValue" : "internationalizedArrayTextValue";
        if (existingKey) {
          // Same-locale row already on the draft (present but empty) — set
          // its value by _key, never insert a duplicate for that language.
          setPayload[`seo.${f.field}[_key=="${existingKey}"].value`] = f.proposed;
        } else {
          const path = `seo.${f.field}`;
          setIfMissingPayload[path] = [];
          const existing = insertsByPath.get(path);
          const item: I18nEntry = { _key: f.locale, _type: valueType, language: f.locale, value: f.proposed };
          if (existing) {
            existing.items.push(item);
          } else {
            insertsByPath.set(path, { after: `${path}[-1]`, items: [item] });
          }
        }
      }

      const tx = client.transaction();
      // setIfMissing + set share one mutation — set() merges multiple keys
      // into one object natively, so this one IS safe to combine.
      if (Object.keys(setIfMissingPayload).length > 0 || Object.keys(setPayload).length > 0) {
        tx.patch(draftId, {
          ifRevisionID: freshDraft._rev,
          ...(Object.keys(setIfMissingPayload).length > 0 ? { setIfMissing: setIfMissingPayload } : {}),
          ...(Object.keys(setPayload).length > 0 ? { set: setPayload } : {}),
        });
      }
      // Every insert path gets its OWN patch mutation in the same transaction.
      for (const { after, items } of insertsByPath.values()) {
        tx.patch(draftId, { ifRevisionID: freshDraft._rev, insert: { after, items } });
      }
      await tx.commit();
      console.log(`Patched existing ${draftId} with ${fields.length} SEO field(s) (a draft already existed — only the missing locales were added/filled).`);
    }
  }

  console.log("\nApplied. Nothing was published — review and publish each draft manually in Studio.");
}

main().catch((error) => {
  console.error("backfill-seo-copy failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
