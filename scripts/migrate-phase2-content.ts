/**
 * Phase 2 content-architecture migration: fills the schema fields added in
 * Phase 2 (see MIGRATION_REPORT.md) with the content that used to be
 * hardcoded in the page components — mostly local image paths and the small
 * amount of copy that had no Sanity field at all before now.
 *
 *   1. homePage        — quickPaths/eventsViewAll labels, hero/community/
 *                         feature/quickPath/service images, quickPath CTAs.
 *   2. aboutPage        — communityTitle/communityText (copied from the
 *                         legacy `values[0]`), atmosphere photos, the 3
 *                         quick-link chip arrays.
 *   3. communityMembershipPage — membershipFormCta, donation QR image +
 *                         bank details, the benefits reshape (bulletText ->
 *                         {icon, text}, existing trilingual text preserved),
 *                         the photo/video gallery, statementText.
 *   4. volunteerPage    — heroImage, applicationForm pop-up copy.
 *   5. workWithUsPage   — collaborationImages, featureItems, cvUploadForm
 *                         pop-up copy.
 *   6. legalPage-*      — lastUpdated only: title/subtitle/body already
 *                         carry full EN+DA+UK content from
 *                         scripts/import-translations.ts.
 *
 * All new copy here is authored in English only, matching every other
 * Phase 1/2 script (`import-pages.ts`) — da/uk for it is a separate,
 * later pass through `import-translations.ts`, same division of labor as
 * the rest of the site. Existing trilingual content (aboutPage.values[0],
 * communityMembershipPage.benefits) is copied through verbatim, never
 * re-authored, so no translation is lost.
 *
 * Usage:
 *   npm run sanity:migrate-phase2:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-phase2           (requires SANITY_API_WRITE_TOKEN)
 *
 * Idempotency: every write is gated on the destination field (or array
 * item's field) not already being set, so re-running after a partial run —
 * or after an editor has replaced a value in the Studio — never overwrites
 * their choice and never re-uploads an asset.
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { en, enText } from "./lib/sanityImportUtils";

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
  return path.join(process.cwd(), "public", publicRelativePath);
}

/** Uploads `localRelPath` (relative to /public) and `.set()`s it at `patchKey` on `docId`, unless `alreadySet`. */
async function maybeSetImage(
  docId: string,
  patchKey: string,
  alreadySet: boolean,
  localRelPath: string,
  altText: string,
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
  console.log(`  ${label}: would upload public/${localRelPath} and set ${patchKey}.`);
  if (DRY_RUN) return;
  const asset = await client.assets.upload("image", readFileSync(localPath), { filename: path.basename(localRelPath) });
  await client
    .patch(docId)
    .set({ [patchKey]: { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: en(altText) } })
    .commit();
  console.log(`  ${label}: uploaded and linked.`);
}

// ---------------------------------------------------------------------------
// 1. homePage
// ---------------------------------------------------------------------------

interface HomePageGaps {
  quickPathsLabel?: unknown;
  quickPathsTitle?: unknown;
  eventsViewAllLabel?: unknown;
  heroImageSet: boolean;
  communityImageSet: boolean;
  attendImageSet: boolean;
  hostImageSet: boolean;
  quickPaths: { _key: string; imageSet: boolean; ctaSet: boolean }[] | null;
  services: { _key: string; href: string | null; imageSet: boolean }[] | null;
}

const QUICK_PATH_IMAGES: Record<string, { path: string; alt: string }> = {
  "/events": { path: "images/events/attend-events-quickpath.png", alt: "Guests gathered at a RORUM event" },
  "/host-at-rorum": { path: "images/private-meetings/private-meeting-room-9.png", alt: "Private meeting room set up at RORUM" },
  "/catering": { path: "images/catering/catering-1.png", alt: "RORUM catering spread" },
  "/event-decoration": { path: "images/decoration/decoration-1.png", alt: "RORUM event decoration styling" },
};

const QUICK_PATH_CTAS: Record<string, string> = {
  "/events": "Explore events",
  "/host-at-rorum": "Host with us",
  "/catering": "Explore catering",
  "/event-decoration": "Explore decoration",
};

// `quickPaths[].href` isn't actually set in the live dataset (a pre-existing
// gap from before Phase 2 — the frontend already falls back to matching by
// array index, same as it did for `.image` before this migration), so these
// items are matched by position rather than by `item.href`.
const QUICK_PATH_ORDER = ["/events", "/host-at-rorum", "/catering", "/event-decoration"] as const;

async function migrateHomePage() {
  console.log("\n== Home page ==");
  const doc = await client.fetch<HomePageGaps | null>(`*[_id == "homePage"][0]{
    quickPathsLabel, quickPathsTitle, eventsViewAllLabel,
    "heroImageSet": defined(heroImage.asset),
    "communityImageSet": defined(communityImage.asset),
    "attendImageSet": defined(attendEventsFeature.image.asset),
    "hostImageSet": defined(hostAtRorumFeature.image.asset),
    "quickPaths": quickPaths[]{_key, "imageSet": defined(image.asset), "ctaSet": defined(cta)},
    "services": services[]{_key, href, "imageSet": defined(image.asset)}
  }`);
  if (!doc) {
    console.warn("  homePage document not found — skipping.");
    return;
  }

  const labelFields: Record<string, unknown> = {};
  if (!doc.quickPathsLabel) labelFields.quickPathsLabel = en("Quick paths");
  if (!doc.quickPathsTitle) labelFields.quickPathsTitle = en("Start with what you need.");
  if (!doc.eventsViewAllLabel) labelFields.eventsViewAllLabel = en("View all events");
  if (Object.keys(labelFields).length) {
    console.log(`  section labels: would set ${Object.keys(labelFields).join(", ")}.`);
    if (!DRY_RUN) {
      await client.patch("homePage").set(labelFields).commit();
      console.log("  section labels: set.");
    }
  } else {
    console.log("  section labels: already set — skipping.");
  }

  await maybeSetImage("homePage", "heroImage", doc.heroImageSet, "images/hero.jpg", "RORUM event space", "Hero fallback image");
  await maybeSetImage(
    "homePage",
    "communityImage",
    doc.communityImageSet,
    "images/catering/community-catering-bg.png",
    "RORUM community gathering",
    "Community teaser background image",
  );
  await maybeSetImage(
    "homePage",
    "attendEventsFeature.image",
    doc.attendImageSet,
    "images/events/host-event-workshop-quickpath.png",
    "Workshop gathering around a table at RORUM",
    "Attend Events feature image",
  );
  await maybeSetImage(
    "homePage",
    "hostAtRorumFeature.image",
    doc.hostImageSet,
    "images/events/private-meetings.png",
    "Small hosted meeting in the RORUM room",
    "Host at RORUM feature image",
  );

  for (const [i, item] of (doc.quickPaths ?? []).entries()) {
    const href = QUICK_PATH_ORDER[i];
    const meta = href ? QUICK_PATH_IMAGES[href] : undefined;
    if (meta) {
      await maybeSetImage(
        "homePage",
        `quickPaths[_key=="${item._key}"].image`,
        item.imageSet,
        meta.path,
        meta.alt,
        `Quick path image (${href})`,
      );
    }
    const ctaText = href ? QUICK_PATH_CTAS[href] : undefined;
    if (item.ctaSet) {
      console.log(`  quick path cta (${href}): already set — skipping.`);
    } else if (ctaText) {
      console.log(`  quick path cta (${href}): would set to "${ctaText}".`);
      if (!DRY_RUN) {
        await client.patch("homePage").set({ [`quickPaths[_key=="${item._key}"].cta`]: en(ctaText) }).commit();
        console.log("  quick path cta: set.");
      }
    }
  }

  for (const item of doc.services ?? []) {
    const meta = item.href ? QUICK_PATH_IMAGES[item.href] : undefined;
    if (meta) {
      await maybeSetImage(
        "homePage",
        `services[_key=="${item._key}"].image`,
        item.imageSet,
        meta.path,
        meta.alt,
        `Service teaser image (${item.href})`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. aboutPage
// ---------------------------------------------------------------------------

interface TitledTextValue {
  title?: unknown;
  text?: unknown;
}

interface AboutPageGaps {
  hasCommunityTitle: boolean;
  hasCommunityText: boolean;
  values: TitledTextValue[] | null;
  hasAtmosphereImages: boolean;
  hasIntroLinks: boolean;
  hasServiceLinks: boolean;
  hasCommunityLinks: boolean;
}

const ATMOSPHERE_IMAGES = [
  { path: "images/about/about-room-borscht.png", alt: "Ukrainian borscht with pampushky prepared for a RORUM gathering" },
  { path: "images/space/space-about-room.png", alt: "Warm RORUM room prepared for a meeting" },
  { path: "images/decoration/decoration-floral-table.png", alt: "Decorated table with flowers and place settings" },
];

function iconLink(key: string, icon: string, label: string, href: string) {
  return { _key: key, _type: "iconLink", icon, label: en(label), href };
}

async function migrateAboutPage() {
  console.log("\n== About page ==");
  const doc = await client.fetch<AboutPageGaps | null>(`*[_id == "aboutPage"][0]{
    "hasCommunityTitle": defined(communityTitle),
    "hasCommunityText": defined(communityText),
    values,
    "hasAtmosphereImages": defined(atmosphereImages),
    "hasIntroLinks": defined(introLinks),
    "hasServiceLinks": defined(serviceLinks),
    "hasCommunityLinks": defined(communityLinks),
  }`);
  if (!doc) {
    console.warn("  aboutPage document not found — skipping.");
    return;
  }

  const legacyText = doc.values?.[0]?.text;
  if (doc.hasCommunityTitle || doc.hasCommunityText) {
    console.log("  communityTitle/communityText: already set — skipping.");
  } else {
    console.log(
      `  communityTitle/communityText: would set communityTitle to "Community" (en) and copy the existing trilingual values[0].text${legacyText ? "" : " (not found — would fall back to English-only text)"}.`,
    );
    if (!DRY_RUN) {
      await client
        .patch("aboutPage")
        .set({ communityTitle: en("Community"), communityText: legacyText ?? enText("RORUM is also shaped by members, collaborators and people who want to support thoughtful local gatherings.") })
        .commit({ autoGenerateArrayKeys: false });
      console.log("  communityTitle/communityText: set.");
    }
  }

  if (doc.hasAtmosphereImages) {
    console.log("  atmosphereImages: already set — skipping.");
  } else {
    const missing = ATMOSPHERE_IMAGES.filter((img) => !existsSync(resolveLocalPath(img.path)));
    if (missing.length) {
      console.warn(`  atmosphereImages: ${missing.length} local file(s) missing — skipping.`);
    } else {
      console.log(`  atmosphereImages: would upload ${ATMOSPHERE_IMAGES.length} photo(s) and set atmosphereImages.`);
      if (!DRY_RUN) {
        const items = [];
        for (const [i, img] of ATMOSPHERE_IMAGES.entries()) {
          const asset = await client.assets.upload("image", readFileSync(resolveLocalPath(img.path)), {
            filename: path.basename(img.path),
          });
          items.push({
            _key: `ai${i}`,
            _type: "imageWithAlt",
            asset: { _type: "reference", _ref: asset._id },
            alt: en(img.alt),
          });
        }
        await client.patch("aboutPage").set({ atmosphereImages: items }).commit({ autoGenerateArrayKeys: false });
        console.log("  atmosphereImages: uploaded and set.");
      }
    }
  }

  if (doc.hasIntroLinks) {
    console.log("  introLinks: already set — skipping.");
  } else {
    console.log("  introLinks: would set (Host at RORUM / Attend Events).");
    if (!DRY_RUN) {
      await client
        .patch("aboutPage")
        .set({
          introLinks: [
            iconLink("il0", "CalendarPlus", "Host at RORUM", "/host-at-rorum"),
            iconLink("il1", "CalendarCheck", "Attend Events", "/events"),
          ],
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log("  introLinks: set.");
    }
  }

  if (doc.hasServiceLinks) {
    console.log("  serviceLinks: already set — skipping.");
  } else {
    console.log("  serviceLinks: would set (Catering / Event Decoration).");
    if (!DRY_RUN) {
      await client
        .patch("aboutPage")
        .set({
          serviceLinks: [
            iconLink("sl0", "ChefHat", "Catering", "/catering"),
            iconLink("sl1", "WandSparkles", "Event Decoration", "/event-decoration"),
          ],
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log("  serviceLinks: set.");
    }
  }

  if (doc.hasCommunityLinks) {
    console.log("  communityLinks: already set — skipping.");
  } else {
    console.log("  communityLinks: would set (WECODA / Work with us / Volunteer).");
    if (!DRY_RUN) {
      await client
        .patch("aboutPage")
        .set({
          communityLinks: [
            iconLink("cl0", "Users", "WECODA membership", "/community-membership"),
            iconLink("cl1", "Handshake", "Work with us", "/work-with-us"),
            iconLink("cl2", "HandHeart", "Volunteer with us", "/volunteer"),
          ],
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log("  communityLinks: set.");
    }
  }
}

// ---------------------------------------------------------------------------
// 3. communityMembershipPage
// ---------------------------------------------------------------------------

const BENEFIT_ICONS = [
  "images/membership-benefits/event-access.png",
  "images/membership-benefits/training-learning.png",
  "images/membership-benefits/international-networking.png",
  "images/membership-benefits/international-opportunities.png",
  "images/membership-benefits/funding-information.png",
  "images/membership-benefits/mentoring-advice.png",
  "images/membership-benefits/visibility-work.png",
  "images/membership-benefits/diplomatic-cultural-events.png",
  "images/membership-benefits/supportive-community.png",
];

const BANK_FIELDS: { label: string; value: string; copyable?: boolean }[] = [
  { label: "Beneficiary", value: "Women Entrepreneurs Commerce & Development Association (WECODA)" },
  { label: "CVR", value: "46365208" },
  { label: "Bank", value: "Danske Bank" },
  { label: "Account Type", value: "Danske Direkte Forening" },
  { label: "Account No.", value: "14165789", copyable: true },
  { label: "Reg. No.", value: "9570" },
  { label: "IBAN", value: "DK96 3000 0014 1657 89", copyable: true },
  { label: "SWIFT/BIC", value: "DABADKKK" },
  { label: "Currency", value: "DKK (Danish Krone)" },
];

interface MembershipWeekMediaItem {
  type: "image" | "video";
  path: string;
  alt: string;
}

const GALLERY_ITEMS: MembershipWeekMediaItem[] = [
  { type: "image", path: "images/membership-week/members-balloon-arch.png", alt: "WECODA members celebrating in the garden by a green and white balloon arch" },
  { type: "video", path: "videos/membership-week/members-week-01.mp4", alt: "Muted video from the WECODA membership gathering" },
  { type: "image", path: "images/membership-week/members-table-laughing.jpg", alt: "WECODA members smiling around a garden table" },
  { type: "image", path: "images/membership-week/garden-table-catering.png", alt: "Catering table prepared for a WECODA member gathering" },
  { type: "video", path: "videos/membership-week/members-week-02.mp4", alt: "Muted video of members gathering outdoors" },
  { type: "image", path: "images/membership-week/members-long-table.jpg", alt: "WECODA members seated at a long outdoor table" },
  { type: "image", path: "images/membership-week/members-group-garden.jpg", alt: "Group portrait of WECODA members in the garden" },
  { type: "image", path: "images/membership-week/members-portrait.png", alt: "Two WECODA members smiling at the gathering" },
];

interface CommunityMembershipGaps {
  hasMembershipFormCta: boolean;
  hasQrImage: boolean;
  hasBankFields: boolean;
  benefits: { _key: string; _type: string; text: unknown }[] | null;
  hasGallery: boolean;
  hasStatementText: boolean;
}

async function migrateCommunityMembershipPage() {
  console.log("\n== Community membership page ==");
  const doc = await client.fetch<CommunityMembershipGaps | null>(`*[_id == "communityMembershipPage"][0]{
    "hasMembershipFormCta": defined(membershipFormCta.href),
    "hasQrImage": defined(donation.qrImage.asset),
    "hasBankFields": defined(donation.bankFields),
    benefits,
    "hasGallery": defined(gallery),
    "hasStatementText": defined(statementText),
  }`);
  if (!doc) {
    console.warn("  communityMembershipPage document not found — skipping.");
    return;
  }

  if (doc.hasMembershipFormCta) {
    console.log("  membershipFormCta: already set — skipping.");
  } else {
    console.log("  membershipFormCta: would set href to the WECODA Google Form.");
    if (!DRY_RUN) {
      await client
        .patch("communityMembershipPage")
        .set({ membershipFormCta: { label: en("Become a Member"), href: "https://forms.gle/MpadaPTyL8YCHtAa9" } })
        .commit();
      console.log("  membershipFormCta: set.");
    }
  }

  await maybeSetImage(
    "communityMembershipPage",
    "donation.qrImage",
    doc.hasQrImage,
    "images/membership-week/wecoda-donation-qr.jpg",
    "QR code for supporting WECODA",
    "Donation QR code",
  );

  if (doc.hasBankFields) {
    console.log("  donation.bankFields: already set — skipping.");
  } else {
    console.log(`  donation.bankFields: would set ${BANK_FIELDS.length} row(s).`);
    if (!DRY_RUN) {
      const items = BANK_FIELDS.map((f, i) => ({
        _key: `bf${i}`,
        _type: "bankField",
        label: en(f.label),
        value: f.value,
        copyable: f.copyable ?? false,
      }));
      await client.patch("communityMembershipPage").set({ "donation.bankFields": items }).commit({ autoGenerateArrayKeys: false });
      console.log("  donation.bankFields: set.");
    }
  }

  if (doc.hasStatementText) {
    console.log("  statementText: already set — skipping.");
  } else {
    console.log('  statementText: would set to "Together, we are building a strong international community."');
    if (!DRY_RUN) {
      await client
        .patch("communityMembershipPage")
        .set({ statementText: en("Together, we are building a strong international community.") })
        .commit();
      console.log("  statementText: set.");
    }
  }

  const currentBenefits = doc.benefits ?? [];
  const alreadyReshaped = currentBenefits.length > 0 && currentBenefits.every((b) => b._type === "benefit");
  if (alreadyReshaped) {
    console.log("  benefits: already reshaped to {icon, text} — skipping.");
  } else if (!currentBenefits.length) {
    console.log("  benefits: no existing bulletText items found — nothing to reshape.");
  } else {
    const missing = BENEFIT_ICONS.filter((p) => !existsSync(resolveLocalPath(p)));
    if (missing.length) {
      console.warn(`  benefits: ${missing.length} icon file(s) missing on disk — skipping reshape.`);
    } else {
      console.log(
        `  benefits: would reshape ${currentBenefits.length} bulletText item(s) into {icon, text}, uploading ${BENEFIT_ICONS.length} icon(s), preserving existing trilingual text.`,
      );
      if (!DRY_RUN) {
        const items = [];
        for (const [i, b] of currentBenefits.entries()) {
          const iconPath = BENEFIT_ICONS[i];
          if (!iconPath) {
            console.warn(`  benefits: no icon mapped for item ${i} (${b._key}) — keeping its text, leaving icon unset.`);
            items.push({ _key: b._key, _type: "benefit", text: b.text });
            continue;
          }
          const asset = await client.assets.upload("image", readFileSync(resolveLocalPath(iconPath)), {
            filename: path.basename(iconPath),
          });
          items.push({
            _key: b._key,
            _type: "benefit",
            icon: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
            text: b.text,
          });
        }
        await client.patch("communityMembershipPage").set({ benefits: items }).commit({ autoGenerateArrayKeys: false });
        console.log("  benefits: reshaped and set.");
      }
    }
  }

  if (doc.hasGallery) {
    console.log("  gallery: already set — skipping.");
  } else {
    const missing = GALLERY_ITEMS.filter((item) => !existsSync(resolveLocalPath(item.path)));
    if (missing.length) {
      console.warn(`  gallery: ${missing.length} local file(s) missing — skipping.`);
    } else {
      console.log(`  gallery: would set ${GALLERY_ITEMS.length} item(s) (${GALLERY_ITEMS.filter((i) => i.type === "image").length} photos uploaded, ${GALLERY_ITEMS.filter((i) => i.type === "video").length} videos linked by URL).`);
      if (!DRY_RUN) {
        const items = [];
        for (const [i, item] of GALLERY_ITEMS.entries()) {
          if (item.type === "image") {
            const asset = await client.assets.upload("image", readFileSync(resolveLocalPath(item.path)), {
              filename: path.basename(item.path),
            });
            items.push({
              _key: `g${i}`,
              _type: "mediaGalleryItem",
              image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
              alt: en(item.alt),
            });
          } else {
            items.push({
              _key: `g${i}`,
              _type: "mediaGalleryItem",
              videoUrl: `/${item.path}`,
              alt: en(item.alt),
            });
          }
        }
        await client.patch("communityMembershipPage").set({ gallery: items }).commit({ autoGenerateArrayKeys: false });
        console.log("  gallery: set.");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. volunteerPage
// ---------------------------------------------------------------------------

interface VolunteerPageGaps {
  hasHeroImage: boolean;
  hasApplicationForm: boolean;
}

async function migrateVolunteerPage() {
  console.log("\n== Volunteer page ==");
  const doc = await client.fetch<VolunteerPageGaps | null>(`*[_id == "volunteerPage"][0]{
    "hasHeroImage": defined(heroImage.asset),
    "hasApplicationForm": defined(applicationForm),
  }`);
  if (!doc) {
    console.warn("  volunteerPage document not found — skipping.");
    return;
  }

  await maybeSetImage(
    "volunteerPage",
    "heroImage",
    doc.hasHeroImage,
    "images/events/volunteer-with-us.png",
    "RORUM volunteers welcoming guests and preparing a gathering",
    "Hero image",
  );

  if (doc.hasApplicationForm) {
    console.log("  applicationForm: already set — skipping.");
  } else {
    console.log("  applicationForm: would set modal title/placeholder/success/error copy.");
    if (!DRY_RUN) {
      await client
        .patch("volunteerPage")
        .set({
          applicationForm: {
            modalTitle: en("Volunteer With Us"),
            messagePlaceholder: en(
              "Tell us what kinds of activities you would be interested in helping with and how you would like to contribute.",
            ),
            successMessage: enText("Thank you. Your volunteer application has been sent to the RORUM team."),
            errorMessage: enText("We could not send your application. Please check your connection and try again."),
          },
        })
        .commit();
      console.log("  applicationForm: set.");
    }
  }
}

// ---------------------------------------------------------------------------
// 5. workWithUsPage
// ---------------------------------------------------------------------------

const COLLABORATION_IMAGES = [
  { path: "images/work-with-us/kitchen-collaboration.png", alt: "RORUM collaborators cooking together in the kitchen" },
  { path: "images/work-with-us/light-collaboration.png", alt: "Light RORUM collaboration scene with planning materials" },
];

const FEATURE_ITEMS = [
  { icon: "Sprout", text: "Opportunities grow through people" },
  { icon: "DoorOpen", text: "The right environment opens new doors" },
  { icon: "HeartHandshake", text: "Let's create something meaningful together" },
];

interface WorkWithUsGaps {
  hasCollaborationImages: boolean;
  hasFeatureItems: boolean;
  hasCvUploadForm: boolean;
}

async function migrateWorkWithUsPage() {
  console.log("\n== Work with us page ==");
  const doc = await client.fetch<WorkWithUsGaps | null>(`*[_id == "workWithUsPage"][0]{
    "hasCollaborationImages": defined(collaborationImages),
    "hasFeatureItems": defined(featureItems),
    "hasCvUploadForm": defined(cvUploadForm),
  }`);
  if (!doc) {
    console.warn("  workWithUsPage document not found — skipping.");
    return;
  }

  if (doc.hasCollaborationImages) {
    console.log("  collaborationImages: already set — skipping.");
  } else {
    const missing = COLLABORATION_IMAGES.filter((img) => !existsSync(resolveLocalPath(img.path)));
    if (missing.length) {
      console.warn(`  collaborationImages: ${missing.length} local file(s) missing — skipping.`);
    } else {
      console.log(`  collaborationImages: would upload ${COLLABORATION_IMAGES.length} photo(s) and set collaborationImages.`);
      if (!DRY_RUN) {
        const items = [];
        for (const [i, img] of COLLABORATION_IMAGES.entries()) {
          const asset = await client.assets.upload("image", readFileSync(resolveLocalPath(img.path)), {
            filename: path.basename(img.path),
          });
          items.push({
            _key: `ci${i}`,
            _type: "imageWithAlt",
            asset: { _type: "reference", _ref: asset._id },
            alt: en(img.alt),
          });
        }
        await client.patch("workWithUsPage").set({ collaborationImages: items }).commit({ autoGenerateArrayKeys: false });
        console.log("  collaborationImages: uploaded and set.");
      }
    }
  }

  if (doc.hasFeatureItems) {
    console.log("  featureItems: already set — skipping.");
  } else {
    console.log(`  featureItems: would set ${FEATURE_ITEMS.length} item(s).`);
    if (!DRY_RUN) {
      const items = FEATURE_ITEMS.map((f, i) => ({
        _key: `fi${i}`,
        _type: "iconCard",
        icon: f.icon,
        title: en(f.text),
      }));
      await client.patch("workWithUsPage").set({ featureItems: items }).commit({ autoGenerateArrayKeys: false });
      console.log("  featureItems: set.");
    }
  }

  if (doc.hasCvUploadForm) {
    console.log("  cvUploadForm: already set — skipping.");
  } else {
    console.log("  cvUploadForm: would set modal title/description/placeholder/dropzone/error copy.");
    if (!DRY_RUN) {
      await client
        .patch("workWithUsPage")
        .set({
          cvUploadForm: {
            modalTitle: en("Send your CV"),
            modalTitleSent: en("Thank you — we received your CV"),
            description: enText(
              "We'd love to hear from you. Upload your CV and tell us a little about yourself — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.",
            ),
            descriptionSent: enText(
              "Thank you for reaching out and sharing your story with RORUM. We'll keep your details in mind for future collaborations, roles, or opportunities.",
            ),
            messagePlaceholder: en("Tell us briefly what kind of collaboration you are interested in."),
            dropzoneText: en("Choose a PDF, DOC, or DOCX file"),
            errorMessage: enText("Something went wrong while sending your CV. Please try again."),
          },
        })
        .commit();
      console.log("  cvUploadForm: set.");
    }
  }
}

// ---------------------------------------------------------------------------
// 6. legalPage-* — lastUpdated only (title/subtitle/body already carry full
// EN+DA+UK content from scripts/import-translations.ts).
// ---------------------------------------------------------------------------

// Matches the date already displayed by the pre-Phase-2 hardcoded
// "Last updated: May 2026" text in components/LegalPage.tsx — reusing the
// same date preserves what's currently shown instead of inventing a new one.
const LEGAL_LAST_UPDATED = "2026-05-01";

async function migrateLegalPages() {
  console.log("\n== Legal pages ==");
  for (const id of ["legalPage-terms", "legalPage-privacy-policy", "legalPage-cookie-policy"]) {
    const doc = await client.fetch<{ hasLastUpdated: boolean; hasBody: boolean } | null>(
      `*[_id == $id][0]{"hasLastUpdated": defined(lastUpdated), "hasBody": defined(body)}`,
      { id },
    );
    if (!doc) {
      console.warn(`  ${id}: document not found — skipping.`);
      continue;
    }
    if (!doc.hasBody) {
      console.warn(`  ${id}: body not set — run scripts/import-translations.ts first.`);
    }
    if (doc.hasLastUpdated) {
      console.log(`  ${id}: lastUpdated already set — skipping.`);
      continue;
    }
    console.log(`  ${id}: would set lastUpdated to ${LEGAL_LAST_UPDATED}.`);
    if (!DRY_RUN) {
      await client.patch(id).set({ lastUpdated: LEGAL_LAST_UPDATED }).commit();
      console.log(`  ${id}: lastUpdated set.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Phase 2 content migration (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);

  await migrateHomePage();
  await migrateAboutPage();
  await migrateCommunityMembershipPage();
  await migrateVolunteerPage();
  await migrateWorkWithUsPage();
  await migrateLegalPages();

  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete.` +
      (DRY_RUN ? " Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write." : ""),
  );
}

main().catch((error) => {
  console.error("Phase 2 content migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
