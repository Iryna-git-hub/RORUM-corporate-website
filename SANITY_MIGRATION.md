# RORUM — Sanity Migration Specification and Checklist

## Mission

The RORUM website must be manageable through Sanity Studio by a non-technical administrator.

The goal is not merely to move hardcoded strings into Sanity.

The goal is to create a complete, intuitive and reliable content-management workflow.

The administrator should be able to understand the relationship between:

Sanity Studio
↕
Website page

without understanding React, TypeScript, GROQ or application internals.

---

# 1. Global Migration Requirements

Appropriate editorial content should be editable through Sanity.

Depending on the page, this may include:

- section headings
- subheadings
- paragraphs
- labels
- cards
- icons
- images
- alt text
- videos
- logos
- buttons
- links
- lists
- statistics
- FAQ entries
- contact information
- testimonials
- downloadable files
- SEO content
- metadata

Do not expose purely technical implementation values.

---

# 2. Studio Must Follow the Website

For each page, inspect the real rendered website from top to bottom.

Studio sections and fields should follow approximately the same conceptual order.

Example:

Website:

1. Hero
2. About
3. Values
4. Team
5. CTA

Studio should normally present:

1. Hero
2. About
3. Values
4. Team
5. CTA

This allows a non-technical administrator to understand where content appears.

---

# 3. Editor-Friendly Naming

Use human-readable labels.

Good:

- Hero heading
- Hero image
- Introduction
- Main text
- Values
- Icon
- Button text
- Button link

Avoid technical labels visible to editors such as:

- `heroData`
- `componentVariant`
- `rawItems`
- `internalConfig`
- `sectionRef`

unless unavoidable.

Descriptions should be added where the field purpose may otherwise be unclear.

---

# 4. Images

For editable images verify:

- image can be selected/uploaded
- image field is easy to understand
- alt text is available where appropriate
- query returns the correct data
- frontend receives the data
- frontend renders the image correctly
- responsive behavior works

Do not repeatedly load original full-resolution assets during automated tests.

---

# 5. Icons

When icons represent editorial meaning:

- use a controlled selector where practical
- provide understandable labels
- provide useful previews when practical
- avoid requiring the administrator to know technical icon identifiers

Verify:

Sanity icon selection
→ Publish
→ frontend icon change

when safe.

---

# 6. Buttons and Links

Editable CTA content should normally include:

- visible label
- destination/link

Where applicable also support:

- internal/external behavior
- optional accessibility information

Use consistent button/link modeling across the project.

---

# 7. Repeated Content

For sections such as:

- cards
- values
- services
- testimonials
- gallery
- FAQs
- team members
- statistics

use arrays when appropriate.

When visible website order matters:

- Studio should allow reordering
- resulting frontend order must match Studio order

---

# 8. Localization

Translatable content must support:

- English
- Danish
- Ukrainian

Use the existing localization model.

Do not create a new translation structure.

Verify representative content in all three languages.

---

# 9. Sanity Page Audit Procedure

For each page:

## A. Open real page

Use Playwright.

Scroll through the entire rendered page.

Do not audit solely from code.

## B. Build content inventory

Identify all page sections.

Within every section identify:

- text
- images
- icons
- buttons
- links
- repeated items
- video
- metadata
- relevant editorial controls

## C. Compare with Sanity

Classify every element:

- complete
- partial
- hardcoded
- duplicated
- obsolete
- incorrectly modeled

## D. Implement missing CMS integration

Connect:

schema
→ data
→ query
→ component
→ page

## E. Improve Studio UX

Verify:

- correct order
- clear labels
- clear grouping
- appropriate validation
- no unnecessary technical fields

## F. Test

Use the test procedure below.

## G. Record completion

Update the checklist in this file.

---

# 10. CMS Functional Test Procedure

For representative fields:

1. record original value
2. change value in Studio
3. verify validation
4. Publish when safe
5. reload frontend
6. verify exact new value
7. restore original value
8. Publish restoration
9. verify original frontend value is restored

Representative fields should normally cover multiple content types, for example:

- text
- icon
- image reference
- CTA
- ordered array

Do not necessarily mutation-test every identical field when the underlying shared implementation has already been demonstrated.

---

# 11. Sanity Dataset Safety

Before content mutation determine the active dataset.

Running Studio on localhost does NOT mean the content is local.

Preferred automated test environment:

`development` or `staging` dataset

Production content should not be used for broad destructive automated testing.

If testing must use production:

- use minimal temporary modifications
- save original values
- restore immediately
- never bulk delete
- never overwrite unrelated content
- never leave QA placeholders behind

Do not create, clone, import or switch datasets without first understanding current environment configuration and implications.

---

# 12. Bandwidth-Safe Playwright Testing

Sanity bandwidth is limited.

Images and video can consume significant traffic.

Routine automated tests should therefore avoid downloading heavy Sanity assets.

## Default policy

For normal:

- page auditing
- navigation tests
- localization tests
- text tests
- form tests
- CMS data tests
- responsive structure tests

block unnecessary heavy Sanity image/video requests.

Do not block Sanity content API traffic required for page data.

---

# 13. Playwright Request Interception

Use Playwright request interception for bandwidth-heavy media where appropriate.

Conceptual pattern:

```ts
await page.route("**/*", async (route) => {
  const request = route.request();
  const url = request.url();
  const type = request.resourceType();

  const isSanityAsset =
    url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com");

  const isHeavyMedia = type === "image" || type === "media";

  if (isSanityAsset && isHeavyMedia) {
    await route.abort();
    return;
  }

  await route.continue();
});
```

Before permanently adding test helpers, inspect the actual asset domains and existing test architecture.

Do not blindly block all images if a test requires layout or media verification.

---

# 14. Media Testing Levels

Use three levels of media testing.

## Level 1 — Reference verification

Default.

Verify:

- asset reference exists
- asset ID changed
- image/video URL changed
- DOM/source attributes changed

Do not download media unnecessarily.

## Level 2 — Lightweight rendering verification

When actual rendering matters:

- allow the specific asset
- use optimized/resized image URLs where possible
- avoid original high-resolution downloads
- load only representative media

## Level 3 — Real media behavior

Use only for tasks specifically involving media behavior.

Examples:

- video playback
- poster transition
- video controls
- image crop behavior
- media-specific responsive behavior

Do not use Level 3 during routine whole-site regression runs.

---

# 15. Video Policy

Routine Playwright regression tests must not play video.

Verify:

- component exists
- correct source/reference exists
- poster exists where expected
- controls/configuration are correct
- autoplay behavior is correct

Where consistent with intended UX, video should avoid unnecessary eager downloading.

Prefer lazy media loading and `preload="none"` where appropriate.

Only play video when specifically testing video functionality.

---

# 16. Image Policy

Routine CMS tests usually do not need to download the final image.

For image CMS testing prefer:

Sanity reference
→ frontend image URL/reference

verification.

When visual rendering must be tested:

- use transformed image dimensions
- avoid original-resolution assets
- avoid repeating the same expensive rendering test across every viewport unless necessary

---

# 17. Responsive Testing

Every migrated page should receive representative checks on:

- mobile
- tablet
- desktop

Check:

- content order
- overflow
- clipping
- typography
- buttons
- navigation
- grids
- cards
- image containers
- video containers
- spacing

When heavy media is blocked, distinguish:

layout failure caused by missing test asset

from

actual frontend layout failure.

Perform a targeted media-enabled test when necessary.

---

# 18. Studio Testing

Where authentication allows Playwright to interact with Sanity Studio, verify representative workflows:

- document opens
- fields render
- editing works
- validation works
- arrays reorder
- icon selection works
- image selection works
- Publish works
- no relevant editor errors occur

Do not make destructive changes.

If browser automation cannot pass authentication, report the limitation explicitly.

---

# 19. Definition of Fully Migrated Page

A page may be marked COMPLETE only when:

- actual rendered page was inspected
- all sections were inventoried
- appropriate editorial content is mapped to Sanity
- hardcoded editorial content is removed where appropriate
- queries work
- frontend rendering works
- Studio order makes sense
- editor labels are understandable
- unnecessary technical fields are hidden
- validation works
- representative changes were tested
- Publish was tested where safe
- frontend update was verified
- test values were restored
- localization was checked
- responsive behavior was checked
- no relevant runtime errors remain

---

# 20. Full-Site Migration Status

> **Audit pass: 2026-09-01 (inventory & audit only — no code, schema, or content changes).**
> Method: read-only inspection of `app/`, `sanity/`, `lib/`, `MIGRATION_REPORT.md` (Parts 16–28),
> live GROQ reads against the `production` dataset, and a Playwright walk of every public route
> at `http://localhost:3000` (EN + spot-checks in DA/UK). Studio UI could not be opened
> (login-gated: Google / GitHub / email — no credentials); Studio findings below are from the
> schema/structure source, not the running Studio.

## 20.1 Content architecture (as built)

- Every page is now **one `page` document** (`_type == "page"`, fixed id `page-<slug>`) holding an
  ordered `sections[]` array built from the shared `pageSection` object (see
  `sanity/schemaTypes/documents/page.ts`, `objects/pageSection.ts`, `objects/contentItem.ts`,
  `objects/ctaAction.ts`, `objects/mediaItem.ts`). This replaced ~18 per-page singletons to stay
  under Sanity's free-plan 2,000-attribute cap (MIGRATION_REPORT Parts 16–17).
- **All 12 legacy page singletons are deleted from the dataset** (`homePage`, `aboutPage`,
  `cateringPage`, `cateringMenuExamplesPage`, `eventDecorationPage`, `hostAtRorumPage`,
  `communityMembershipPage`, `volunteerPage`, `workWithUsPage`, `contactPage`, `eventsPage`,
  `faqPage` — confirmed 0 documents each). Their **schema type definitions and GROQ queries are
  still registered** (`schemaTypes/index.ts`, `queries/pages.ts` / `queries/faq.ts` /
  `queries/events.ts`) and 8 route files still fetch the dead singleton query alongside
  `pageByKeyQuery` — always returns `null`, harmless, but dead weight. Phase 6 schema cleanup is
  **not done** (disclosed in Part 17 §17.4).
- Locale resolution is in application code (`lib/sanity-i18n.ts` `pickLocalized()` /
  `lib/sanity-sections.ts`), not GROQ. i18n storage = `sanity-plugin-internationalized-array`
  (EN/DA/UK), registry is static in `sanity.config.ts` (do not filter it — see the long comment there).
- 12 `page` documents exist: the 11 routed pages below + `page-catering-menu-examples`
  (in-page overlay opened from `/catering`, no route, `seo` field intentionally hidden).

## 20.2 Real route list

Route segment: `app/[locale]/(site)/<route>/page.tsx`. `en` is unprefixed; `da`/`uk` are prefixed
(`middleware.ts`). Legacy redirects: `/private-meetings` & `/host-an-event` → `/host-at-rorum`,
`/space-decoration-event-styling` → `/event-decoration`.

| # | Route | `page` doc / source | CMS coverage | Status |
|---|---|---|---|---|
| 1 | `/` (Home) | `page-home` | **Fully connected** (pilot). Hero text/video/trust items, quick paths (title/text/CTA/icon), events strip labels, 2 editorial feature blocks, services teaser, community teaser, closing CTA, SEO — all from `page-home.sections`. SEO title+description published EN/DA/UK. Events themselves from `event` docs. | COMPLETE |
| 2 | `/about` | `page-about` | **Fully connected.** Hero + 2 quick links, Services teaser, Community teaser, "Thoughtful and practical" text section, closing CTA, SEO. `aboutPage.locationImage` confirmed dead (never migrated, by design). | COMPLETE |
| 3 | `/events` (listing) | `page-events` + `event[]` | **Fully connected.** Hero H1, filter-group labels + language-option labels (reorderable), closing CTA. Event cards from `event` docs, locale-filtered by `visibleLocales`. `formMessages`/`eventMessages` shared. | COMPLETE |
| 4 | `/events/[slug]` (event detail) | `event` doc | **Fully connected.** Title, description, date/time, address, language, price, "What to Expect", "Practical Details", included list, share actions (per-event enable/label), ticket/calendar/waitlist URLs, image + alt, per-event SEO override, Event JSON-LD. Static fallback array in `lib/data.ts` only used when Sanity is unconfigured. | COMPLETE |
| 5 | `/catering` | `page-catering` (+ `page-catering-menu-examples`) | **Fully connected.** Hero + CTA, Menu Formats icon grid, "What we offer" list, 3-step setup, ~66-image `HorizontalGallery`, tailored-note, inquiry form. Menu Examples overlay = `page-catering-menu-examples` (6 dish categories). SEO empty on the published doc — approved copy is in `drafts.page-catering`, awaiting manual Publish (§20.7); frontend falls back correctly. | COMPLETE |
| 6 | `/event-decoration` | `page-event-decoration` | **Fully connected.** Hero + CTA, "Suitable Decoration Formats" chips + gallery (14 photos, DA/UK alt backfilled, real video supported), "What we style" split (intro migrated into section `text`), 3-step setup, inquiry form. | COMPLETE |
| 7 | `/host-at-rorum` | `page-host-at-rorum` | **Fully connected.** Hero, 15-photo gallery (DA/UK alt backfilled), "Each Session Includes", Hosting Packages (3 tiers, price + checklist), 3-step setup, inquiry form. Package `<select>` + Additional-Services checkboxes now driven by the same canonical Sanity items as the cards (stable `itemKey` values, not localized labels). | COMPLETE |
| 8 | `/community-membership` (WECODA) | `page-community-membership` | **Fully connected.** Hero (intro migrated into `text`, external WECODA link + apply-CTA DA/UK fixed), Donation section (9 bank rows, 2 copyable — bug fixed, QR image), "Connecting Women" 2-column intro, "What You Gain" benefit grid (image authoritative over icon), Application section + steps, gallery (8 photos + 2 videos, DA/UK alt backfilled). | COMPLETE |
| 9 | `/volunteer` | `page-volunteer` | **Mostly connected.** Hero eyebrow + heading + body copy + "Apply to volunteer" CTA from Sanity. The **application modal** (`VolunteerApplicationForm` / `ApplicationModal`) copy is EN-only in Sanity (pre-existing gap, Part 17 §17.5) and has **no automated test coverage** (Part 22 §5). Form does not submit anywhere. | PARTIAL |
| 10 | `/work-with-us` | `page-work-with-us` | **Mostly connected.** Hero + body copy + "Send your CV" / "Work with us" CTAs from Sanity. The **CV upload modal** (`CvUploadModal`) copy is EN-only in Sanity (pre-existing gap) and has no automated test coverage. Form does not submit anywhere. | PARTIAL |
| 11 | `/contact` | `page-contact` + `contactInfo` + `socialLinks` + `formMessages` | **Fully connected.** Hero (intro text, reorderable address/phone/email rows), form section (4 configured fields Full Name/Phone/Email/Message, privacy-consent show/require, FAQ-prompt override), map, social icons (Instagram+Facebook after the R3 guard). The "0 form fields" seen during the audit was a stale dev-server cache (B1 — resolved, not a code defect); the clean build renders all fields + working validation. SEO empty on the published doc — approved copy in `drafts.page-contact` (§20.7). | COMPLETE |
| 12 | `/faq` | `page-faq` | **Structurally connected, content gap.** 4 categories / 9 questions render from `page-faq` (`faqCategory` sections, per-question optional link supported). Category titles / questions / answers are **EN-only** — `/da/faq` and `/uk/faq` show English (pre-existing, `faqGroup` never translated; Part 17 §17.5). Legacy `faqPage`/`faqGroup` schema kept, unused. | PARTIAL |
| 13 | `/terms` | `legalPage-terms` | **Connected.** Body = Portable Text from `legalPage`. DA/UK bodies mostly translated but some headings still EN (e.g. "1. Company details" on `/da/terms`). `legalPage.seo` fields exist but the approved SEO copy was **skipped pending owner decision** (Part 24 §6) — `<title>` shows the short MVP fallback ("Terms") and is not localized. Company facts (`getCompanyContactFacts`) still from `lib/siteContent.ts`/`siteConfig.ts`, not Sanity. | PARTIAL |
| 14 | `/privacy-policy` | `legalPage-privacy-policy` | Same as `/terms`. | PARTIAL |
| 15 | `/cookie-policy` | `legalPage-cookie-policy` | Same as `/terms`. | PARTIAL |

Non-public / infra routes: `/studio` (Sanity Studio, `noindex`, disallowed in robots.txt),
`/sitemap.xml`, `/robots.txt` — all correct, canonical domain `https://ro-rum.dk`, hreflang +
x-default present, 143 sitemap `<loc>` entries.

## 20.3 Shared / global areas

| Area | Source | Coverage | Notes |
|---|---|---|---|
| Header / primary nav | `navigation` singleton | **Fully connected**, trilingual | Items + dropdown children (`navChild`/`navItem`). `lib/data.ts` `navItems` is fallback only. |
| Footer | `footer` singleton | **Fully connected**, trilingual | 4 link columns, contact-details label, copyright, 3 legal links — all EN/DA/UK. |
| Contact info | `contactInfo` singleton | **Fully connected** | address / phone / email / `mapQueryAddress`. Shared by Contact page, Footer, event practical details. |
| Social links | `socialLinks` singleton | **Connected, data-quality issue — see risk R3** | Published doc has Instagram, Facebook **and a stray LinkedIn entry (`https://linkedin.com`)**; `platform` unset on all 3 entries. Part 22 decision: RORUM has no LinkedIn — it was to be removed by publishing `drafts.socialLinks`, but that draft **no longer exists** and LinkedIn is still live in Header/Footer/Contact. |
| Shared form messages | `formMessages` singleton | **Connected** | Labels/placeholders/validation/success/privacy/FAQ-prompt text used by every form. |
| Shared event labels | `eventMessages` singleton | **Connected** | Event-detail UI strings. |
| Site settings | `siteSettings` singleton | **Partially connected** | `siteUrl` now fixed/read-only `https://ro-rum.dk`; `website` editable. `defaultSeo` (site-wide SEO fallback tier) is **not populated** — pages fall to their own per-page hardcoded defaults. |
| SEO / metadata | `page.seo` / `legalPage.seo` / `event.seo` + `shared/seoResolution.ts` + `lib/seo.ts` | **Connected** | Shared resolver, per-locale, canonical/hreflang/OG/Twitter/JSON-LD. Studio "Search engine & social sharing" panel with live preview (`SeoObjectInput`). Gaps: legal-page SEO copy skipped (R4); several `page.seo` drafts unpublished (R1/R2). |
| Legal / company facts | `lib/siteContent.ts`, `lib/siteConfig.ts` | **Hardcoded** | CVR, company name, address facts rendered on legal pages are still in code, not Sanity. Low priority (rarely changes) but not manager-editable. |
| Gallery collections | `galleryCollection` / `mediaItem` | **Connected** | Used by Catering / Event Decoration / Host / Community galleries via `lib/sanityGallery.ts` (canonical-vs-legacy policy). |
| Cookie / privacy consent UI | `PrivacyConsent` / `PrivacyPolicyModal` | **Connected via `formMessages` + `legalPage-privacy-policy`** | Consent copy from `formMessages`; modal body from the privacy `legalPage`. |
| Forms (all) | `Formspree` wiring in `lib/formspree.ts` | **Not delivering** | Contact / Catering / Decoration / Host / Volunteer / CV forms validate client-side but **no form actually submits** to a backend/endpoint (disclosed repeatedly in Parts 21/23). Product decision needed. |

## 20.4 Per-page audit checklist (this pass)

Legend: ✅ verified this pass · ⬜ not verified this pass · ⚠️ verified, issue found · n/a not applicable

| Page | rendered audited | sections inventoried | Sanity coverage mapped | text | images | icons | CTAs | localization (DA/UK) | Studio UX (schema-only) | Publish test | responsive (m/t/d) | console clean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (UK full) | ✅ | ⬜ | ⬜ | ✅ |
| About | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Events listing | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ (filter labels) | ✅ | ⬜ | ⬜ | ✅ |
| Event detail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Catering | ✅ | ✅ | ✅ | ✅ | ✅ (66) | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Event Decoration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Host at RORUM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Community Membership | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Volunteer | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ |
| Work With Us | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ |
| Contact | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ (Phase 1, clean build) | ✅ |
| FAQ | ✅ | ✅ | ✅ | ⚠️ EN-only | n/a | n/a | ✅ | ⚠️ | ✅ | ⬜ | ⬜ | ✅ |
| Terms / Privacy / Cookie | ✅ | ✅ | ✅ | ⚠️ partial DA/UK | n/a | n/a | ✅ | ⚠️ | ✅ | ⬜ | ⬜ | ✅ |

Publish tests and responsive (mobile/tablet/desktop) checks were **out of scope for the
inventory pass** and remain to be done per-page during implementation — except **Contact**, which
was fully re-verified during Phase 1 (B1): all form fields render, validation works (empty-submit,
invalid email/phone, success + reset), EN/DA/UK labels, no overflow at 375 / 768 / 1440, against
a clean production build.

## 20.5 Blockers and risks

**B1 — Contact form renders no input fields → RESOLVED (was a stale dev-server cache, not a code defect). Phase 1, 2026-09-01.**
Root cause: `next-sanity`'s `sanityFetch` (`sanity/lib/live.ts` → `defineLive`) caches every query
with `next: { revalidate: false }` and only ever revalidates via `<SanityLive>` sync-tag events.
The long-running `next dev` server on :3000 held a `page-contact` snapshot from **before** the
Part 21/23 form-field seeding, and `<SanityLive>` never fired a revalidation for it (the content
changed while that dev process was not the one listening), so `resolveContactFormFields()` was
handed a form section with no `field-*` items and correctly returned `[]`.
Verified on a **clean isolated production build** (`RORUM_DIST_DIR=.next-prodtest next build` →
`next start -p 3210`): `/contact`, `/da/contact`, `/uk/contact` all render Full Name / Phone /
Email / Message + privacy consent + submit; empty-submit shows all 5 required errors; invalid
phone/email show format errors; a valid submit shows the success state and resets; no horizontal
overflow at 375 / 768 / 1440. Production (fresh build per deploy + a working `<SanityLive>` socket)
is unaffected. **No code change made.** Local dev fix: restart the dev server, or `rm -rf .next`
(this pass already cleared `.next/cache/fetch-cache`, which is disk-only — the running process
still holds the stale entry in memory until restarted).
The `page-contact` published document itself is correct and complete (verified via GROQ against
both `api` and `apicdn`).

**R1 / R2 — approved SEO copy is sitting in 13 unpublished drafts → checklist prepared, see §20.7. Phase 1, 2026-09-01.**
The Part 24 backfill (`scripts/backfill-seo-copy.ts`) **did run and its drafts still exist** — 13
of them (they were invisible to a default-perspective GROQ query, which collapses `drafts.*`;
visible with `perspective: "raw"`). Published SEO is empty on ~10 pages; the frontend correctly
falls back to each page's own hardcoded English `fallback.seoTitle` / `fallback.description`
(verified on the clean build — `/da/catering` etc. show the English fallback, no broken/empty
`<title>`). `page-home` SEO is already fully published EN/DA/UK (the earlier "renders code
fallback" note was the stale :3000 server + coincidental string equality — corrected).
**Not published or mutated.** §20.7 is the exact per-draft publish checklist, including two drafts
that carry a real non-SEO regression if published blindly.

**R3 — stray LinkedIn social link → FIXED in code (frontend guard). Phase 1, 2026-09-01.**
Intent was unambiguous from history: Part 22 + `socialLink.ts`'s `SELECTABLE_PLATFORMS` narrowed
to Instagram + Facebook; RORUM has no LinkedIn profile for the shared list. `drafts.socialLinks`
(the intended cleanup) no longer exists, and the published `socialLinks` singleton still carries a
`{icon:"linkedin", href:"https://linkedin.com"}` entry that renders in Header, Footer and Contact.
Since production Sanity must not be mutated here, `lib/sanityContact.ts`'s `resolveSocialLinks()`
now filters `links[]` to `RENDERED_SOCIAL_PLATFORMS` (Instagram, Facebook) before mapping — so the
stray LinkedIn (and any future out-of-list value, or a link with no platform) never reaches the
rendered site. Instagram + Facebook preserved, in order; no URL invented. A doc containing only
out-of-list links returns `[]` (never resurrects the hardcoded fallback). Verified on the clean
build: `linkedin` appears **0 times** in `/contact` and `/about` HTML; Header mobile menu, Footer
and the Contact social nav all show Instagram + Facebook only. Event Share's separate LinkedIn
support is untouched (`components/EventShare.tsx`).
**Still needs a manual Studio action** (not blocking, not mutated by this pass): delete the
`linkedin` entry from the `socialLinks` singleton so the published document stops showing the
schema's "Value 'linkedin' did not match any allowed values" error. Until then the guard keeps the
live site correct.

**R4 — Legal-page SEO copy decision outstanding.**
Terms/Privacy/Cookie EN `seo.title`/`seo.description` were deliberately NOT overwritten with the
approved long copy (current values are the short MVP originals). `<title>` is not localized for
these routes. Needs an owner yes/no (Part 24 §6).

**R5 — DA/UK content gaps (pre-existing, not introduced by migration).**
- FAQ: all category titles / questions / answers EN-only.
- Legal pages: some section headings still English in DA/UK bodies.
- Volunteer application modal + Work-With-Us CV modal: copy EN-only.
- `sanity:audit-translations` baseline (Part 17 §17.5): ~139 gaps under `page` (mostly gallery/
  dish alt text, form-modal copy), 73 under `event`, 6 under `legalPage`, 1 under `socialLinks`.
Fixing requires authoring real DA/UK translations — a content task, needs owner sign-off on
provenance.

**R6 — No form actually submits anywhere.**
Every form on the site (Contact, Catering, Decoration, Host, Volunteer, CV) is client-side
validation only — no endpoint / email provider. This is a product decision, disclosed since
Part 21. Volunteer/CV forms additionally have zero automated test coverage.

**R7 — Dataset safety: automated mutation testing targets `production`.**
`.env.local` → `NEXT_PUBLIC_SANITY_DATASET=production`, and a **write token is present**
(`SANITY_API_WRITE_TOKEN`). There is no separate dev/staging dataset. Any Publish-flow test must
follow §11/§18: record → change draft only where possible → publish → verify → restore → verify.
Prefer never bulk-mutating; consider requesting a `staging` dataset before heavy CMS test work.

**R8 — Legacy schema/query dead weight (cleanup, not a blocker).**
12 deleted-singleton schema types still registered in `schemaTypes/index.ts`; `queries/pages.ts`
etc. still export their queries; 8 route files still fetch a guaranteed-`null` legacy query
alongside `pageByKeyQuery`. Also `sanity.types.ts` / `schema.json` should be re-checked with
`npm run sanity:typegen` for drift. Phase 6 cleanup (MIGRATION_REPORT §17.4) is unstarted.

**R9 — Studio UX not verified against the running Studio.**
Login-gated; this pass reviewed schema source only. `pageSection.ts` has grown a large set of
document-scoped `hidden` special-cases (Contact/Events/Event Decoration/Host/Community/About)
plus one site-wide `isCorrectlyShapedSection()` rule — maintainable-but-dense; worth a real
Studio walkthrough per page (field order, labels, previews, reorderability, validation clarity)
before declaring any page's Studio UX "done" to spec §19.

**R10 — Running dev server may be serving stale cached CMS data (see B1).**
Treat rendered-output observations from this audit as indicative, not authoritative, until
re-verified against a fresh production build.

## 20.6 Recommended implementation order

**Phase 1 (done, 2026-09-01):** B1 diagnosed (stale cache, no code change), R3 fixed in code,
R1/R2 checklist prepared (§20.7), R8 plan produced (§20.8).

**Next batch (Phase 2), in order:**

1. **Manual: publish the SEO drafts** per the §20.7 checklist — start with the 11 clean pages,
   then handle `legalPage-terms` + `legalPage-privacy-policy` carefully (they lose `lastUpdated`
   on publish — re-set it in Studio right after). Then re-run
   `npx playwright test tests/cms-catering-contract.spec.ts tests/seo.spec.ts` to re-green the
   SEO assertions.
2. **Manual: delete the `linkedin` entry** from the `socialLinks` singleton in Studio (the R3
   code guard already hides it on the site, but the published document keeps a schema validation
   error until the entry is gone).
3. **R8 — Phase 6 schema/query cleanup** (§20.8). Code-only, no Sanity writes. Removes the 12
   dead singleton types + their queries + the 9 redundant legacy fetches; re-run
   `npm run sanity:typegen`; full `npm run typecheck` + `npm run test:unit` + `npm run test:e2e`
   + `npm run build`.
4. **R4 — Legal-page EN SEO decision** (owner): keep the short MVP copy, or apply the approved
   long copy (already in the drafts' DA/UK; EN was intentionally left). Then publish.
5. **R9 — Studio UX walkthrough**, page by page, in the real Studio with the manager — confirm
   field order/labels/previews/reorder/validation against spec §10 and §19. Fold in a
   representative Publish test per page (§18) using draft-only changes on `production`.
6. **R5 — DA/UK content authoring** (FAQ, legal-page headings, form-modal copy) with the owner.
7. **R6 — Form delivery** (product decision: wire a real endpoint; add Volunteer/CV form tests).
8. **Responsive + Publish sign-off** for every page (§19 items still ⬜ in 20.4), then mark
   COMPLETE.

## 20.7 SEO publish checklist (Phase 1 — 2026-09-01, read-only analysis; nothing published)

Method: `perspective: "raw"` GROQ read of every `page` / `legalPage` document, published vs
draft, plus a full structural diff of each draft against its published counterpart. The Part 24
`scripts/backfill-seo-copy.ts` drafts **still exist** (13 of them) and hold the correct approved
`seo.title` / `seo.description` for EN/DA/UK. Publishing each draft is a **manual Studio action**.

**Frontend fallback is currently correct** — every page with an empty published `seo` renders its
own hardcoded English `fallback.seoTitle` / `fallback.description` (verified on a clean build:
`/da/catering`, `/da/about`, `/da/faq` etc. show the English fallback title, never an empty or
broken `<title>`). Publishing the drafts adds the real localized values; it cannot regress the
EN `<title>` (the approved EN copy equals each page's existing fallback constant).

| Document | Publish the draft? | What publishing it does |
|---|---|---|
| `page-home` | **No draft, nothing to do** | SEO already published EN/DA/UK. |
| `page-catering-menu-examples` | **No draft, nothing to do** | No route; `seo` field hidden by design. |
| `page-about` | **Yes — clean** | Adds `seo.title` + `seo.description` EN/DA/UK. Only change vs published. |
| `page-catering` | **Yes — clean** | Same. |
| `page-events` | **Yes — clean** | Same. |
| `page-faq` | **Yes — clean** | Same. |
| `page-volunteer` | **Yes — clean** | Same. |
| `page-work-with-us` | **Yes — clean** | Same. |
| `page-contact` | **Yes — clean-ish** | Adds SEO EN/DA/UK. Also: 2 empty i18n `label` rows (no value — invisible) and one `pageSection.settings` row `privacyConsentRequired="true"` which is the **existing default behavior** (`resolvePrivacyConsentSettings` treats absent = required). No functional change. |
| `page-community-membership` | **Yes — review first** | Adds SEO EN/DA/UK (only 1 SEO diff — its `seo` was slightly less empty). Also carries ~13 non-SEO diffs: 12 are empty i18n `label` rows (no value — invisible); **1 is real** — `sections[4].items[3]` (`step3`) gets `icon: "Activity"` set (published has none). Confirm that icon is wanted, or clear it in Studio after publishing. |
| `page-event-decoration` | **Yes — clean** | Adds SEO (5 diffs). 2 empty i18n `label` rows otherwise. |
| `page-host-at-rorum` | **Yes — clean** | Adds SEO. 6 empty i18n `label` rows otherwise (no values). |
| `legalPage-cookie-policy` | **Yes — clean** | Adds `seo.title` + `seo.description` DA/UK (EN unchanged — stays "Cookie Policy" / short copy, the R4 decision). |
| `legalPage-terms` | **Yes — ⚠ REGRESSION RISK** | Adds SEO DA/UK (EN unchanged). **BUT the draft has `lastUpdated` UNSET while published has `"2026-05-01"`** — publishing blanks the "Last updated: May 2026" line on `/terms`. After publishing, **re-enter the "Last updated" date in Studio** (or discard+recreate the draft SEO-only). |
| `legalPage-privacy-policy` | **Yes — ⚠ REGRESSION RISK** | Same `lastUpdated` issue as Terms. Re-enter the date after publishing. |

**Alternative (needs explicit owner authorization — not done):** instead of publishing the
8-day-old drafts, a small script can patch **only** `seo.title` / `seo.description` onto each
*published* document directly (revision-guarded), then discard the stale drafts — avoiding the
empty-row residue, the `step3` icon, and the `lastUpdated` regression entirely. Say the word and
this can be written (dry-run first, per §10/§11).

## 20.8 R8 — dead-code cleanup plan (preparation only; nothing removed this pass)

The `page` + `sections[]` migration (Parts 16–17) deleted all 12 legacy per-page singleton
**documents** but left their **schema types, queries and some fetch call-sites** in place for
rollback/typegen safety (Part 17 §17.4 — "the honest way to finish this refactor, not yet done").
Confirmed this pass: **0 documents** exist for any of the 12 legacy types.

**A. Legacy singleton schema types — remove all 12** (`sanity/schemaTypes/singletons/`):
`homePage.ts`, `aboutPage.ts`, `cateringPage.ts`, `cateringMenuExamplesPage.ts`,
`eventDecorationPage.ts`, `hostAtRorumPage.ts`, `communityMembershipPage.ts`, `volunteerPage.ts`,
`workWithUsPage.ts`, `contactPage.ts`, `eventsPage.ts`, `faqPage.ts`.
Then in `sanity/schemaTypes/index.ts`: drop the 12 imports + array entries, and prune
`SINGLETON_TYPES` (remove those 12 names — keep the real singletons: `siteSettings`,
`contactInfo`, `socialLinks`, `navigation`, `footer`, `formMessages`, `eventMessages`).
`PAGE_KEYS` / `LEGAL_PAGE_KEYS` stay. `sanity.config.ts`'s `newDocumentOptions` /
`document.actions` special-casing can be simplified (they already also check `"page"` /
`"legalPage"`, which is what still matters).

**B. Dead queries — remove:**
- `sanity/queries/pages.ts`: `homePageQuery`, `aboutPageQuery`, `cateringPageQuery`,
  `cateringMenuExamplesPageQuery`, `eventDecorationPageQuery`, `hostAtRorumPageQuery`,
  `communityMembershipPageQuery`, `contactPageQuery`, `volunteerPageQuery`, `workWithUsPageQuery`.
  **Keep `legalPageQuery`** (live — used by the 3 legal routes + `layout.tsx`).
- `sanity/queries/faq.ts`: `faqPageQuery` (file then only re-exports nothing — can delete the file,
  update `faq/page.tsx`).
- `sanity/queries/events.ts`: `eventsPageQuery` (dead export — never imported). Keep the rest.

**C. Redundant fetch call-sites — remove the legacy `sanityFetch` + its result-merge branch**
(each currently fetches a guaranteed-`null` doc and threads a `?? legacyPage?.x` fallback that can
never fire — mirror the Home fix already applied in `app/[locale]/(site)/page.tsx`):
`about/page.tsx` (`aboutPageQuery`), `event-decoration/page.tsx` (`eventDecorationPageQuery`),
`host-at-rorum/page.tsx` (`hostAtRorumPageQuery`), `community-membership/page.tsx`
(`communityMembershipPageQuery`), `volunteer/page.tsx` (`volunteerPageQuery`),
`work-with-us/page.tsx` (`workWithUsPageQuery`), `contact/page.tsx` (`contactPageQuery`),
`faq/page.tsx` (`faqPageQuery`). `catering/page.tsx` already only uses `pageByKeyQuery` — no
change. `events/page.tsx` never imported `eventsPageQuery` — no change.
The `lib/content-contracts/*.ts` files (`about.ts`, `catering.ts`, `events-studio-visibility.ts`,
`about-studio-visibility.ts`) reference these by name in prose — update those notes or mark them
historical.

**D. Typegen drift:** after B is done, run `npm run sanity:typegen` — it regenerates
`sanity.types.ts` + `schema.json`, dropping ~13 now-unused `*PageQueryResult` types and the 12
singleton document types. Review the `git diff` (expect it to only shrink). This is the only step
that touches generated files.

**E. Verification for the whole of R8:** `npm run typecheck`, `npm run lint`,
`npm run test:unit`, `npm run test:e2e`, `npm run build`. No Sanity writes anywhere in R8.

**Not required by Phase 1 items 1–3 — do it as its own dedicated pass.**

---

# 21. Shared Components

Audited in §20.3. In-repo shared components and their CMS sources:

- `components/Header.tsx` → `navigation` singleton (+ `contactInfo` for the top bar).
- `components/Footer.tsx` → `footer` + `contactInfo` + `socialLinks` singletons.
- `components/SiteShell.tsx` / `app/[locale]/(site)/layout.tsx` → fetches nav/footer/formMessages/
  privacy `legalPage`/contactInfo/socialLinks once and passes plain resolved data down.
- `components/ui.tsx` `CTASection` / `SectionHeader` / `HomeHero` — presentational; content comes
  from each page's `page.sections`.
- `components/HorizontalGallery.tsx` — Catering / Event Decoration / Host / (Community uses its
  own `resolveMembershipMedia`). Mixed photo+video, unified Lightbox (Parts 18–19).
- `components/FAQAccordion.tsx` / `FAQInlinePrompt.tsx` — `page-faq` + `formMessages`.
- Forms: `ContactForm`, `CateringInquiryForm`, `InquiryForm`, `VolunteerApplicationForm`,
  `CvUploadModal`, `ApplicationModal` — copy from `formMessages` + page-specific `contentItem`
  roles; **none submit** (R6).
- SEO: `lib/seo.ts` + `shared/seoResolution.ts` + `components/JsonLd.tsx` + `SeoObjectInput` /
  `SeoAllLanguagesInput` Studio components.

Shared components should get one representative deep Publish/interaction test and a regression
check on every page that reuses them.

---

# 22. Migration Reporting

`SANITY_MIGRATION.md` (this file) = current status and what remains (§20).
`MIGRATION_REPORT.md` = history and rationale (Parts 1–28; the `page`/`sections[]` migration is
Parts 16–28).

Do not duplicate large historical explanations here.
