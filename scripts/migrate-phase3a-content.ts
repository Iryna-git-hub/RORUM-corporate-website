/**
 * Phase 3a content migration: fills in the schema fields added while fixing
 * the Catering/Menu-Examples/Event-Decoration/Host-at-RORUM/Events/FAQ/
 * Navigation gaps found by the Phase 3 CMS-completeness audit — see
 * MIGRATION_REPORT.md for the full audit.
 *
 * Highlights:
 *   - `cateringMenuExamplesPage` was essentially unseeded: its chrome text
 *     had been written to a `menuOverlay.*` path that doesn't exist in the
 *     schema (a bug in `scripts/import-translations.ts`, fixed here by
 *     writing to the real fields), and its dish/category content had ended
 *     up on orphaned `cateringMenuCategory` documents instead. This script
 *     reuses that existing trilingual content (fetched, not re-authored)
 *     and populates the real `cateringMenuExamplesPage.categories` field.
 *   - Several image fields (`philosophyImage`, `stylingImage`, `sessionImage`,
 *     the 3 page galleries) already existed in schema but were never
 *     populated — uploaded here from the same local files the frontend used
 *     to hardcode.
 *   - New fields with no prior source (aria-labels, `eventMessages`,
 *     `formMessages` additions, navigation mobile-menu labels, etc.) get
 *     English authored from the current hardcoded copy, then Danish/
 *     Ukrainian machine-translated by Claude — same disclosed-machine-
 *     translation precedent already used for Phase 2's legal pages.
 *
 * Usage:
 *   npm run sanity:migrate-phase3a:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-phase3a           (requires SANITY_API_WRITE_TOKEN)
 *
 * Idempotency: every write is gated on the destination field not already
 * being set, so re-running after a partial run — or after an editor has
 * replaced a value in the Studio — never overwrites their choice and never
 * re-uploads an asset.
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { en, tri, triText } from "./lib/sanityImportUtils";
import { cateringGalleryImages, eventDecorationGalleryImages, hostAtRorumGalleryImages } from "../lib/galleryImages";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

function resolveLocalPath(publicRelativePath: string): string {
  return path.join(process.cwd(), "public", publicRelativePath.replace(/^\//, ""));
}

async function maybeSetImage(
  docId: string,
  patchKey: string,
  alreadySet: boolean,
  localRelPath: string,
  altEn: string,
  label: string,
) {
  if (alreadySet) {
    console.log(`  ${label}: already set — skipping.`);
    return;
  }
  const localPath = resolveLocalPath(localRelPath);
  if (!existsSync(localPath)) {
    console.warn(`  ${label}: local file not found at ${localPath} — skipping.`);
    return;
  }
  console.log(`  ${label}: would upload public${localRelPath} and set ${patchKey}.`);
  if (DRY_RUN) return;
  const asset = await client.assets.upload("image", readFileSync(localPath), { filename: path.basename(localRelPath) });
  await client
    .patch(docId)
    .set({ [patchKey]: { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: en(altEn) } })
    .commit();
  console.log(`  ${label}: uploaded and linked.`);
}

async function maybeSetGallery(docId: string, alreadySet: boolean, images: { src: string; alt: string }[], label: string) {
  if (alreadySet) {
    console.log(`  ${label} gallery: already set — skipping.`);
    return;
  }
  const missing = images.filter((img) => !existsSync(resolveLocalPath(img.src)));
  if (missing.length) {
    console.warn(`  ${label} gallery: ${missing.length} local file(s) missing — skipping.`);
    return;
  }
  console.log(`  ${label} gallery: would upload ${images.length} photo(s) and set gallery.`);
  if (DRY_RUN) return;
  const items = [];
  for (const [i, img] of images.entries()) {
    const asset = await client.assets.upload("image", readFileSync(resolveLocalPath(img.src)), {
      filename: path.basename(img.src),
    });
    items.push({ _key: `g${i}`, _type: "imageWithAlt", asset: { _type: "reference", _ref: asset._id }, alt: en(img.alt) });
  }
  await client.patch(docId).set({ gallery: items }).commit({ autoGenerateArrayKeys: false });
  console.log(`  ${label} gallery: uploaded ${images.length} photo(s) and set.`);
}

async function maybeSetField(
  docId: string,
  fieldName: string,
  alreadySet: boolean,
  value: unknown,
  label: string,
) {
  if (alreadySet) {
    console.log(`  ${label}: already set — skipping.`);
    return;
  }
  console.log(`  ${label}: would set.`);
  if (DRY_RUN) return;
  await client.patch(docId).set({ [fieldName]: value }).commit({ autoGenerateArrayKeys: false });
  console.log(`  ${label}: set.`);
}

interface KeyedEntry {
  key: string;
  en: string;
  da: string;
  uk: string;
}

/**
 * Adds any missing rows to a `keyedString[]` field (see objects/keyedString.ts)
 * — several singletons store their shared strings this way, one array
 * instead of one named field each, to stay under Sanity's Content Lake cap
 * on distinct schema attribute paths. Idempotent per-key: only appends rows
 * whose key isn't already present, never touches existing rows.
 */
async function maybeSetLabels(
  docId: string,
  fieldPath: string,
  currentLabels: { key?: string | null }[] | null | undefined,
  entries: KeyedEntry[],
  label: string,
) {
  const existingKeys = new Set((currentLabels ?? []).map((l) => l.key).filter((k): k is string => Boolean(k)));
  const missing = entries.filter((e) => !existingKeys.has(e.key));
  if (!missing.length) {
    console.log(`  ${label}: already set — skipping.`);
    return;
  }
  console.log(`  ${label}: would add ${missing.length} label(s) (${missing.map((e) => e.key).join(", ")}).`);
  if (DRY_RUN) return;
  const newItems = missing.map((e) => ({ _key: e.key, _type: "keyedString", key: e.key, value: tri(e.en, e.da, e.uk) }));
  await client
    .patch(docId)
    .setIfMissing({ [fieldPath]: [] })
    .append(fieldPath, newItems)
    .commit({ autoGenerateArrayKeys: false });
  console.log(`  ${label}: added ${missing.length} label(s).`);
}

// ---------------------------------------------------------------------------
// 1. cateringPage
// ---------------------------------------------------------------------------

async function migrateCateringPage() {
  console.log("\n== Catering page ==");
  const doc = await client.fetch<{
    hasPhilosophyImage: boolean;
    hasInquiryIntro: boolean;
    hasSuitableForAriaLabel: boolean;
    hasMenuExamplesCta: boolean;
  } | null>(`*[_id == "cateringPage"][0]{
    "hasPhilosophyImage": defined(philosophyImage.asset),
    "hasInquiryIntro": defined(inquiryIntro),
    "hasSuitableForAriaLabel": defined(suitableForAriaLabel),
    "hasMenuExamplesCta": defined(menuExamplesCta),
  }`);
  if (!doc) {
    console.warn("  cateringPage document not found — skipping.");
    return;
  }

  await maybeSetImage(
    "cateringPage",
    "philosophyImage",
    doc.hasPhilosophyImage,
    "/images/catering/catering-service-team.png",
    "RORUM catering team preparing food for an event",
    "Philosophy image",
  );

  await maybeSetField(
    "cateringPage",
    "inquiryIntro",
    doc.hasInquiryIntro,
    triText(
      "Tell us about your event and we will help you find the right catering format.",
      "Fortæl os om dit event, så hjælper vi dig med at finde det rette cateringformat.",
      "Розкажіть нам про вашу подію, і ми допоможемо підібрати правильний формат кейтерингу.",
    ),
    "Inquiry intro",
  );

  await maybeSetField(
    "cateringPage",
    "suitableForAriaLabel",
    doc.hasSuitableForAriaLabel,
    tri("Suitable catering formats", "Egnede cateringformater", "Придатні формати кейтерингу"),
    "Suitable-for aria label",
  );

  await maybeSetField(
    "cateringPage",
    "menuExamplesCta",
    doc.hasMenuExamplesCta,
    tri("Menu examples", "Menu-eksempler", "Приклади меню"),
    "Menu examples CTA",
  );
}

// ---------------------------------------------------------------------------
// 2. cateringMenuExamplesPage (the big one — chrome text + categories/dishes
// reused from the orphaned `cateringMenuCategory` documents)
// ---------------------------------------------------------------------------

interface CateringMenuCategoryDoc {
  _id: string;
  title?: unknown;
  navLabel?: unknown;
  description?: unknown;
  order?: number;
  featuredItems?: { _key: string; name?: unknown; description?: unknown; image?: unknown }[];
}

function dedupeByPublishedId<T extends { _id: string }>(docs: T[]): T[] {
  const byId = new Map<string, T>();
  for (const doc of docs) {
    const publishedId = doc._id.startsWith("drafts.") ? doc._id.slice("drafts.".length) : doc._id;
    const existing = byId.get(publishedId);
    const isDraft = doc._id.startsWith("drafts.");
    if (!existing || (existing._id.startsWith("drafts.") && !isDraft)) {
      byId.set(publishedId, doc);
    }
  }
  return Array.from(byId.values());
}

async function migrateCateringMenuExamplesPage() {
  console.log("\n== Catering Menu Examples page ==");
  const doc = await client.fetch<{
    hasBannerImage: boolean;
    hasTitle: boolean;
    hasCategories: boolean;
  } | null>(`*[_id == "cateringMenuExamplesPage"][0]{
    "hasBannerImage": defined(bannerImage.asset),
    "hasTitle": defined(title),
    "hasCategories": defined(categories),
  }`);
  if (!doc) {
    console.warn("  cateringMenuExamplesPage document not found — skipping.");
    return;
  }

  await maybeSetImage(
    "cateringMenuExamplesPage",
    "bannerImage",
    doc.hasBannerImage,
    "/images/catering/catering-gallery-added-16.png",
    "Catering menu example from RORUM's catering gallery",
    "Banner image",
  );

  const chromeFields: Record<string, unknown> = {};
  if (!doc.hasTitle) {
    chromeFields.title = tri("Catering menu", "Cateringmenu", "Меню кейтерингу");
    chromeFields.intro = [
      {
        _key: "mo0",
        _type: "bulletParagraph",
        text: triText(
          "Traditional Ukrainian hospitality, Danish classics, and European-style service for hosted meetings, celebrations, and special gatherings.",
          "Traditionel ukrainsk gæstfrihed, danske klassikere og europæisk stil service til værtsskabsmøder, fejringer og særlige sammenkomster.",
          "Традиційна українська гостинність, данська класика та європейський стиль обслуговування для зустрічей, свят та особливих подій.",
        ),
      },
      {
        _key: "mo1",
        _type: "bulletParagraph",
        text: triText(
          "Each menu is created individually based on your event format, number of guests, season, and dietary preferences.",
          "Hver menu udarbejdes individuelt baseret på dit eventformat, antal gæster, sæson og kostpræferencer.",
          "Кожне меню створюється індивідуально з урахуванням формату вашої події, кількості гостей, сезону та харчових уподобань.",
        ),
      },
    ];
    chromeFields.requestCta = tri("Request custom menu", "Anmod om skræddersyet menu", "Замовити індивідуальне меню");
    chromeFields.featuredDishesLabel = tri("Featured Dishes", "Udvalgte retter", "Обрані страви");
    chromeFields.disclaimerNote = triText(
      "The dishes shown are examples of what we can offer. We'll be happy to create a menu tailored to your event, preferences, and guests.",
      "Retterne vist er eksempler på, hvad vi kan tilbyde. Vi skaber gerne en menu, der er skræddersyet til dit event, dine præferencer og dine gæster.",
      "Показані страви є прикладами того, що ми можемо запропонувати. Ми з радістю створимо меню, адаптоване до вашої події, уподобань та гостей.",
    );
    chromeFields.customMenuTitle = tri(
      "Create your custom menu",
      "Skab din skræddersyede menu",
      "Створіть своє індивідуальне меню",
    );
    chromeFields.customMenuText = triText(
      "Tell us about your event, number of guests, preferred cuisine, and dietary needs. We will help create a menu that fits your occasion and makes your guests feel welcome.",
      "Fortæl os om dit event, antal gæster, foretrukne køkken og kostbehov. Vi hjælper med at skabe en menu, der passer til lejligheden og får dine gæster til at føle sig velkomne.",
      "Розкажіть нам про вашу подію, кількість гостей, бажану кухню та харчові потреби. Ми допоможемо створити меню, яке підходить для вашої події та порадує гостей.",
    );
    chromeFields.backToCateringCta = tri("Back to Catering", "Tilbage til catering", "Назад до кейтерингу");
    console.log("  chrome text (title/intro/CTAs/disclaimer/custom-menu section): would set.");
    if (!DRY_RUN) {
      await client.patch("cateringMenuExamplesPage").set(chromeFields).commit({ autoGenerateArrayKeys: false });
      console.log("  chrome text: set.");
    }
  } else {
    console.log("  chrome text: already set — skipping.");
  }

  if (doc.hasCategories) {
    console.log("  categories: already set — skipping.");
    return;
  }

  const categoryDocsRaw = await client.fetch<CateringMenuCategoryDoc[]>(
    `*[_type == "cateringMenuCategory"] | order(order asc){_id, title, navLabel, description, order, featuredItems}`,
  );
  const categoryDocs = dedupeByPublishedId(categoryDocsRaw);
  if (!categoryDocs.length) {
    console.warn("  categories: no cateringMenuCategory documents found — nothing to migrate.");
    return;
  }

  const totalDishes = categoryDocs.reduce((n, c) => n + (c.featuredItems?.length ?? 0), 0);
  console.log(
    `  categories: found ${categoryDocs.length} categor${categoryDocs.length === 1 ? "y" : "ies"} / ${totalDishes} dish(es) on cateringMenuCategory documents — would copy into cateringMenuExamplesPage.categories (images reused by reference, not re-uploaded).`,
  );
  if (DRY_RUN) return;

  const categories = categoryDocs.map((cat) => ({
    _key: cat._id.replace(/^drafts\./, ""),
    _type: "menuCategory",
    title: cat.title,
    navLabel: cat.navLabel,
    description: cat.description,
    dishes: (cat.featuredItems ?? []).map((item) => ({
      _key: item._key,
      _type: "cateringMenuItem",
      name: item.name,
      description: item.description,
      image: item.image,
    })),
  }));

  await client.patch("cateringMenuExamplesPage").set({ categories }).commit({ autoGenerateArrayKeys: false });
  console.log(`  categories: copied ${categoryDocs.length} categor${categoryDocs.length === 1 ? "y" : "ies"} / ${totalDishes} dish(es).`);
}

async function migrateCateringGallery() {
  console.log("\n== Catering page gallery ==");
  const doc = await client.fetch<{ hasGallery: boolean } | null>(`*[_id == "cateringPage"][0]{"hasGallery": defined(gallery)}`);
  if (!doc) return;
  await maybeSetGallery("cateringPage", doc.hasGallery, cateringGalleryImages, "Catering");
}

// ---------------------------------------------------------------------------
// 3. eventDecorationPage
// ---------------------------------------------------------------------------

async function migrateEventDecorationPage() {
  console.log("\n== Event decoration page ==");
  const doc = await client.fetch<{
    hasStylingImage: boolean;
    hasSuitableForAriaLabel: boolean;
    hasGallery: boolean;
  } | null>(`*[_id == "eventDecorationPage"][0]{
    "hasStylingImage": defined(stylingImage.asset),
    "hasSuitableForAriaLabel": defined(suitableForAriaLabel),
    "hasGallery": defined(gallery),
  }`);
  if (!doc) {
    console.warn("  eventDecorationPage document not found — skipping.");
    return;
  }

  await maybeSetImage(
    "eventDecorationPage",
    "stylingImage",
    doc.hasStylingImage,
    "/images/decoration/decoration-entrance-arch.png",
    "Decorated entrance arch for an event",
    "Styling image",
  );

  await maybeSetField(
    "eventDecorationPage",
    "suitableForAriaLabel",
    doc.hasSuitableForAriaLabel,
    tri("Suitable decoration formats", "Egnede dekorationsformater", "Придатні формати декору"),
    "Suitable-for aria label",
  );

  await maybeSetGallery("eventDecorationPage", doc.hasGallery, eventDecorationGalleryImages, "Event decoration");
}

// ---------------------------------------------------------------------------
// 4. hostAtRorumPage
// ---------------------------------------------------------------------------

async function migrateHostAtRorumPage() {
  console.log("\n== Host at RORUM page ==");
  const doc = await client.fetch<{
    hasSessionImage: boolean;
    hasInquiryIntro: boolean;
    hasGallery: boolean;
    labels: { key?: string | null }[] | null;
  } | null>(`*[_id == "hostAtRorumPage"][0]{
    "hasSessionImage": defined(sessionImage.asset),
    "hasInquiryIntro": defined(inquiryIntro),
    "hasGallery": defined(gallery),
    labels[]{key},
  }`);
  if (!doc) {
    console.warn("  hostAtRorumPage document not found — skipping.");
    return;
  }

  await maybeSetImage(
    "hostAtRorumPage",
    "sessionImage",
    doc.hasSessionImage,
    "/images/private-meetings/private-meeting-room-10.png",
    "Hosted meeting room setup at RORUM",
    "Session image",
  );

  await maybeSetField(
    "hostAtRorumPage",
    "inquiryIntro",
    doc.hasInquiryIntro,
    triText(
      "Tell us the format, guest count, timing and what kind of atmosphere you need, and we will help you find the right package.",
      "Fortæl os om format, antal gæster, timing og hvilken stemning du ønsker, så hjælper vi dig med at finde den rette pakke.",
      "Розкажіть про формат, кількість гостей, час і бажану атмосферу, і ми допоможемо підібрати правильний пакет.",
    ),
    "Inquiry intro",
  );

  await maybeSetLabels(
    "hostAtRorumPage",
    "labels",
    doc.labels,
    [
      { key: "packagesFooterCtaLabel", en: "Get in touch", da: "Kontakt os", uk: "Зв'яжіться з нами" },
      {
        key: "packagesFooterText",
        en: "with us to discuss your event and receive a personalized proposal.",
        da: "med os for at drøfte dit event og modtage et personligt tilbud.",
        uk: "з нами, щоб обговорити вашу подію та отримати індивідуальну пропозицію.",
      },
      { key: "selectPackageCta", en: "Select Package", da: "Vælg pakke", uk: "Обрати пакет" },
      {
        key: "requestProcessAriaLabel",
        en: "Host at RORUM request process",
        da: "Proces for at booke RORUM",
        uk: "Процес запиту на проведення в RORUM",
      },
    ],
    "Additional labels",
  );

  await maybeSetGallery("hostAtRorumPage", doc.hasGallery, hostAtRorumGalleryImages, "Host at RORUM");
}

// ---------------------------------------------------------------------------
// 5. eventsPage — empty-state fields
// ---------------------------------------------------------------------------

async function migrateEventsPage() {
  console.log("\n== Events (listing) page ==");
  const doc = await client.fetch<{ labels: { key?: string | null }[] | null } | null>(
    `*[_id == "eventsPage"][0]{labels[]{key}}`,
  );
  if (!doc) {
    console.warn("  eventsPage document not found — skipping.");
    return;
  }
  await maybeSetLabels(
    "eventsPage",
    "labels",
    doc.labels,
    [
      {
        key: "emptyStateTitle",
        en: "No events match your filters.",
        da: "Ingen events matcher dine filtre.",
        uk: "Жодна подія не відповідає обраним фільтрам.",
      },
      {
        key: "emptyStateText",
        en: "Try changing the date, language, price or availability.",
        da: "Prøv at ændre dato, sprog, pris eller tilgængelighed.",
        uk: "Спробуйте змінити дату, мову, ціну або доступність.",
      },
    ],
    "Additional labels",
  );
}

// ---------------------------------------------------------------------------
// 6. navigation — mobile-menu labels (languageSwitcherLabel already exists)
// ---------------------------------------------------------------------------

async function migrateNavigation() {
  console.log("\n== Navigation ==");
  const doc = await client.fetch<{ labels: { key?: string | null }[] | null } | null>(
    `*[_id == "navigation"][0]{labels[]{key}}`,
  );
  if (!doc) {
    console.warn("  navigation document not found — skipping.");
    return;
  }
  await maybeSetLabels(
    "navigation",
    "labels",
    doc.labels,
    [
      { key: "homeLabel", en: "Home", da: "Hjem", uk: "Головна" },
      { key: "openMenuLabel", en: "Open menu", da: "Åbn menu", uk: "Відкрити меню" },
      { key: "closeMenuLabel", en: "Close menu", da: "Luk menu", uk: "Закрити меню" },
    ],
    "Additional labels",
  );
}

// ---------------------------------------------------------------------------
// 7. eventMessages (new singleton)
// ---------------------------------------------------------------------------

async function migrateEventMessages() {
  console.log("\n== Shared event labels (eventMessages) ==");
  if (!DRY_RUN) {
    await client.createIfNotExists({ _id: "eventMessages", _type: "eventMessages" });
  } else {
    console.log("  (would create the eventMessages document if it doesn't exist yet.)");
  }
  const doc = await client.fetch<{ labels: { key?: string | null }[] | null } | null>(
    `*[_id == "eventMessages"][0]{labels[]{key}}`,
  );

  await maybeSetLabels(
    "eventMessages",
    "labels",
    doc?.labels,
    [
      { key: "eventOverviewHeading", en: "Event Overview", da: "Oversigt over arrangementet", uk: "Огляд події" },
      { key: "whatToExpectHeading", en: "What to Expect", da: "Hvad du kan forvente", uk: "Чого очікувати" },
      { key: "practicalDetailsHeading", en: "Practical Details", da: "Praktiske oplysninger", uk: "Практична інформація" },
      { key: "shareWithFriendsHeading", en: "Share with Friends", da: "Del med venner", uk: "Поділитися з друзями" },
      { key: "dateLabel", en: "Date", da: "Dato", uk: "Дата" },
      { key: "timeLabel", en: "Time", da: "Tid", uk: "Час" },
      { key: "locationLabel", en: "Location", da: "Sted", uk: "Місце" },
      { key: "priceLabel", en: "Price", da: "Pris", uk: "Ціна" },
      { key: "languageRowLabel", en: "Event language", da: "Sprog", uk: "Мова події" },
      { key: "durationRowLabel", en: "Duration", da: "Varighed", uk: "Тривалість" },
      { key: "availabilityRowLabel", en: "Availability", da: "Tilgængelighed", uk: "Доступність" },
      { key: "arrivalRowLabel", en: "Arrival", da: "Ankomst", uk: "Прибуття" },
      { key: "soldOutLabel", en: "Sold Out", da: "Udsolgt", uk: "Розпродано" },
      {
        key: "ticketComingSoonLabel",
        en: "Ticket link coming soon",
        da: "Billetlink kommer snart",
        uk: "Посилання на квитки з'явиться незабаром",
      },
      { key: "buyTicketLabel", en: "Buy Ticket", da: "Køb billet", uk: "Купити квиток" },
      {
        key: "timeToBeAnnouncedLabel",
        en: "Time to be announced",
        da: "Tidspunkt annonceres senere",
        uk: "Час буде оголошено пізніше",
      },
      { key: "spotsLeftOne", en: "spot left", da: "plads tilbage", uk: "місце залишилось" },
      { key: "spotsLeftOther", en: "spots left", da: "pladser tilbage", uk: "місць залишилось" },
      { key: "viewEventAriaPrefix", en: "View event:", da: "Se event:", uk: "Переглянути подію:" },
      { key: "eventImageAriaSuffix", en: "event image", da: "eventbillede", uk: "зображення події" },
      {
        key: "shareDefaultText",
        en: "Join this event at RORUM",
        da: "Deltag i dette event hos RORUM",
        uk: "Долучайтеся до цієї події в RORUM",
      },
      { key: "linkCopiedMessage", en: "Link copied", da: "Link kopieret", uk: "Посилання скопійовано" },
      {
        key: "instagramCopyMessage",
        en: "Event link copied! You can now paste it into Instagram Stories, DMs, or your bio.",
        da: "Eventlink kopieret! Du kan nu indsætte det i Instagram Stories, DM'er eller din bio.",
        uk: "Посилання на подію скопійовано! Тепер ви можете вставити його в Instagram Stories, DM або біо.",
      },
    ],
    "Shared event labels",
  );
}

// ---------------------------------------------------------------------------
// 8. formMessages — additional fields (CV upload / volunteer / contact)
// ---------------------------------------------------------------------------

async function migrateFormMessages() {
  console.log("\n== Shared form messages (additions) ==");
  const doc = await client.fetch<{ extraLabels: { key?: string | null }[] | null } | null>(
    `*[_id == "formMessages"][0]{extraLabels[]{key}}`,
  );
  if (!doc) {
    console.warn("  formMessages document not found — skipping.");
    return;
  }

  await maybeSetLabels(
    "formMessages",
    "extraLabels",
    doc.extraLabels,
    [
      {
        key: "invalidPhoneMessage",
        en: "Please enter a valid phone number.",
        da: "Indtast venligst et gyldigt telefonnummer.",
        uk: "Будь ласка, введіть дійсний номер телефону.",
      },
      { key: "fileRequiredMessage", en: "Please upload your CV.", da: "Upload venligst dit CV.", uk: "Будь ласка, завантажте резюме." },
      {
        key: "fileTypeMessage",
        en: "Please upload a PDF, DOC, or DOCX file.",
        da: "Upload venligst en PDF-, DOC- eller DOCX-fil.",
        uk: "Будь ласка, завантажте файл у форматі PDF, DOC або DOCX.",
      },
      {
        key: "fileSizeMessage",
        en: "Please keep your file under 10 MB.",
        da: "Filen må maksimalt fylde 10 MB.",
        uk: "Розмір файлу не має перевищувати 10 МБ.",
      },
      { key: "uploadCvLabel", en: "Upload your CV", da: "Upload dit CV", uk: "Завантажте резюме" },
      { key: "removeFileLabel", en: "Remove file", da: "Fjern fil", uk: "Видалити файл" },
      { key: "shortMessageLabel", en: "Short message", da: "Kort besked", uk: "Коротке повідомлення" },
      { key: "sendingLabel", en: "Sending...", da: "Sender...", uk: "Надсилання..." },
      { key: "applicationSentLabel", en: "Application Sent", da: "Ansøgning sendt", uk: "Заявку надіслано" },
      { key: "sendApplicationLabel", en: "Send Application", da: "Send ansøgning", uk: "Надіслати заявку" },
      { key: "submitCvLabel", en: "Submit CV", da: "Send CV", uk: "Надіслати резюме" },
      {
        key: "formNotConfiguredMessage",
        en: "Applications are temporarily unavailable because Formspree has not been configured yet. Please try again later.",
        da: "Ansøgninger er midlertidigt utilgængelige, fordi Formspree endnu ikke er konfigureret. Prøv igen senere.",
        uk: "Заявки тимчасово недоступні, оскільки Formspree ще не налаштовано. Спробуйте пізніше.",
      },
      {
        key: "contactFormMessagePlaceholder",
        en: "Tell us a little about your request, timing and preferences.",
        da: "Fortæl os lidt om din forespørgsel, tidspunkt og præferencer.",
        uk: "Розкажіть трохи про ваш запит, час і побажання.",
      },
      {
        key: "contactFallbackNote",
        en: "Contact us directly at",
        da: "Kontakt os direkte på",
        uk: "Зв'яжіться з нами напряму за адресою",
      },
    ],
    "Additional shared labels",
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Phase 3a content migration (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);

  await migrateCateringPage();
  await migrateCateringGallery();
  await migrateCateringMenuExamplesPage();
  await migrateEventDecorationPage();
  await migrateHostAtRorumPage();
  await migrateEventsPage();
  await migrateNavigation();
  await migrateEventMessages();
  await migrateFormMessages();

  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete.` +
      (DRY_RUN ? " Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write." : ""),
  );
}

main().catch((error) => {
  console.error("Phase 3a content migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
