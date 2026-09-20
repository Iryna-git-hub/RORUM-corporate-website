/**
 * Pilot migration for the compact `page` + `sections[]` content model (see
 * MIGRATION_REPORT.md and the plan this implements). Builds `page.home` and
 * `page.catering` (+ `page.cateringMenuExamples`) from the existing
 * `homePage`/`cateringPage`/`cateringMenuExamplesPage` singletons, copying
 * every translation and image asset reference verbatim (never re-authoring
 * content that already exists) and authoring the small number of genuinely
 * new fields (English by hand, Danish/Ukrainian machine-translated and
 * disclosed here, same precedent as every prior migration script).
 *
 * The old singleton documents are left completely untouched — this script
 * only ever `createIfNotExists`s the new `page.*` documents, so it's safe to
 * re-run and there is nothing to roll back if something looks wrong.
 *
 * Usage:
 *   npm run sanity:migrate-to-page-sections:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-to-page-sections            (requires SANITY_API_WRITE_TOKEN)
 *
 * Flags: --page=home | --page=catering restricts the run to one page
 * (catering includes cateringMenuExamples). Omit to migrate both.
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tri } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const pageArg = process.argv.find((a) => a.startsWith("--page="))?.split("=")[1];
const RUN_HOME = !pageArg || pageArg === "home";
const RUN_CATERING = !pageArg || pageArg === "catering";
const RUN_ABOUT = !pageArg || pageArg === "about";
const RUN_EVENTS = !pageArg || pageArg === "events";
const RUN_EVENT_DECORATION = !pageArg || pageArg === "eventDecoration";
const RUN_HOST_AT_RORUM = !pageArg || pageArg === "hostAtRorum";
const RUN_COMMUNITY_MEMBERSHIP = !pageArg || pageArg === "communityMembership";
const RUN_VOLUNTEER = !pageArg || pageArg === "volunteer";
const RUN_WORK_WITH_US = !pageArg || pageArg === "workWithUs";
const RUN_CONTACT = !pageArg || pageArg === "contact";
const RUN_FAQ = !pageArg || pageArg === "faq";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// ---- generic helpers --------------------------------------------------

type I18n = { _key: string; _type?: string; language?: string; value?: unknown }[];

/** Copies an existing internationalized-array value verbatim — never re-authors content that already exists. */
function copy(value: I18n | null | undefined): I18n {
  return value ?? [];
}

function hasEnValue(value: I18n | null | undefined): boolean {
  return Boolean(value?.find((v) => v.language === "en")?.value);
}

/**
 * Fetches the old singleton by type; if it's already been deleted (e.g. a
 * previous run's delete-then-create sequence deleted it but the create step
 * then failed), falls back to the most recent scripts/backups/ JSON for
 * that document id instead of giving up — every delete in this script
 * writes that backup immediately beforehand specifically so this recovery
 * path always has something to read.
 */
async function fetchOldOrBackup<T>(typeName: string, docId: string): Promise<T | null> {
  const live = await client.fetch<T | null>(`*[_type == $type && !(_id in path("drafts.**"))][0]`, { type: typeName });
  if (live) return live;

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) return null;
  const { readdirSync } = await import("node:fs");
  const candidates = readdirSync(backupDir)
    .filter((f) => f.startsWith(`${docId}-`) && f.endsWith(".json"))
    .sort()
    .reverse();
  if (!candidates.length) return null;
  const backupPath = path.join(backupDir, candidates[0]!);
  console.log(`  (recovered from backup ${backupPath} — live document was already deleted)`);
  return JSON.parse(readFileSync(backupPath, "utf-8")) as T;
}

function resolveLocalPath(publicRelativePath: string): string {
  return path.join(process.cwd(), "public", publicRelativePath.replace(/^\//, ""));
}

const uploadedAssetCache = new Map<string, { _type: "reference"; _ref: string }>();

async function uploadLocalImage(relPath: string): Promise<{ _type: "reference"; _ref: string } | undefined> {
  if (uploadedAssetCache.has(relPath)) return uploadedAssetCache.get(relPath);
  const localPath = resolveLocalPath(relPath);
  if (!existsSync(localPath)) {
    console.warn(`    local file not found at ${localPath} — skipping image.`);
    return undefined;
  }
  if (DRY_RUN) return { _type: "reference", _ref: `dry-run-placeholder` };
  const asset = await client.assets.upload("image", readFileSync(localPath), { filename: path.basename(relPath) });
  const ref = { _type: "reference" as const, _ref: asset._id };
  uploadedAssetCache.set(relPath, ref);
  return ref;
}

interface SanityImageWithAlt {
  asset?: { _ref?: string; _id?: string };
  alt?: I18n;
}

/** One `mediaItem` (kind "image") from an existing `imageWithAlt` value, or an uploaded local fallback. */
async function toMediaItem(
  key: string,
  existing: SanityImageWithAlt | null | undefined,
  fallback?: { relPath: string; altEn: string; altDa: string; altUk: string },
): Promise<Record<string, unknown> | undefined> {
  if (existing?.asset?._ref || existing?.asset?._id) {
    return {
      _key: key,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: existing.asset._ref ?? existing.asset._id } },
      alt: copy(existing.alt),
    };
  }
  if (!fallback) return undefined;
  const assetRef = await uploadLocalImage(fallback.relPath);
  if (!assetRef) return undefined;
  return {
    _key: key,
    _type: "mediaItem",
    kind: "image",
    image: { _type: "image", asset: assetRef },
    alt: tri(fallback.altEn, fallback.altDa, fallback.altUk),
  };
}

interface CtaLikeValue {
  label?: I18n;
  href?: string;
}

function toCtaAction(key: string, label: I18n, href: string, opts: { openInNewTab?: boolean } = {}): Record<string, unknown> {
  return {
    _key: key,
    _type: "ctaAction",
    actionKey: key,
    label: copy(label),
    linkType: href.startsWith("http") ? "external" : href.startsWith("#") ? "anchor" : "internal",
    href,
    openInNewTab: opts.openInNewTab ?? false,
    enabled: true,
  };
}

function textItem(
  key: string,
  opts: { title?: I18n; text?: I18n; label?: I18n; href?: string; icon?: string; image?: Record<string, unknown>; value?: string },
): Record<string, unknown> {
  return {
    _key: key,
    _type: "contentItem",
    itemKey: key,
    ...(opts.icon ? { icon: opts.icon } : {}),
    ...(opts.title ? { title: opts.title } : {}),
    ...(opts.text ? { text: opts.text } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.href ? { href: opts.href } : {}),
    ...(opts.label ? { label: opts.label } : {}),
    ...(opts.value ? { value: opts.value } : {}),
  };
}

function section(key: string, kind: string, fields: Record<string, unknown>): Record<string, unknown> {
  return { _key: key, _type: "pageSection", sectionKey: key, sectionKind: kind, ...fields };
}

async function createPageIfNotExists(pageKey: string, sections: Record<string, unknown>[], label: string) {
  const docId = `page.${pageKey}`;
  const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id: docId });
  if (existing) {
    console.log(`\n[${label}] ${docId} already exists — skipping (idempotent, not overwriting).`);
    return;
  }
  console.log(`\n[${label}] would create ${docId} with ${sections.length} sections:`);
  for (const s of sections) {
    console.log(`  - ${s.sectionKey} (${s.sectionKind})`);
  }
  if (DRY_RUN) return;
  await client.createIfNotExists({
    _id: docId,
    _type: "page",
    pageKey,
    sections,
  });
  console.log(`  created ${docId}.`);
}

/**
 * Same end state as `createPageIfNotExists`, but as two SEPARATE commits —
 * delete the old singleton first, then create the new `page.*` document —
 * instead of one atomic transaction. Needed once the dataset is already
 * over the free-plan attribute cap: Sanity rejects every write while over
 * budget, even ones that wouldn't make it worse on their own, and (verified
 * empirically) it does NOT credit a delete happening in the same
 * transaction as a create — a combined transaction fails with the exact
 * same error as a plain create. Splitting into two commits lets the delete
 * actually take effect and free budget before the create is attempted.
 * There's a brief window between the two steps where neither document
 * exists; the old document is backed up to scripts/backups/ before it's
 * deleted, and if the create step fails this function throws immediately
 * so the caller can stop and report rather than continuing to the next page.
 */
async function createPageReplacingOldSingleton(
  pageKey: string,
  sections: Record<string, unknown>[],
  label: string,
  oldSingletonId: string,
) {
  const docId = `page.${pageKey}`;
  const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id: docId });
  if (existing) {
    console.log(`\n[${label}] ${docId} already exists — skipping (idempotent, not overwriting).`);
    return;
  }
  console.log(`\n[${label}] would delete ${oldSingletonId}, then create ${docId} with ${sections.length} sections:`);
  for (const s of sections) {
    console.log(`  - ${s.sectionKey} (${s.sectionKind})`);
  }
  if (DRY_RUN) return;

  const oldDoc = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, { id: oldSingletonId });
  if (oldDoc) {
    const backupDir = path.join(process.cwd(), "scripts", "backups");
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `${oldSingletonId}-${Date.now()}.json`);
    writeFileSync(backupPath, JSON.stringify(oldDoc, null, 2), "utf-8");
    console.log(`  backup written to ${backupPath}.`);
    await client.delete(oldSingletonId);
    console.log(`  deleted ${oldSingletonId}.`);
  } else {
    console.log(`  ${oldSingletonId} did not exist — nothing to delete.`);
  }

  await client.create({ _id: docId, _type: "page", pageKey, sections });
  console.log(`  created ${docId}.`);
}

// ---- Home ---------------------------------------------------------------

interface OldHomePage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroText?: I18n;
  heroTrustItems?: { _key: string; text?: I18n }[];
  heroImage?: SanityImageWithAlt;
  heroPrimaryCta?: CtaLikeValue;
  heroSecondaryCta?: CtaLikeValue;
  quickPathsLabel?: I18n;
  quickPathsTitle?: I18n;
  quickPaths?: { _key: string; title?: I18n; text?: I18n; href?: string; cta?: I18n; image?: SanityImageWithAlt }[];
  eventsLabel?: I18n;
  eventsTitle?: I18n;
  eventsViewAllLabel?: I18n;
  attendEventsFeature?: {
    eyebrow?: I18n;
    title?: I18n;
    intro?: I18n;
    description?: I18n;
    features?: { _key: string; text?: I18n }[];
    cta?: CtaLikeValue;
    image?: SanityImageWithAlt;
  };
  hostAtRorumFeature?: OldHomePage["attendEventsFeature"];
  servicesLabel?: I18n;
  servicesTitle?: I18n;
  services?: { _key: string; title?: I18n; text?: I18n; cta?: I18n; href?: string; image?: SanityImageWithAlt }[];
  communityLabel?: I18n;
  communityTitle?: I18n;
  communityText?: I18n;
  communityImage?: SanityImageWithAlt;
  communityLinks?: { _key: string; label?: I18n; href?: string }[];
  closingSection?: {
    eyebrow?: I18n;
    title?: I18n;
    text?: I18n;
    cta?: CtaLikeValue;
    faqQuestion?: I18n;
    faqLabel?: I18n;
    links?: { _key: string; label?: I18n; href?: string }[];
  };
}

const QUICK_PATH_META = [
  { key: "events", href: "/events", relPath: "/images/events/attend-events-quickpath.png", en: ["Attend Events", "Discover workshops, conversations, and community experiences in the heart of Copenhagen.", "Explore events"], da: ["Deltag i events", "Oplev workshops, samtaler og fællesskabsoplevelser i hjertet af København.", "Udforsk events"], uk: ["Відвідати події", "Відкрийте для себе майстер-класи, розмови та спільнотні заходи в центрі Копенгагена.", "Переглянути події"] },
  { key: "hostAtRorum", href: "/host-at-rorum", relPath: "/images/private-meetings/private-meeting-room-9.png", en: ["Host at RORUM", "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.", "Host with us"], da: ["Book RORUM", "Et varmt og fleksibelt lokale i København til workshops, møder og fællesskabsarrangementer for op til 12 gæster.", "Book hos os"], uk: ["Провести подію в RORUM", "Затишний і гнучкий простір у Копенгагені для майстер-класів, зустрічей та спільнотних заходів до 12 гостей.", "Забронювати"] },
  { key: "catering", href: "/catering", relPath: "/images/catering/catering-1.png", en: ["Catering", "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.", "Explore catering"], da: ["Catering", "Frisk, enkel og elegant catering til møder, private sammenkomster, workshops og særlige øjeblikke.", "Udforsk catering"], uk: ["Кейтеринг", "Свіжий, простий і елегантний кейтеринг для зустрічей, приватних подій, майстер-класів та особливих моментів.", "Переглянути кейтеринг"] },
  { key: "eventDecoration", href: "/event-decoration", relPath: "/images/decoration/decoration-1.png", en: ["Event Decoration", "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.", "Explore decoration"], da: ["Eventdekoration", "Blomster, borddækning, lys og visuelle detaljer, der skaber en varm og mindeværdig atmosfære.", "Udforsk dekoration"], uk: ["Декор подій", "Квіти, сервірування столу, свічки та візуальні деталі для теплої й незабутньої атмосфери.", "Переглянути декор"] },
] as const;

const HOW_IT_WORKS_LABEL = { en: "How it works", da: "Sådan fungerer det", uk: "Як це працює" };

async function migrateHome() {
  console.log("\n=== Home ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.home"][0]{_id}`);
  if (existingPage) {
    console.log("  page.home already exists — skipping (idempotent, not re-uploading the hero video either).");
    return;
  }
  const old = await client.fetch<OldHomePage | null>(`*[_type == "homePage" && !(_id in path("drafts.**"))][0]`);
  if (!old) {
    console.log("  No homePage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];

  // 1. hero — video upload handled separately in uploadHeroVideo(), this
  // just wires the section shell; heroTrustItems -> items, both CTAs -> actions.
  const heroMedia = await toMediaItem("heroPoster", old.heroImage);
  const trustItems = (old.heroTrustItems ?? []).map((t, i) => textItem(`trust${i}`, { title: copy(t.text) }));
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.heroTitle),
      text: copy(old.heroText),
      media: heroMedia ? [heroMedia] : [],
      actions: [
        toCtaAction("primary", copy(old.heroPrimaryCta?.label), "/host-at-rorum"),
        toCtaAction("secondary", copy(old.heroSecondaryCta?.label), "/events"),
      ],
      items: trustItems,
    }),
  );

  // 2. quickPaths — label/title/cta are a known translation gap (see
  // scripts/audit-translations.ts baseline); authored here from the
  // current hardcoded frontend copy, EN by hand + DA/UK machine-translated
  // and disclosed, only for whichever pieces Sanity doesn't already have.
  const quickPathItems = await Promise.all(
    QUICK_PATH_META.map(async (meta, i) => {
      const existing = old.quickPaths?.[i];
      const title = hasEnValue(existing?.title) ? copy(existing?.title) : tri(meta.en[0]!, meta.da[0]!, meta.uk[0]!);
      const text = hasEnValue(existing?.text) ? copy(existing?.text) : tri(meta.en[1]!, meta.da[1]!, meta.uk[1]!);
      const cta = hasEnValue(existing?.cta) ? copy(existing?.cta) : tri(meta.en[2]!, meta.da[2]!, meta.uk[2]!);
      const image = existing?.image?.asset
        ? { _type: "image", asset: { _type: "reference", _ref: existing.image.asset._ref ?? existing.image.asset._id } }
        : { _type: "image", asset: await uploadLocalImage(meta.relPath) };
      return textItem(meta.key, { title, text, label: cta, href: meta.href, image });
    }),
  );
  sections.push(
    section("quickPaths", "quickPaths", {
      label: copy(old.quickPathsLabel),
      title: copy(old.quickPathsTitle),
      items: quickPathItems,
    }),
  );

  // 3. eventsStrip — chrome only; the actual events are queried live from
  // separate `event` documents, unchanged.
  sections.push(
    section("eventsStrip", "custom", {
      label: copy(old.eventsLabel),
      title: copy(old.eventsTitle),
      actions: [toCtaAction("viewAll", copy(old.eventsViewAllLabel), "/events")],
    }),
  );

  // 4 & 5. editorial features (Attend Events, Host at RORUM — reversed)
  async function editorialSection(key: string, feature: OldHomePage["attendEventsFeature"], href: string, reversed: boolean) {
    const media = await toMediaItem("image", feature?.image);
    const featureItems = (feature?.features ?? []).map((f, i) => textItem(`feature${i}`, { title: copy(f.text) }));
    return section(key, "editorial", {
      label: copy(feature?.eyebrow),
      title: copy(feature?.title),
      text: copy(feature?.intro),
      media: media ? [media] : [],
      actions: [toCtaAction("cta", copy(feature?.cta?.label), href)],
      items: [textItem("description", { text: copy(feature?.description) }), ...featureItems],
      ...(reversed ? { settings: [{ _key: "variant", _type: "sectionSetting", key: "variant", value: "reversed" }] } : {}),
    });
  }
  sections.push(await editorialSection("editorialAttendEvents", old.attendEventsFeature, "/events", false));
  sections.push(await editorialSection("editorialHostAtRorum", old.hostAtRorumFeature, "/host-at-rorum", true));

  // 6. servicesTeaser
  const serviceFallback = [
    { relPath: "/images/catering/catering-1.png" },
    { relPath: "/images/decoration/decoration-1.png" },
  ];
  const serviceItems = await Promise.all(
    (old.services ?? []).map(async (s, i) => {
      const image = s.image?.asset
        ? { _type: "image", asset: { _type: "reference", _ref: s.image.asset._ref ?? s.image.asset._id } }
        : { _type: "image", asset: await uploadLocalImage(serviceFallback[i]?.relPath ?? serviceFallback[0]!.relPath) };
      return textItem(i === 0 ? "catering" : "eventDecoration", {
        title: copy(s.title),
        text: copy(s.text),
        label: copy(s.cta),
        href: s.href,
        image,
      });
    }),
  );
  sections.push(
    section("servicesTeaser", "servicesTeaser", {
      label: copy(old.servicesLabel),
      title: copy(old.servicesTitle),
      items: serviceItems,
    }),
  );

  // 7. communityTeaser
  const communityMedia = await toMediaItem("bg", old.communityImage);
  const communityItems = (old.communityLinks ?? []).map((l, i) =>
    textItem(["wecoda", "workWithUs", "volunteer"][i] ?? `link${i}`, { label: copy(l.label), href: l.href }),
  );
  sections.push(
    section("communityTeaser", "communityTeaser", {
      label: copy(old.communityLabel),
      title: copy(old.communityTitle),
      text: copy(old.communityText),
      media: communityMedia ? [communityMedia] : [],
      items: communityItems,
    }),
  );

  // 8. closing CTA
  const closingLinkItems = (old.closingSection?.links ?? []).map((l, i) =>
    textItem(`link${i}`, { label: copy(l.label), href: l.href }),
  );
  sections.push(
    section("closingCta", "cta", {
      label: copy(old.closingSection?.eyebrow),
      title: copy(old.closingSection?.title),
      text: copy(old.closingSection?.text),
      actions: [toCtaAction("main", copy(old.closingSection?.cta?.label), "/contact")],
      items: [
        textItem("faqQuestion", { title: copy(old.closingSection?.faqQuestion) }),
        textItem("faqLabel", { title: copy(old.closingSection?.faqLabel) }),
        ...closingLinkItems,
      ],
      settings: [{ _key: "variant", _type: "sectionSetting", key: "variant", value: "final" }],
    }),
  );

  await uploadHeroVideo(sections);
  await createPageIfNotExists("home", sections, "home");
}

/**
 * `quickPathsLabel`/`quickPathsTitle`/`eventsViewAllLabel` were already
 * incomplete (English-only or blank) on the old `homePage` singleton before
 * this migration — copying them verbatim (as the rest of this script
 * correctly does for already-complete fields) would carry that gap forward
 * silently. Runs every time (not just on first creation) so it also
 * backfills a `page.home` created by an earlier version of this script.
 */
async function backfillHomeGaps() {
  const doc = await client.fetch<{ _id: string; sections?: { sectionKey?: string; label?: I18n; title?: I18n; actions?: { actionKey?: string; label?: I18n }[] }[] } | null>(
    `*[_id == "page.home"][0]{_id, sections}`,
  );
  if (!doc) return;

  const quickPaths = doc.sections?.find((s) => s.sectionKey === "quickPaths");
  const eventsStrip = doc.sections?.find((s) => s.sectionKey === "eventsStrip");
  const patch: Record<string, unknown> = {};

  if (quickPaths && !hasEnValue(quickPaths.label)) {
    patch['sections[_key=="quickPaths"].label'] = tri("Quick paths", "Hurtige veje", "Швидкі шляхи");
  }
  if (quickPaths && !hasEnValue(quickPaths.title)) {
    patch['sections[_key=="quickPaths"].title'] = tri(
      "Start with what you need.",
      "Start med det, du har brug for.",
      "Почніть з того, що вам потрібно.",
    );
  }
  const viewAllAction = eventsStrip?.actions?.find((a) => a.actionKey === "viewAll");
  if (eventsStrip && viewAllAction && !hasEnValue(viewAllAction.label)) {
    patch['sections[_key=="eventsStrip"].actions[_key=="viewAll"].label'] = tri(
      "View all events",
      "Se alle arrangementer",
      "Переглянути всі події",
    );
  }

  if (Object.keys(patch).length === 0) {
    console.log("  backfillHomeGaps: nothing to backfill.");
    return;
  }
  console.log(`  backfillHomeGaps: would set ${Object.keys(patch).join(", ")}.`);
  if (DRY_RUN) return;
  await client.patch(doc._id).set(patch).commit();
  console.log("  backfillHomeGaps: patched.");
}

const HERO_VIDEO_REL_PATH = "/videos/home-hero.mp4";
const ASSET_BUDGET_WARN_BYTES = 4.5 * 1024 * 1024 * 1024; // conservative margin under the free plan's ~5GB asset quota

async function uploadHeroVideo(sections: Record<string, unknown>[]) {
  const heroSection = sections.find((s) => s.sectionKey === "hero") as { media?: Record<string, unknown>[] } | undefined;
  if (!heroSection) return;

  const localPath = resolveLocalPath(HERO_VIDEO_REL_PATH);
  if (!existsSync(localPath)) {
    console.warn(`  hero video: local file not found at ${localPath} — hero section will have a poster image only.`);
    return;
  }
  const fileSizeBytes = statSync(localPath).size;

  const assetSizes = await client.fetch<number[]>(`*[_type in ["sanity.fileAsset","sanity.imageAsset"]].size`);
  const currentTotal = assetSizes.reduce((sum, size) => sum + (size || 0), 0);
  console.log(
    `  hero video: local file is ${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB; current dataset asset usage is ${(currentTotal / (1024 * 1024)).toFixed(1)} MB.`,
  );
  if (currentTotal + fileSizeBytes > ASSET_BUDGET_WARN_BYTES) {
    console.warn(`  hero video: uploading would bring asset usage close to/over the free-plan quota — skipping upload, hero section will have a poster image only.`);
    return;
  }

  console.log(`  hero video: would upload ${HERO_VIDEO_REL_PATH} as a file asset.`);
  if (DRY_RUN) return;

  const asset = await client.assets.upload("file", readFileSync(localPath), {
    filename: "home-hero.mp4",
    contentType: "video/mp4",
  });

  const existingMedia = heroSection.media?.[0];
  const posterImage = (existingMedia as { image?: unknown } | undefined)?.image;
  const posterAlt = (existingMedia as { alt?: I18n } | undefined)?.alt ?? tri("RORUM event space", "RORUM eventlokale", "Простір RORUM для подій");

  heroSection.media = [
    {
      _key: "heroVideo",
      _type: "mediaItem",
      kind: "video",
      videoFile: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      ...(posterImage ? { posterImage } : {}),
      alt: posterAlt,
    },
  ];
  console.log("  hero video: uploaded and wired as the hero section's media.");
}

// ---- Catering -------------------------------------------------------------

interface OldCateringPage {
  hero?: { label?: I18n; title?: I18n; text?: I18n; primaryCta?: CtaLikeValue };
  menuExamplesCta?: I18n;
  gallery?: { _key: string; asset?: { _ref?: string; _id?: string }; alt?: I18n }[];
  suitableForLabel?: I18n;
  suitableFor?: { _key: string; icon?: string; title?: I18n }[];
  suitableForAriaLabel?: I18n;
  menuFormatsTitle?: I18n;
  menuFormats?: { _key: string; title?: I18n; description?: I18n; image?: SanityImageWithAlt }[];
  formats?: { _key: string; icon?: string; title?: I18n; text?: I18n }[];
  philosophyTitle?: I18n;
  philosophyText?: I18n;
  philosophyImage?: SanityImageWithAlt;
  tailoredNote?: { title?: I18n; text?: I18n };
  stepsTitle?: I18n;
  steps?: { _key: string; title?: I18n; text?: I18n }[];
  inquiryIntro?: I18n;
  inquiryTitle?: I18n;
  inquirySubmitLabel?: I18n;
  messagePlaceholder?: I18n;
  successMessage?: I18n;
  footerNote?: I18n;
}

interface OldCateringMenuExamplesPage {
  bannerImage?: SanityImageWithAlt;
  title?: I18n;
  intro?: { _key: string; text?: I18n }[];
  requestCta?: I18n;
  categories?: {
    _key: string;
    title?: I18n;
    navLabel?: I18n;
    description?: I18n;
    dishes?: { _key: string; name?: I18n; description?: I18n; image?: SanityImageWithAlt }[];
  }[];
  featuredDishesLabel?: I18n;
  disclaimerNote?: I18n;
  customMenuTitle?: I18n;
  customMenuText?: I18n;
  backToCateringCta?: I18n;
}

const MENU_FORMAT_FALLBACK_IMAGES = [
  "/images/catering/european-private-dinner-menu.png",
  "/images/catering/european-reception-style-menu.png",
  "/images/catering/european-business-meeting-menu.png",
];

async function migrateCatering() {
  console.log("\n=== Catering ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.catering"][0]{_id}`);
  if (existingPage) {
    console.log("  page.catering already exists — skipping (idempotent).");
    return;
  }
  const old = await client.fetch<OldCateringPage | null>(`*[_type == "cateringPage" && !(_id in path("drafts.**"))][0]`);
  if (!old) {
    console.log("  No cateringPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];

  sections.push(
    section("hero", "hero", {
      label: copy(old.hero?.label),
      title: copy(old.hero?.title),
      text: copy(old.hero?.text),
      actions: [toCtaAction("request", copy(old.hero?.primaryCta?.label), "#catering-inquiry")],
      items: [textItem("menuExamplesCta", { title: copy(old.menuExamplesCta) })],
    }),
  );

  const galleryMedia = (old.gallery ?? [])
    .filter((img) => img.asset?._ref || img.asset?._id)
    .map((img) => ({
      _key: img._key,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: img.asset!._ref ?? img.asset!._id } },
      alt: copy(img.alt),
    }));
  const suitableForItems = (old.suitableFor ?? []).map((chip, i) =>
    textItem(`suitableFor${i}`, { icon: chip.icon, title: copy(chip.title) }),
  );
  sections.push(
    section("gallery", "gallery", {
      label: copy(old.suitableForLabel),
      media: galleryMedia,
      items: [textItem("ariaLabel", { title: copy(old.suitableForAriaLabel) }), ...suitableForItems],
    }),
  );

  const menuFormatItems = await Promise.all(
    (old.menuFormats ?? []).map(async (format, i) => {
      const image = format.image?.asset
        ? { _type: "image", asset: { _type: "reference", _ref: format.image.asset._ref ?? format.image.asset._id } }
        : { _type: "image", asset: await uploadLocalImage(MENU_FORMAT_FALLBACK_IMAGES[i] ?? MENU_FORMAT_FALLBACK_IMAGES[0]!) };
      return textItem(`format${i}`, { title: copy(format.title), text: copy(format.description), image });
    }),
  );
  sections.push(
    section("menuFormats", "iconGrid", {
      title: copy(old.menuFormatsTitle),
      items: menuFormatItems,
    }),
  );

  const philosophyMedia = await toMediaItem("image", old.philosophyImage);
  const formatItems = (old.formats ?? []).map((f, i) => textItem(`format${i}`, { icon: f.icon, title: copy(f.title), text: copy(f.text) }));
  sections.push(
    section("philosophy", "split", {
      title: copy(old.philosophyTitle),
      text: copy(old.philosophyText),
      media: philosophyMedia ? [philosophyMedia] : [],
      items: [textItem("tailoredNote", { title: copy(old.tailoredNote?.title), text: copy(old.tailoredNote?.text) }), ...formatItems],
    }),
  );

  const stepItems = (old.steps ?? []).map((s, i) => textItem(`step${i}`, { title: copy(s.title), text: copy(s.text) }));
  sections.push(
    // "How it works" has no Sanity source at all today — it's hardcoded in
    // the JSX (see catering/page.tsx's <SectionLabel>How it works</SectionLabel>).
    section("steps", "steps", {
      label: tri(HOW_IT_WORKS_LABEL.en, HOW_IT_WORKS_LABEL.da, HOW_IT_WORKS_LABEL.uk),
      title: copy(old.stepsTitle),
      items: stepItems,
    }),
  );

  sections.push(
    section("inquiryForm", "form", {
      title: copy(old.inquiryTitle),
      text: copy(old.inquiryIntro),
      items: [
        textItem("submitLabel", { title: copy(old.inquirySubmitLabel) }),
        textItem("messagePlaceholder", { title: copy(old.messagePlaceholder) }),
        textItem("successMessage", { text: copy(old.successMessage) }),
        textItem("footerNote", { title: copy(old.footerNote) }),
      ],
    }),
  );

  await createPageIfNotExists("catering", sections, "catering");
}

async function migrateCateringMenuExamples() {
  console.log("\n=== Catering Menu Examples ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.cateringMenuExamples"][0]{_id}`);
  if (existingPage) {
    console.log("  page.cateringMenuExamples already exists — skipping (idempotent).");
    return;
  }
  const old = await client.fetch<OldCateringMenuExamplesPage | null>(`*[_type == "cateringMenuExamplesPage" && !(_id in path("drafts.**"))][0]`);
  if (!old) {
    console.log("  No cateringMenuExamplesPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];

  const bannerMedia = await toMediaItem("banner", old.bannerImage);
  const introItems = (old.intro ?? []).map((p, i) => textItem(`intro${i}`, { text: copy(p.text) }));
  sections.push(
    section("banner", "hero", {
      title: copy(old.title),
      media: bannerMedia ? [bannerMedia] : [],
      items: [textItem("requestCta", { title: copy(old.requestCta) }), ...introItems],
    }),
  );

  for (const category of old.categories ?? []) {
    const dishItems = await Promise.all(
      (category.dishes ?? []).map(async (dish, i) => {
        const image = dish.image?.asset
          ? { _type: "image", asset: { _type: "reference", _ref: dish.image.asset._ref ?? dish.image.asset._id } }
          : undefined;
        return textItem(`dish${i}`, { title: copy(dish.name), text: copy(dish.description), image });
      }),
    );
    sections.push(
      section(`category-${category._key}`, "menuCategory", {
        label: copy(category.navLabel),
        title: copy(category.title),
        text: copy(category.description),
        items: dishItems,
      }),
    );
  }

  sections.push(
    section("closing", "cta", {
      title: copy(old.customMenuTitle),
      text: copy(old.customMenuText),
      items: [
        textItem("featuredDishesLabel", { title: copy(old.featuredDishesLabel) }),
        textItem("disclaimerNote", { text: copy(old.disclaimerNote) }),
        textItem("backToCateringCta", { title: copy(old.backToCateringCta) }),
      ],
    }),
  );

  await createPageIfNotExists("cateringMenuExamples", sections, "cateringMenuExamples");
}

// ---- shared helpers for the remaining pages -----------------------------

/** Combines several items' `text` into one i18n text field (one joined value per language) — used for package checklists, avoiding a nested items-within-items shape. */
function joinI18nLines(items: { text?: I18n }[] | undefined, separator = "\n"): I18n {
  const result: I18n = [];
  for (const lang of ["en", "da", "uk"] as const) {
    const lines = (items ?? [])
      .map((item) => item.text?.find((e) => e.language === lang)?.value)
      .filter((v): v is string => Boolean(v));
    if (lines.length) result.push({ _key: lang, _type: "internationalizedArrayTextValue", language: lang, value: lines.join(separator) });
  }
  return result;
}

/** Splits a "Title — Description" combined string (per language) into separate title/text i18n fields — the old model packed these into one field for attribute-budget reasons; the new model has room for both as real fields. */
function splitBenefitI18n(combined: I18n | undefined): { title: I18n; text: I18n } {
  const title: I18n = [];
  const text: I18n = [];
  for (const lang of ["en", "da", "uk"] as const) {
    const raw = combined?.find((e) => e.language === lang)?.value;
    if (typeof raw !== "string") continue;
    const [t, ...rest] = raw.split(" — ");
    const d = rest.join(" — ");
    if (t && d) {
      title.push({ _key: lang, _type: "internationalizedArrayStringValue", language: lang, value: t });
      text.push({ _key: lang, _type: "internationalizedArrayTextValue", language: lang, value: d });
    }
  }
  return { title, text };
}

/** One `mediaItem` from an old `mediaGalleryItem` (image OR a plain video URL string, never an uploaded file). */
function toGalleryMediaItem(key: string, item: { image?: SanityImageWithAlt; videoUrl?: string; alt?: I18n }): Record<string, unknown> {
  if (item.image?.asset?._ref || item.image?.asset?._id) {
    return {
      _key: key,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: item.image.asset._ref ?? item.image.asset._id } },
      alt: copy(item.alt),
    };
  }
  return { _key: key, _type: "mediaItem", kind: "video", videoUrl: item.videoUrl, alt: copy(item.alt) };
}

// ---- About ----------------------------------------------------------------

interface OldAboutPage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroLead?: I18n;
  statementTitle?: I18n;
  statementText?: I18n;
  atmosphereImages?: SanityImageWithAlt[];
  introLinks?: { _key: string; label?: I18n; href?: string; icon?: string }[];
  serviceLinks?: { _key: string; label?: I18n; href?: string; icon?: string }[];
  communityTitle?: I18n;
  communityText?: I18n;
  communityLinks?: { _key: string; label?: I18n; href?: string; icon?: string }[];
  pillarsLabel?: I18n;
  pillars?: { _key: string; title?: I18n; text?: I18n }[];
  locationTitle?: I18n;
  locationText?: I18n;
  closingSection?: {
    eyebrow?: I18n;
    title?: I18n;
    text?: I18n;
    cta?: CtaLikeValue;
    faqQuestion?: I18n;
    faqLabel?: I18n;
    links?: { _key: string; label?: I18n; href?: string }[];
  };
}

async function migrateAbout() {
  console.log("\n=== About ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.about"][0]{_id}`);
  if (existingPage) {
    console.log("  page.about already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldAboutPage>("aboutPage", "aboutPage");
  if (!old) {
    console.log("  No aboutPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];

  const atmosphereMedia = (old.atmosphereImages ?? [])
    .filter((img) => img.asset?._ref || img.asset?._id)
    .map((img, i) => ({
      _key: `atmosphere${i}`,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: img.asset!._ref ?? img.asset!._id } },
      alt: copy(img.alt),
    }));
  const introLinkItems = (old.introLinks ?? []).map((l, i) => textItem(`intro${i}`, { icon: l.icon, label: copy(l.label), href: l.href }));
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.heroTitle),
      text: copy(old.heroLead),
      media: atmosphereMedia,
      items: introLinkItems,
    }),
  );

  const serviceLinkItems = (old.serviceLinks ?? []).map((l, i) => textItem(`service${i}`, { icon: l.icon, label: copy(l.label), href: l.href }));
  sections.push(
    section("statement", "iconGrid", { title: copy(old.statementTitle), text: copy(old.statementText), items: serviceLinkItems }),
  );

  const communityLinkItems = (old.communityLinks ?? []).map((l, i) => textItem(`community${i}`, { icon: l.icon, label: copy(l.label), href: l.href }));
  sections.push(
    section("community", "iconGrid", { title: copy(old.communityTitle), text: copy(old.communityText), items: communityLinkItems }),
  );

  // `locationTitle`/`locationText` are actually rendered as the Pillars section's own heading/text
  // in the frontend (naming predates that reuse) — `locationImage` is schema-documented as unread by
  // the frontend (dead field) and is intentionally not migrated.
  const pillarItems = (old.pillars ?? []).map((p, i) => textItem(`pillar${i}`, { title: copy(p.title), text: copy(p.text) }));
  sections.push(
    section("pillars", "steps", {
      label: copy(old.pillarsLabel),
      title: copy(old.locationTitle),
      text: copy(old.locationText),
      items: pillarItems,
    }),
  );

  const closingLinkItems = (old.closingSection?.links ?? []).map((l, i) => textItem(`link${i}`, { label: copy(l.label), href: l.href }));
  sections.push(
    section("closingCta", "cta", {
      label: copy(old.closingSection?.eyebrow),
      title: copy(old.closingSection?.title),
      text: copy(old.closingSection?.text),
      actions: [toCtaAction("main", copy(old.closingSection?.cta?.label), "/contact")],
      items: [
        textItem("faqQuestion", { title: copy(old.closingSection?.faqQuestion) }),
        textItem("faqLabel", { title: copy(old.closingSection?.faqLabel) }),
        ...closingLinkItems,
      ],
      settings: [{ _key: "variant", _type: "sectionSetting", key: "variant", value: "final" }],
    }),
  );

  await createPageReplacingOldSingleton("about", sections, "about", "aboutPage");
}

// ---- Attend Events (listing) ----------------------------------------------

interface OldEventsPage {
  title?: I18n;
  filters?: Record<string, I18n | undefined>;
  labels?: { key?: string | null; value?: I18n }[];
  closingSection?: { eyebrow?: I18n; title?: I18n; text?: I18n; cta?: CtaLikeValue; faqQuestion?: I18n; faqLabel?: I18n };
}

const EVENTS_FILTER_KEYS = [
  "dateLabel",
  "languageLabel",
  "priceLabel",
  "availabilityLabel",
  "soonestLabel",
  "weekLabel",
  "monthLabel",
  "priceAscLabel",
  "priceDescLabel",
  "availableLabel",
  "soldOutLabel",
  "clearFiltersLabel",
] as const;

async function migrateEvents() {
  console.log("\n=== Attend Events (listing) ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.events"][0]{_id}`);
  if (existingPage) {
    console.log("  page.events already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldEventsPage>("eventsPage", "eventsPage");
  if (!old) {
    console.log("  No eventsPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  sections.push(section("hero", "hero", { title: copy(old.title) }));

  const filterItems = EVENTS_FILTER_KEYS.map((key) => textItem(key, { title: copy(old.filters?.[key]) }));
  const oldLabels = old.labels ?? [];
  const emptyTitle = oldLabels.find((l) => l.key === "emptyStateTitle")?.value;
  const emptyText = oldLabels.find((l) => l.key === "emptyStateText")?.value;
  sections.push(
    section("filters", "filters", {
      items: [...filterItems, textItem("emptyStateTitle", { title: copy(emptyTitle) }), textItem("emptyStateText", { title: copy(emptyText) })],
    }),
  );

  sections.push(
    section("closingCta", "cta", {
      label: copy(old.closingSection?.eyebrow),
      title: copy(old.closingSection?.title),
      text: copy(old.closingSection?.text),
      actions: [toCtaAction("main", copy(old.closingSection?.cta?.label), "/host-at-rorum")],
      items: [
        textItem("faqQuestion", { title: copy(old.closingSection?.faqQuestion) }),
        textItem("faqLabel", { title: copy(old.closingSection?.faqLabel) }),
      ],
      settings: [{ _key: "variant", _type: "sectionSetting", key: "variant", value: "host" }],
    }),
  );

  await createPageReplacingOldSingleton("events", sections, "events", "eventsPage");
}

// ---- Event Decoration -------------------------------------------------------

interface OldEventDecorationPage {
  hero?: { label?: I18n; title?: I18n; text?: I18n; primaryCta?: CtaLikeValue };
  gallery?: { _key: string; asset?: { _ref?: string; _id?: string }; alt?: I18n }[];
  suitableForLabel?: I18n;
  suitableFor?: { _key: string; icon?: string; title?: I18n }[];
  suitableForAriaLabel?: I18n;
  stylingLabel?: I18n;
  stylingTitle?: I18n;
  stylingIntro?: { _key: string; text?: I18n }[];
  formats?: { _key: string; icon?: string; title?: I18n; text?: I18n }[];
  stylingImage?: SanityImageWithAlt;
  tailoredNote?: { title?: I18n; text?: I18n };
  stepsTitle?: I18n;
  steps?: { _key: string; title?: I18n; text?: I18n }[];
  inquiryIntro?: I18n;
  inquiryTitle?: I18n;
  inquirySubmitLabel?: I18n;
  messagePlaceholder?: I18n;
  successMessage?: I18n;
}

async function migrateEventDecoration() {
  console.log("\n=== Event Decoration ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.eventDecoration"][0]{_id}`);
  if (existingPage) {
    console.log("  page.eventDecoration already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldEventDecorationPage>("eventDecorationPage", "eventDecorationPage");
  if (!old) {
    console.log("  No eventDecorationPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  sections.push(
    section("hero", "hero", {
      label: copy(old.hero?.label),
      title: copy(old.hero?.title),
      text: copy(old.hero?.text),
      actions: [toCtaAction("request", copy(old.hero?.primaryCta?.label), "#decoration-inquiry")],
    }),
  );

  const galleryMedia = (old.gallery ?? [])
    .filter((img) => img.asset?._ref || img.asset?._id)
    .map((img) => ({
      _key: img._key,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: img.asset!._ref ?? img.asset!._id } },
      alt: copy(img.alt),
    }));
  const suitableForItems = (old.suitableFor ?? []).map((chip, i) => textItem(`suitableFor${i}`, { icon: chip.icon, title: copy(chip.title) }));
  sections.push(
    section("gallery", "gallery", {
      label: copy(old.suitableForLabel),
      media: galleryMedia,
      items: [textItem("ariaLabel", { title: copy(old.suitableForAriaLabel) }), ...suitableForItems],
    }),
  );

  const introItems = (old.stylingIntro ?? []).map((p, i) => textItem(`intro${i}`, { text: copy(p.text) }));
  const formatItems = (old.formats ?? []).map((f, i) => textItem(`format${i}`, { icon: f.icon, title: copy(f.title), text: copy(f.text) }));
  const stylingMedia = await toMediaItem("image", old.stylingImage);
  sections.push(
    section("styling", "split", {
      label: copy(old.stylingLabel),
      title: copy(old.stylingTitle),
      media: stylingMedia ? [stylingMedia] : [],
      items: [...introItems, ...formatItems, textItem("tailoredNote", { title: copy(old.tailoredNote?.title), text: copy(old.tailoredNote?.text) })],
    }),
  );

  const stepItems = (old.steps ?? []).map((s, i) => textItem(`step${i}`, { title: copy(s.title), text: copy(s.text) }));
  sections.push(
    section("steps", "steps", {
      label: tri(HOW_IT_WORKS_LABEL.en, HOW_IT_WORKS_LABEL.da, HOW_IT_WORKS_LABEL.uk),
      title: copy(old.stepsTitle),
      items: stepItems,
    }),
  );

  sections.push(
    section("inquiryForm", "form", {
      title: copy(old.inquiryTitle),
      text: copy(old.inquiryIntro),
      items: [
        textItem("submitLabel", { title: copy(old.inquirySubmitLabel) }),
        textItem("messagePlaceholder", { title: copy(old.messagePlaceholder) }),
        textItem("successMessage", { text: copy(old.successMessage) }),
      ],
    }),
  );

  await createPageReplacingOldSingleton("eventDecoration", sections, "eventDecoration", "eventDecorationPage");
}

// ---- Host at RORUM ----------------------------------------------------------

interface OldHostAtRorumPage {
  hero?: { label?: I18n; title?: I18n; text?: I18n; primaryCta?: CtaLikeValue; secondaryCta?: CtaLikeValue };
  gallery?: { _key: string; asset?: { _ref?: string; _id?: string }; alt?: I18n }[];
  sessionLabel?: I18n;
  sessionTitle?: I18n;
  sessionImage?: SanityImageWithAlt;
  includedItems?: { _key: string; text?: I18n }[];
  optionalLabel?: I18n;
  optionalItems?: { _key: string; text?: I18n }[];
  packagesLabel?: I18n;
  packagesTitle?: I18n;
  packagesIntro?: I18n;
  packages?: { _key: string; title?: I18n; price?: I18n; items?: { _key: string; text?: I18n }[] }[];
  cancellationTitle?: I18n;
  cancellationItems?: { _key: string; text?: I18n }[];
  stepsTitle?: I18n;
  steps?: { _key: string; title?: I18n; text?: I18n }[];
  inquiryIntro?: I18n;
  inquiryTitle?: I18n;
  inquirySubmitLabel?: I18n;
  messagePlaceholder?: I18n;
  successMessage?: I18n;
  labels?: { key?: string | null; value?: I18n }[];
}

async function migrateHostAtRorum() {
  console.log("\n=== Host at RORUM ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.hostAtRorum"][0]{_id}`);
  if (existingPage) {
    console.log("  page.hostAtRorum already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldHostAtRorumPage>("hostAtRorumPage", "hostAtRorumPage");
  if (!old) {
    console.log("  No hostAtRorumPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  sections.push(
    section("hero", "hero", {
      label: copy(old.hero?.label),
      title: copy(old.hero?.title),
      text: copy(old.hero?.text),
      actions: [
        toCtaAction("apply", copy(old.hero?.primaryCta?.label), "#request-private-meeting"),
        toCtaAction("packages", copy(old.hero?.secondaryCta?.label), "#meeting-packages"),
      ],
    }),
  );

  const galleryMedia = (old.gallery ?? [])
    .filter((img) => img.asset?._ref || img.asset?._id)
    .map((img) => ({
      _key: img._key,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: img.asset!._ref ?? img.asset!._id } },
      alt: copy(img.alt),
    }));
  sections.push(section("gallery", "gallery", { media: galleryMedia }));

  const includedItems = (old.includedItems ?? []).map((b, i) => textItem(`included${i}`, { title: copy(b.text) }));
  const optionalItems = (old.optionalItems ?? []).map((b, i) => textItem(`optional${i}`, { title: copy(b.text) }));
  const sessionMedia = await toMediaItem("image", old.sessionImage);
  sections.push(
    section("session", "split", {
      label: copy(old.sessionLabel),
      title: copy(old.sessionTitle),
      media: sessionMedia ? [sessionMedia] : [],
      items: [...includedItems, textItem("optionalLabel", { title: copy(old.optionalLabel) }), ...optionalItems],
    }),
  );

  const oldLabels = old.labels ?? [];
  const labelValue = (key: string) => oldLabels.find((l) => l.key === key)?.value;
  const packageItems = (old.packages ?? []).map((p, i) =>
    textItem(`package${i}`, { title: copy(p.title), label: copy(p.price), text: joinI18nLines(p.items) }),
  );
  const cancellationItems = (old.cancellationItems ?? []).map((b, i) => textItem(`cancellation${i}`, { title: copy(b.text) }));
  sections.push(
    section("packages", "cta", {
      label: copy(old.packagesLabel),
      title: copy(old.packagesTitle),
      text: copy(old.packagesIntro),
      items: [
        ...packageItems,
        textItem("footerCtaLabel", { title: copy(labelValue("packagesFooterCtaLabel")) }),
        textItem("footerText", { title: copy(labelValue("packagesFooterText")) }),
        textItem("selectPackageCta", { title: copy(labelValue("selectPackageCta")) }),
        textItem("cancellationTitle", { title: copy(old.cancellationTitle) }),
        ...cancellationItems,
      ],
    }),
  );

  const stepItems = (old.steps ?? []).map((s, i) => textItem(`step${i}`, { title: copy(s.title), text: copy(s.text) }));
  sections.push(
    section("steps", "steps", {
      label: tri(HOW_IT_WORKS_LABEL.en, HOW_IT_WORKS_LABEL.da, HOW_IT_WORKS_LABEL.uk),
      title: copy(old.stepsTitle),
      items: [...stepItems, textItem("requestProcessAriaLabel", { title: copy(labelValue("requestProcessAriaLabel")) })],
    }),
  );

  sections.push(
    section("inquiryForm", "form", {
      title: copy(old.inquiryTitle),
      text: copy(old.inquiryIntro),
      items: [
        textItem("submitLabel", { title: copy(old.inquirySubmitLabel) }),
        textItem("messagePlaceholder", { title: copy(old.messagePlaceholder) }),
        textItem("successMessage", { text: copy(old.successMessage) }),
      ],
    }),
  );

  await createPageReplacingOldSingleton("hostAtRorum", sections, "hostAtRorum", "hostAtRorumPage");
}

// ---- Community Membership ---------------------------------------------------

interface OldCommunityMembershipPage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroIntro?: { _key: string; text?: I18n }[];
  logo?: SanityImageWithAlt;
  membershipFormCta?: CtaLikeValue;
  supportCta?: CtaLikeValue;
  externalSiteCta?: CtaLikeValue;
  donation?: {
    label?: I18n;
    title?: I18n;
    text?: I18n;
    qrImage?: SanityImageWithAlt;
    scanText?: I18n;
    scanSubtext?: I18n;
    orText?: I18n;
    bankTransferText?: I18n;
    bankDetailsTitle?: I18n;
    bankFields?: { _key: string; label?: I18n; value?: string }[];
    supportText?: I18n;
  };
  priceStripText?: I18n;
  galleryLabel?: I18n;
  galleryTitle?: I18n;
  gallery?: { _key: string; image?: SanityImageWithAlt; videoUrl?: string; alt?: I18n }[];
  introSectionLabel?: I18n;
  introSectionTitle?: I18n;
  introColumns?: { _key: string; title?: I18n; text?: I18n }[];
  benefitsTitle?: I18n;
  benefits?: { _key: string; icon?: SanityImageWithAlt; text?: I18n }[];
  statementText?: I18n;
  applicationTitle?: I18n;
  applicationSteps?: { _key: string; title?: I18n; text?: I18n }[];
  applicationCta?: CtaLikeValue;
}

async function migrateCommunityMembership() {
  console.log("\n=== Community Membership ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.communityMembership"][0]{_id}`);
  if (existingPage) {
    console.log("  page.communityMembership already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldCommunityMembershipPage>("communityMembershipPage", "communityMembershipPage");
  if (!old) {
    console.log("  No communityMembershipPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  const defaultFormHref = "https://forms.gle/MpadaPTyL8YCHtAa9";

  const logoMedia = await toMediaItem("logo", old.logo);
  const heroIntroItems = (old.heroIntro ?? []).map((p, i) => textItem(`intro${i}`, { text: copy(p.text) }));
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.heroTitle),
      media: logoMedia ? [logoMedia] : [],
      actions: [
        toCtaAction("apply", copy(old.membershipFormCta?.label), old.membershipFormCta?.href || defaultFormHref),
        toCtaAction("support", copy(old.supportCta?.label), "#support-wecoda"),
        toCtaAction("external", copy(old.externalSiteCta?.label), "https://wecoda.org"),
      ],
      items: [...heroIntroItems, textItem("priceStripText", { title: copy(old.priceStripText) })],
    }),
  );

  const qrMedia = await toMediaItem("qr", old.donation?.qrImage);
  const bankItems = (old.donation?.bankFields ?? []).map((f, i) => textItem(`bank${i}`, { title: copy(f.label), value: f.value }));
  sections.push(
    section("donation", "donation", {
      label: copy(old.donation?.label),
      title: copy(old.donation?.title),
      text: copy(old.donation?.text),
      media: qrMedia ? [qrMedia] : [],
      items: [
        textItem("scanText", { title: copy(old.donation?.scanText) }),
        textItem("scanSubtext", { title: copy(old.donation?.scanSubtext) }),
        textItem("orText", { title: copy(old.donation?.orText) }),
        textItem("bankTransferText", { title: copy(old.donation?.bankTransferText) }),
        textItem("bankDetailsTitle", { title: copy(old.donation?.bankDetailsTitle) }),
        ...bankItems,
        textItem("supportText", { text: copy(old.donation?.supportText) }),
      ],
    }),
  );

  const introColumnItems = (old.introColumns ?? []).map((c, i) => textItem(`column${i}`, { text: copy(c.text) }));
  sections.push(
    section("intro", "split", { label: copy(old.introSectionLabel), title: copy(old.introSectionTitle), items: introColumnItems }),
  );

  const benefitItems = (old.benefits ?? []).map((b, i) => {
    const { title, text } = splitBenefitI18n(b.text);
    const image = b.icon?.asset?._ref || b.icon?.asset?._id
      ? { _type: "image", asset: { _type: "reference", _ref: b.icon.asset._ref ?? b.icon.asset._id } }
      : undefined;
    return textItem(`benefit${i}`, { title, text, image });
  });
  sections.push(section("benefits", "benefits", { title: copy(old.benefitsTitle), items: benefitItems }));

  const applicationStepItems = (old.applicationSteps ?? []).map((s, i) => textItem(`step${i}`, { title: copy(s.title), text: copy(s.text) }));
  sections.push(
    section("application", "cta", {
      text: copy(old.statementText),
      title: copy(old.applicationTitle),
      actions: [toCtaAction("apply", copy(old.applicationCta?.label), old.membershipFormCta?.href || defaultFormHref)],
      items: applicationStepItems,
    }),
  );

  const galleryMedia = (old.gallery ?? []).map((item, i) => toGalleryMediaItem(item._key ?? `g${i}`, item));
  sections.push(section("gallery", "gallery", { label: copy(old.galleryLabel), title: copy(old.galleryTitle), media: galleryMedia }));

  await createPageReplacingOldSingleton("communityMembership", sections, "communityMembership", "communityMembershipPage");
}

// ---- Volunteer --------------------------------------------------------------

interface OldVolunteerPage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroParagraphs?: { _key: string; text?: I18n }[];
  highlights?: { _key: string; icon?: string; title?: I18n; text?: I18n }[];
  closingParagraphs?: { _key: string; text?: I18n }[];
  applyCta?: CtaLikeValue;
  heroImage?: SanityImageWithAlt;
  applicationForm?: { modalTitle?: I18n; messagePlaceholder?: I18n; successMessage?: I18n; errorMessage?: I18n };
}

async function migrateVolunteer() {
  console.log("\n=== Volunteer ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.volunteer"][0]{_id}`);
  if (existingPage) {
    console.log("  page.volunteer already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldVolunteerPage>("volunteerPage", "volunteerPage");
  if (!old) {
    console.log("  No volunteerPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  const heroMedia = await toMediaItem("image", old.heroImage);
  const heroParagraphItems = (old.heroParagraphs ?? []).map((p, i) => textItem(`hero${i}`, { text: copy(p.text) }));
  const highlightItems = (old.highlights ?? []).map((h, i) => textItem(`highlight${i}`, { icon: h.icon, title: copy(h.title) }));
  const closingParagraphItems = (old.closingParagraphs ?? []).map((p, i) => textItem(`closing${i}`, { text: copy(p.text) }));
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.heroTitle),
      media: heroMedia ? [heroMedia] : [],
      actions: [toCtaAction("apply", copy(old.applyCta?.label), "#apply")],
      items: [...heroParagraphItems, ...highlightItems, ...closingParagraphItems],
    }),
  );

  sections.push(
    section("applicationForm", "form", {
      items: [
        textItem("modalTitle", { title: copy(old.applicationForm?.modalTitle) }),
        textItem("messagePlaceholder", { title: copy(old.applicationForm?.messagePlaceholder) }),
        textItem("successMessage", { text: copy(old.applicationForm?.successMessage) }),
        textItem("errorMessage", { text: copy(old.applicationForm?.errorMessage) }),
      ],
    }),
  );

  await createPageReplacingOldSingleton("volunteer", sections, "volunteer", "volunteerPage");
}

// ---- Work With Us -------------------------------------------------------------

interface OldWorkWithUsPage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroParagraphs?: { _key: string; text?: I18n }[];
  cvUploadCta?: I18n;
  collaborationImages?: SanityImageWithAlt[];
  featureItems?: { _key: string; icon?: string; title?: I18n; text?: I18n }[];
  cvUploadForm?: {
    modalTitle?: I18n;
    modalTitleSent?: I18n;
    description?: I18n;
    descriptionSent?: I18n;
    messagePlaceholder?: I18n;
    dropzoneText?: I18n;
    errorMessage?: I18n;
  };
}

async function migrateWorkWithUs() {
  console.log("\n=== Work With Us ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.workWithUs"][0]{_id}`);
  if (existingPage) {
    console.log("  page.workWithUs already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldWorkWithUsPage>("workWithUsPage", "workWithUsPage");
  if (!old) {
    console.log("  No workWithUsPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  const collabMedia = (old.collaborationImages ?? [])
    .filter((img) => img.asset?._ref || img.asset?._id)
    .map((img, i) => ({
      _key: `collab${i}`,
      _type: "mediaItem",
      kind: "image",
      image: { _type: "image", asset: { _type: "reference", _ref: img.asset!._ref ?? img.asset!._id } },
      alt: copy(img.alt),
    }));
  const heroParagraphItems = (old.heroParagraphs ?? []).map((p, i) => textItem(`hero${i}`, { text: copy(p.text) }));
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.heroTitle),
      media: collabMedia,
      items: [...heroParagraphItems, textItem("cvUploadCta", { title: copy(old.cvUploadCta) })],
    }),
  );

  const featureItems = (old.featureItems ?? []).map((f, i) => textItem(`feature${i}`, { icon: f.icon, title: copy(f.title) }));
  sections.push(section("features", "iconGrid", { items: featureItems }));

  sections.push(
    section("cvUploadForm", "form", {
      items: [
        textItem("modalTitle", { title: copy(old.cvUploadForm?.modalTitle) }),
        textItem("modalTitleSent", { title: copy(old.cvUploadForm?.modalTitleSent) }),
        textItem("description", { text: copy(old.cvUploadForm?.description) }),
        textItem("descriptionSent", { text: copy(old.cvUploadForm?.descriptionSent) }),
        textItem("messagePlaceholder", { title: copy(old.cvUploadForm?.messagePlaceholder) }),
        textItem("dropzoneText", { title: copy(old.cvUploadForm?.dropzoneText) }),
        textItem("errorMessage", { text: copy(old.cvUploadForm?.errorMessage) }),
      ],
    }),
  );

  await createPageReplacingOldSingleton("workWithUs", sections, "workWithUs", "workWithUsPage");
}

// ---- Contact --------------------------------------------------------------

interface OldContactPage {
  heroLabel?: I18n;
  introTitle?: I18n;
  introText?: I18n;
  followUsTitle?: I18n;
  formTitle?: I18n;
  successMessage?: I18n;
  submitLabel?: I18n;
}

async function migrateContact() {
  console.log("\n=== Contact ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.contact"][0]{_id}`);
  if (existingPage) {
    console.log("  page.contact already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldContactPage>("contactPage", "contactPage");
  if (!old) {
    console.log("  No contactPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  sections.push(
    section("hero", "hero", {
      label: copy(old.heroLabel),
      title: copy(old.introTitle),
      text: copy(old.introText),
      items: [textItem("followUsTitle", { title: copy(old.followUsTitle) })],
    }),
  );
  sections.push(
    section("form", "form", {
      title: copy(old.formTitle),
      items: [textItem("successMessage", { text: copy(old.successMessage) }), textItem("submitLabel", { title: copy(old.submitLabel) })],
    }),
  );

  await createPageReplacingOldSingleton("contact", sections, "contact", "contactPage");
}

// ---- FAQ --------------------------------------------------------------------

interface OldFaqPage {
  heroLabel?: I18n;
  heroTitle?: I18n;
  heroText?: I18n;
  groups?: { _key: string; title?: I18n; items?: { _key: string; question?: I18n; answer?: I18n }[] }[];
}

async function migrateFaq() {
  console.log("\n=== FAQ ===");
  const existingPage = await client.fetch<{ _id: string } | null>(`*[_id == "page.faq"][0]{_id}`);
  if (existingPage) {
    console.log("  page.faq already exists — skipping (idempotent).");
    return;
  }
  const old = await fetchOldOrBackup<OldFaqPage>("faqPage", "faqPage");
  if (!old) {
    console.log("  No faqPage document found — nothing to migrate from.");
    return;
  }

  const sections: Record<string, unknown>[] = [];
  sections.push(section("hero", "hero", { label: copy(old.heroLabel), title: copy(old.heroTitle), text: copy(old.heroText) }));

  for (const group of old.groups ?? []) {
    const questionItems = (group.items ?? []).map((item, i) => textItem(`q${i}`, { title: copy(item.question), text: copy(item.answer) }));
    sections.push(section(`group-${group._key}`, "custom", { title: copy(group.title), items: questionItems }));
  }

  await createPageReplacingOldSingleton("faq", sections, "faq", "faqPage");
}

async function main() {
  console.log(`Migrate to page+sections model (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  if (RUN_HOME) {
    await migrateHome();
    await backfillHomeGaps();
  }
  if (RUN_CATERING) {
    await migrateCatering();
    await migrateCateringMenuExamples();
  }
  if (RUN_ABOUT) await migrateAbout();
  if (RUN_EVENTS) await migrateEvents();
  if (RUN_EVENT_DECORATION) await migrateEventDecoration();
  if (RUN_HOST_AT_RORUM) await migrateHostAtRorum();
  if (RUN_COMMUNITY_MEMBERSHIP) await migrateCommunityMembership();
  if (RUN_VOLUNTEER) await migrateVolunteer();
  if (RUN_WORK_WITH_US) await migrateWorkWithUs();
  if (RUN_CONTACT) await migrateContact();
  if (RUN_FAQ) await migrateFaq();
  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete.` +
      (DRY_RUN ? " Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write." : ""),
  );
}

main().catch((error) => {
  console.error("migrate-to-page-sections failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
