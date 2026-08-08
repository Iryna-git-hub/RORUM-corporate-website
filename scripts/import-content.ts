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
 * This script has never been run against a real dataset — see
 * MIGRATION_REPORT.md's Sanity section for why (no project credentials
 * were available in this task) — but the dry-run mode below is fully
 * exercised and its output is what's reported there.
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";

import { events, faqs, packages, siteUrl } from "../lib/data";
import { menuCategories } from "../lib/cateringMenu";
import { companyDetails, contactDetails, socialLinks as socialLinksData } from "../lib/siteConfig";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

function deterministicId(prefix: string, naturalKey: string): string {
  const hash = createHash("sha1").update(naturalKey).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}

function en(value: string | undefined | null) {
  if (value === undefined || value === null) return [];
  return [{ _key: "en", _type: "internationalizedArrayStringValue", value }];
}

function enText(value: string | undefined | null) {
  if (value === undefined || value === null) return [];
  return [{ _key: "en", _type: "internationalizedArrayTextValue", value }];
}

type Doc = Record<string, unknown> & { _id: string; _type: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

  // --- Event categories (derived from the free-text `category` values) ----
  const categoryTitles = [...new Set(events.map((e) => e.category))];
  const categoryIdByTitle = new Map<string, string>();
  for (const title of categoryTitles) {
    const id = deterministicId("eventCategory", title);
    categoryIdByTitle.set(title, id);
    docs.push({
      _id: id,
      _type: "eventCategory",
      title: en(title),
      slug: { _type: "slug", current: slugify(title) },
    });
  }

  // --- Events ---------------------------------------------------------------
  for (const event of events) {
    docs.push({
      _id: deterministicId("event", event.slug),
      _type: "event",
      title: en(event.title),
      slug: { _type: "slug", current: event.slug },
      category: { _type: "reference", _ref: categoryIdByTitle.get(event.category) },
      date: event.date,
      time: event.time,
      price: event.price,
      language: event.language,
      host: event.host,
      isSoldOut: event.isSoldOut,
      shortDescription: enText(event.shortDescription),
      longDescription: enText(event.longDescription),
      included: event.included.map((text, i) => ({ _key: `i${i}`, ...spread(en(text)) })),
      whatToExpect: event.whatToExpect.map((text, i) => ({ _key: `i${i}`, ...spread(en(text)) })),
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
      // `relatedEvents` references are wired in a second pass below, once
      // every event's deterministic id is known.
      // NOTE: image assets are NOT uploaded by this script — see the
      // "Image assets" section of MIGRATION_REPORT.md's Sanity section for
      // why, and the manual/scripted follow-up needed once credentials
      // exist.
    });
  }
  // Second pass: related-event references (needs every event's id resolved first).
  const eventIdBySlug = new Map(events.map((e) => [e.slug, deterministicId("event", e.slug)]));
  for (const doc of docs) {
    if (doc._type !== "event") continue;
    const original = events.find((e) => deterministicId("event", e.slug) === doc._id);
    if (!original) continue;
    doc.relatedEvents = original.relatedEventSlugs
      .map((slug) => eventIdBySlug.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((id, i) => ({ _key: `r${i}`, _type: "reference", _ref: id }));
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
      items: tier.items.map((text, j) => ({ _key: `i${j}`, ...spread(en(text)) })),
    })),
  });

  return docs;
}

function spread<T extends { _key: string }[]>(arr: T) {
  // `en()` returns a 1-element internationalized-array; unwrap its single
  // value's fields (minus `_key`, supplied by the caller) for array members
  // that are themselves internationalizedArrayString, not an object wrapping one.
  const [{ _key: _drop, ...rest }] = arr as unknown as [{ _key: string; [k: string]: unknown }];
  void _drop;
  return rest;
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

  let created = 0;
  let skipped = 0;
  for (const doc of docs) {
    // `createIfNotExists` is what makes this script idempotent and safe to
    // re-run: an existing document (including one an editor has since
    // edited) is never touched.
    const result = await client.createIfNotExists(doc as never);
    if (result._rev) created++;
    else skipped++;
  }
  console.log(`\nDone. ${created} documents created, ${skipped} already existed and were left untouched.`);
}

main().catch((error) => {
  console.error("Import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
