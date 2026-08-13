/**
 * Idempotent English-content import: reads the site's current approved
 * copy from lib/data.ts, lib/cateringMenu.ts and lib/siteConfig.ts and
 * writes it into Sanity as the `en` value of each internationalized field,
 * leaving `da`/`uk` empty for a translator/editor to fill in.
 *
 * Usage:
 *   npm run sanity:import:dry-run   (default-safe: prints a summary, writes nothing)
 *   npm run sanity:import           (requires SANITY_API_WRITE_TOKEN)
 *
 * Idempotency: every document gets a DETERMINISTIC id derived from its
 * natural key (event slug, FAQ group title-slug, gallery key, or a fixed
 * singleton id) — see `deterministicId()`. Re-running this script uses
 * `createIfNotExists` for every document: an existing document (including
 * one an editor has since changed) is left completely untouched. This
 * script only ever creates content that doesn't exist yet; it deliberately
 * never overwrites, so it cannot clobber later editorial changes.
 *
 * See MIGRATION_REPORT.md's Sanity section for run history and results.
 */
import { createClient } from "@sanity/client";

import { events, faqs, packages, siteUrl } from "../lib/data";
import { menuCategories } from "../lib/cateringMenu";
import { companyDetails, contactDetails, socialLinks as socialLinksData } from "../lib/siteConfig";
import { bullet, deterministicId, en, enText, slugify } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

type Doc = Record<string, unknown> & { _id: string; _type: string };

// ---------------------------------------------------------------------------
// Build the document list from the existing hardcoded content sources.
// ---------------------------------------------------------------------------

function buildDocuments(): Doc[] {
  const docs: Doc[] = [];

  // --- Singletons (fixed ids matching sanity/structure.ts) -----------------
  docs.push({
    _id: "siteSettings",
    _type: "siteSettings",
    companyName: companyDetails.name,
    cvr: companyDetails.cvr,
    website: companyDetails.website,
    siteUrl,
  });

  docs.push({
    _id: "contactInfo",
    _type: "contactInfo",
    email: contactDetails.email,
    phone: contactDetails.phone,
    phoneHref: contactDetails.phoneHref,
    address: contactDetails.address,
    shortAddress: contactDetails.shortAddress,
    mapHref: contactDetails.mapHref,
    mapQueryAddress: contactDetails.mapQueryAddress,
  });

  docs.push({
    _id: "socialLinks",
    _type: "socialLinks",
    links: socialLinksData.map((link) => ({
      _key: slugify(link.icon),
      icon: link.icon,
      href: link.href,
      label: en(link.label),
      brandColor: link.brandColor,
    })),
  });

  // --- Events ---------------------------------------------------------------
  for (const event of events) {
    docs.push({
      _id: deterministicId("event", event.slug),
      _type: "event",
      title: en(event.title),
      slug: { _type: "slug", current: event.slug },
      date: event.date,
      time: event.time,
      price: event.price,
      language: event.language,
      isSoldOut: event.isSoldOut,
      shortDescription: enText(event.shortDescription),
      longDescription: enText(event.longDescription),
      included: event.included.map((text, i) => bullet(`i${i}`, text)),
      whatToExpect: event.whatToExpect.map((text, i) => bullet(`i${i}`, text)),
      practicalDetails: event.practicalDetails.map((d, i) => ({
        _key: `d${i}`,
        _type: "practicalDetail",
        label: en(d.label),
        value: en(d.value),
      })),
      ticketProvider: event.ticketProvider,
      ticketUrl: event.ticketUrl,
      calendarUrl: event.calendarUrl,
      waitlistUrl: event.waitlistUrl,
      ticketsLeft: event.ticketsLeft,
      // NOTE: image assets are NOT uploaded by this script — see the
      // "Image assets" section of MIGRATION_REPORT.md's Sanity section for
      // why, and the manual/scripted follow-up needed once credentials
      // exist.
    });
  }

  // --- FAQ groups -------------------------------------------------------------
  for (const [groupTitle, entries] of Object.entries(faqs)) {
    docs.push({
      _id: deterministicId("faqGroup", groupTitle),
      _type: "faqGroup",
      title: en(groupTitle),
      items: entries.map(([question, answer], i) => ({
        _key: `q${i}`,
        _type: "faqItem",
        question: en(question),
        answer: enText(answer),
      })),
    });
  }

  // --- Catering menu categories -----------------------------------------------
  for (const [index, category] of menuCategories.entries()) {
    docs.push({
      _id: deterministicId("cateringMenuCategory", category.id),
      _type: "cateringMenuCategory",
      title: en(category.title),
      navLabel: en(category.navLabel),
      slug: { _type: "slug", current: category.id },
      description: enText(category.description),
      order: index,
      featuredItems: category.featuredItems.map((item, i) => ({
        _key: `f${i}`,
        _type: "cateringMenuItem",
        name: en(item.name),
        description: enText(item.description),
        // `image` intentionally omitted — see the image-assets note above.
      })),
    });
  }

  // --- Host at RORUM packages (booking tier, the one actually rendered) -------
  docs.push({
    _id: "hostAtRorumPage",
    _type: "hostAtRorumPage",
    packages: packages.booking.map((tier, i) => ({
      _key: `p${i}`,
      _type: "packageTier",
      title: en(tier.title),
      price: en(tier.price),
      items: tier.items.map((text, j) => bullet(`i${j}`, text)),
    })),
  });

  return docs;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const docs = buildDocuments();
  const byType = new Map<string, number>();
  for (const doc of docs) byType.set(doc._type, (byType.get(doc._type) ?? 0) + 1);

  console.log(`Import summary (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log(`  ${docs.length} documents total`);
  for (const [type, count] of [...byType.entries()].sort()) {
    console.log(`    ${type}: ${count}`);
  }
  console.log(
    "\nNote: image assets are not uploaded by this script (see MIGRATION_REPORT.md's Sanity",
    "section) — image fields are left empty and must be filled in manually in the Studio,",
    "or by a follow-up script that uploads each referenced /public/images/... file via",
    "client.assets.upload() and patches the resulting asset reference in.",
  );

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN are all required for a live run.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
  });

  for (const doc of docs) {
    // `createIfNotExists` is what makes this script idempotent and safe to
    // re-run: an existing document (including one an editor has since
    // edited) is never touched. Its response doesn't distinguish "just
    // created" from "already existed" (both return the current document),
    // so this script doesn't claim a created/skipped split it can't
    // actually observe — re-running is simply always safe.
    await client.createIfNotExists(doc as never);
  }
  console.log(`\nProcessed ${docs.length} documents (existing ones were left untouched).`);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
