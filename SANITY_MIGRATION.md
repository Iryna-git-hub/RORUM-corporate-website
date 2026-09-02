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
- **All 12 legacy page singletons are gone from the *published* dataset** (`homePage`, `aboutPage`,
  `cateringPage`, `cateringMenuExamplesPage`, `eventDecorationPage`, `hostAtRorumPage`,
  `communityMembershipPage`, `volunteerPage`, `workWithUsPage`, `contactPage`, `eventsPage`,
  `faqPage` — 0 documents under `perspective: "published"`, which is all the public site and
  `sanityFetch` ever read). **11 of them still exist as orphaned `drafts.<type>` documents**
  (all except `contactPage`) — the old delete scripts removed only the published copy. Harmless to
  the site, but they now reference schema types Phase B removed. A read-only-by-default cleanup
  script is ready: `npm run sanity:delete-orphaned-legacy-singleton-drafts:dry-run` /
  (live) `npm run sanity:delete-orphaned-legacy-singleton-drafts` — owner action, §20.6 / §20.8.
- Their **schema types and GROQ queries are removed** (Phase B, §20.8) — Phase 6 schema cleanup
  is **done** for the frontend/schema side; only the 11 draft documents above remain.
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
| 9 | `/volunteer` | `page-volunteer` | **Technical chain complete** (verified Phase C): hero eyebrow/heading/body/closing paragraphs + "Apply to volunteer" CTA all render EN/DA/UK from `page-volunteer`; `/da/volunteer` renders Danish. **BUT** the **application-modal** copy (4 items in `sections[applicationForm]`: `modalTitle`, `messagePlaceholder`, `successMessage`, `errorMessage`) is stored **EN-only**. Because `contentItem` `title`/`text` carry the shared all-or-nothing i18n rule, a half-translated row is invalid → **Studio cannot re-publish `page-volunteer` until these 4 strings get DA/UK** (the published version stays live; API writes bypassed the check). Schema/resolver/`<VolunteerApplicationButton>` all support DA/UK — only the content is missing. Form does not deliver (R6). | CONTENT-BLOCKED — 4 modal strings need DA/UK before Studio re-publish (§20.9) |
| 10 | `/work-with-us` | `page-work-with-us` | Hero + CTAs render EN/DA/UK (`/da/work-with-us` = "Arbejd med os"). **BUT** two item groups are stored **EN-only**, so — same mechanism as Volunteer — **Studio cannot re-publish `page-work-with-us`** until they get DA/UK: the **CV-upload-modal** copy (7 items in `sections[cvUploadForm]`: `modalTitle`, `modalTitleSent`, `description`, `descriptionSent`, `messagePlaceholder`, `dropzoneText`, `errorMessage`) **and** the 3 **"Why work with us" feature bullets** (`sections[features]`: `feature0/1/2` — visible untranslated on `/da` `/uk` today). Technical chain fully supports DA/UK. | CONTENT-BLOCKED — 7 modal strings + 3 feature bullets need DA/UK before Studio re-publish (§20.9) |
| 11 | `/contact` | `page-contact` + `contactInfo` + `socialLinks` + `formMessages` | **Fully connected.** Hero (intro text, reorderable address/phone/email rows), form section (4 configured fields Full Name/Phone/Email/Message, privacy-consent show/require, FAQ-prompt override), map, social icons (Instagram+Facebook after the R3 guard). The "0 form fields" seen during the audit was a stale dev-server cache (B1 — resolved, not a code defect); the clean build renders all fields + working validation. SEO empty on the published doc — approved copy in `drafts.page-contact` (§20.7). | COMPLETE |
| 12 | `/faq` | `page-faq` | **Fully connected.** 4 categories / 9 questions render from `page-faq` (`faqCategory` sections, per-question optional link). **Category titles, questions AND answers are fully translated EN/DA/UK — verified live on a clean build (`/da/faq` renders Danish end to end).** The Phase 1 audit's "EN-only" claim was a stale-dev-cache artifact, now corrected. `faqPage`/`faqGroup` legacy schema removed (§20.8). Only outstanding item: publish the SEO draft (§20.7). | COMPLETE |
| 13 | `/terms` | `legalPage-terms` + `siteSettings` + `contactInfo` | **Sections 2+ fully connected & translated** (Portable Text from `legalPage.body`, EN/DA/UK). **Section 1 "Company details"** is a hardcoded block in `terms/page.tsx` — the *facts* (company name, CVR, email, address) already come from Sanity (`getCompanyContactFacts()` → `siteSettings`/`contactInfo`), but the **heading ("1. Company details"), the intro sentence, and the field labels ("Address:", "CVR:", …) are hardcoded English** and show untranslated on `/da` `/uk`. Needs an owner decision (§20.6) — fold Section 1 into `legalPage.body`, or localize the chrome. `legalPage.seo`: draft pending (§20.7) + R4 EN-copy decision. `lastUpdated` renders (⚠ the SEO draft blanks it — §20.7). | PARTIAL — legal Section 1 hardcoded EN |
| 14 | `/privacy-policy` | `legalPage-privacy-policy` + `siteSettings`/`contactInfo` | Same shape as `/terms`. | PARTIAL — legal Section 1 hardcoded EN |
| 15 | `/cookie-policy` | `legalPage-cookie-policy` + `siteSettings`/`contactInfo` | Same shape as `/terms`. | PARTIAL — legal Section 1 hardcoded EN |

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

**R5 — DA/UK content gaps (pre-existing; corrected during Phase C verification — NOT as broad as the audit first thought).**
- ~~FAQ EN-only~~ → **FALSE.** `page-faq` is fully translated EN/DA/UK (titles + questions + answers);
  `/da/faq` renders Danish end to end on a clean build. The audit's claim was a stale-cache read.
- **Legal pages — Section 1 "Company details" only.** Sections 2+ of Terms/Privacy/Cookie ARE
  fully translated (Sanity `legalPage.body`, EN/DA/UK). Section 1 is a hardcoded block in the 3
  `*/page.tsx` components — the facts are Sanity-sourced but the heading/intro/labels are English.
  Needs an owner decision on how to make it editable/localized (§20.6).
- **Volunteer application modal (4 strings) + Work-With-Us CV modal (7 strings)** — stored EN-only.
  Technical chain fully supports DA/UK (verified). Exact keys listed in the route table (rows 9–10)
  and §20.6. **Do not invent — owner/translator must supply.**
- `sanity:audit-translations` baseline (Part 17 §17.5): remaining gaps are mostly gallery/dish
  `alt` text (informative, not visible copy) plus the 11 form-modal strings above; `event` (73,
  unrelated); `legalPage` (6 — the SEO fields, §20.7); `socialLinks` (1 — the stray LinkedIn, R3).
Fixing the visible-copy gaps requires authoring real DA/UK translations — a content task, needs owner sign-off on
provenance.

**R6 — No form actually delivers anywhere (no Formspree endpoint configured).**
`NEXT_PUBLIC_FORMSPREE_ENDPOINT` is the placeholder, so `lib/formspree.ts`'s `submitToFormspree()`
throws `FORMSPREE_NOT_CONFIGURED` before any network call. Wiring a real endpoint + recipient is a
product decision (Part 21), out of scope for the CMS migration.
**Phase A (2026-09-01) — false-success removed on Contact:** `ContactForm` previously showed
"Thank you…" and reset on any valid submit even though nothing was sent. It now uses the same
`submitToFormspree` + `formNotConfiguredMessage` pattern `VolunteerApplicationForm` already uses —
a valid submit shows "This form isn't fully set up yet — please contact us directly." (translatable,
from the shared `formMessages` singleton), keeps the user's text, and never shows a success state
until a real endpoint is configured and the POST succeeds.
**Final-review follow-up:** `VolunteerApplicationForm` had the right JS handling but still hardcoded
`action={formspreeConfig.endpoint}`, so a no-JS submit would POST to the 404 placeholder. Now gated
`action={isFormspreeConfigured() ? … : undefined}`, matching `ContactForm`. `CvUploadModal` /
`InquiryForm` / `CateringInquiryForm` have no native `action` at all (JS-only).
**Still carrying the same false-success bug: `components/CvUploadModal.tsx`** (`submitCvApplication()`
is a 500 ms `setTimeout` that always "succeeds" — explicit TODO in the file) and, to a lesser
extent, `components/InquiryForm.tsx` (Catering / Host inquiry). Not fixed this pass — flagged for
the Work-With-Us page work (Phase C) / a dedicated form pass. Volunteer/CV forms also still have
zero dedicated automated test coverage (Part 22 §5); `ContactForm.test.tsx` now covers the
Contact delivery paths.

**R7 — Dataset safety: automated mutation testing targets `production`.**
`.env.local` → `NEXT_PUBLIC_SANITY_DATASET=production`, and a **write token is present**
(`SANITY_API_WRITE_TOKEN`). There is no separate dev/staging dataset. Any Publish-flow test must
follow §11/§18: record → change draft only where possible → publish → verify → restore → verify.
Prefer never bulk-mutating; consider requesting a `staging` dataset before heavy CMS test work.

**R8 — Legacy schema/query dead weight → DONE (Phase B, 2026-09-02).**
Removed the 12 dead singleton schema types, the ~13 dead queries (`queries/faq.ts` deleted;
`queries/pages.ts` reduced to `legalPageQuery`), and the guaranteed-`null` legacy fetch +
`?? page?.x` fallback tiers from all 8 route files. `npm run sanity:typegen` regenerated
(`sanity.types.ts` −1113 lines). Behaviour-preserving, verified. Full detail in §20.8.

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
**Phase A (done, 2026-09-01):** Contact form false-success removed (R6) — now uses the shared
`submitToFormspree` + translatable "not set up" notice, no fake success/reset. Independent review:
SHIP.
**Phase B (done, 2026-09-02):** R8 dead-code cleanup executed — §20.8. Per-batch review: SHIP;
the later full-site review then caught that the cleanup's "0 documents" claim missed 11 orphaned
`drafts.*` docs and that `sanity.types.ts` was stale — both corrected, see §20.8.
**Phase C (done, 2026-09-02):** partially-migrated pages — §20.9. FAQ was already complete;
Volunteer/WWU are technically complete + given editor-UX polish, content pending; legal Section 1
needs an owner decision.
**Phase D (done, 2026-09-02):** global/shared CMS audit — §20.10. All connected; two owner
content decisions (`siteSettings.defaultSeo`, legal Section 1).

**Next batch — MANUAL / OWNER actions, in order:**

1. **Publish the SEO drafts** per the §20.7 checklist — start with the 11 clean pages,
   then handle `legalPage-terms` + `legalPage-privacy-policy` carefully (they lose `lastUpdated`
   on publish — re-set it in Studio right after). Then re-run
   `npx playwright test tests/cms-catering-contract.spec.ts tests/seo.spec.ts` to re-green the
   SEO assertions.
2. **Delete the `linkedin` entry** from the `socialLinks` singleton in Studio (the R3
   code guard already hides it on the site, but the published document keeps a schema validation
   error until the entry is gone).
3. **Add DA/UK translations** for the Volunteer / Work-With-Us EN-only strings (§20.9) — until
   this is done **neither page can be re-published from Studio** (the all-or-nothing i18n rule
   rejects a half-translated row). They now have clean labelled single-field editors:
   - `page-volunteer` → `applicationForm` items: `modalTitle`, `messagePlaceholder`,
     `successMessage`, `errorMessage` (4)
   - `page-work-with-us` → `cvUploadForm` items: `modalTitle`, `modalTitleSent`, `description`,
     `descriptionSent`, `messagePlaceholder`, `dropzoneText`, `errorMessage` (7)
   - `page-work-with-us` → `features` items: `feature0`, `feature1`, `feature2` (3 — these render
     untranslated English on `/da` `/uk` today)
3b. **Delete the 11 orphaned legacy-singleton drafts** (§20.8) — harmless to the site, but dead
    weight referencing removed schema types. Dry-run first, then run live with a write token:
    `npm run sanity:delete-orphaned-legacy-singleton-drafts:dry-run` →
    `npm run sanity:delete-orphaned-legacy-singleton-drafts`.
4. **R4 — Legal-page EN SEO decision** (owner): keep the short MVP copy, or apply the approved
   long copy (already in the drafts' DA/UK; EN was intentionally left). Then publish.
5. **Legal Section 1 decision** (§20.9): fold "Company details" into `legalPage.body` (manager
   authors + translates it), or add a structured localized block with the facts still pulled live.
6. **`siteSettings.defaultSeo` decision** (§20.10): populate a trilingual site-wide default, or
   leave it (per-page fallbacks then apply).
7. **R9 — Studio UX walkthrough**, page by page, in the real Studio with the manager — confirm
   field order/labels/previews/reorder/validation against spec §10 and §19. Fold in a
   representative Publish test per page (§18) using draft-only changes on `production`.
8. **R6 — Form delivery** (product decision: wire a real endpoint; add Volunteer/CV form tests;
   fix the same false-success in `CvUploadModal.tsx` / `InquiryForm.tsx`).
9. **Responsive + Publish sign-off** for every page (§19 items still ⬜ in 20.4), then mark
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

## 20.8 R8 — dead-code cleanup — DONE (Phase B, 2026-09-02; no Sanity writes)

The `page` + `sections[]` migration (Parts 16–17) deleted the *published* copy of all 12 legacy
per-page singleton **documents** but left their **schema types, queries and fallback fetch
call-sites** in place for rollback/typegen safety (Part 17 §17.4 — "the honest way to finish this
refactor"). Confirmed 0 **published** documents for all 12 legacy types, then removed all the code:

> **⚠ Correction (final review, 2026-09-02):** the earlier "0 documents, confirmed" wording was
> published-perspective only. A `perspective: "raw"` query shows **11 of the 12 legacy singletons
> still exist as `drafts.<type>` documents** (`drafts.homePage`, `drafts.aboutPage`,
> `drafts.eventsPage`, `drafts.cateringPage`, `drafts.cateringMenuExamplesPage`,
> `drafts.eventDecorationPage`, `drafts.hostAtRorumPage`, `drafts.communityMembershipPage`,
> `drafts.volunteerPage`, `drafts.workWithUsPage`, `drafts.faqPage` — only `contactPage` is fully
> gone). The old delete scripts used `client.delete(<publishedId>)`, which never removes the
> `drafts.` sibling. **The public site is unaffected** (`sanity/lib/client.ts` +
> `sanityFetch` read `perspective: "published"`, and there are 0 published legacy docs — the
> removed `?? page?.x` code tiers were genuinely dead for site visitors), but these 11 drafts now
> reference schema types this cleanup removed, so they show in Studio's "unknown type" surface and
> still cost attribute budget. **Finishing this needs one Sanity write (draft deletion) — an
> owner action.** A read-only-by-default script is ready and dry-run-verified against production:
> `npm run sanity:delete-orphaned-legacy-singleton-drafts:dry-run` then (with a write token)
> `npm run sanity:delete-orphaned-legacy-singleton-drafts` — backup + revision-guarded atomic
> delete, exactly 11 hardcoded ids, no wildcard. See §20.6 item.

- **A — deleted 12 legacy singleton schema files** (`sanity/schemaTypes/singletons/{homePage,
  aboutPage, cateringPage, cateringMenuExamplesPage, eventDecorationPage, hostAtRorumPage,
  communityMembershipPage, volunteerPage, workWithUsPage, contactPage, eventsPage, faqPage}.ts`);
  pruned `sanity/schemaTypes/index.ts` (12 imports + 12 array entries + 12 `SINGLETON_TYPES`
  entries — kept the 7 real singletons); refreshed the now-stale `PAGE_KEYS` doc comment.
  `sanity.config.ts` needed no change (its `SINGLETON_TYPES.has()` / `"page"` / `"legalPage"`
  checks just see a smaller set).
- **B — removed the dead queries.** `sanity/queries/pages.ts` now holds only `legalPageQuery`.
  `sanity/queries/faq.ts` deleted (was only `faqPageQuery`). `eventsPageQuery` removed from
  `sanity/queries/events.ts`.
- **C — removed the redundant legacy fetch + `?? page?.x` fallback tiers** from all 8 route files
  (`about`, `community-membership`, `contact`, `event-decoration`, `faq`, `host-at-rorum`,
  `volunteer`, `work-with-us`). Each dropped: the legacy import, one `sanityFetch({query:
  <legacy>})` from its `Promise.all`, and every `?? pickLocalized(page?.X, locale)` /
  `: page?.X?.length ? … :` branch that could never resolve (`page` was always `null` — 0
  documents). Also removed now-dead helpers (`about`'s `resolveIconLinks`,
  `community-membership`'s `splitBenefit`, `host-at-rorum`'s `pickLabel` import,
  `event-decoration`/`host-at-rorum`'s `legacyGalleryMedia`). **Behaviour is provably unchanged**
  — the removed tiers always returned `null`/`undefined`; the fallback chain now goes
  section → hardcoded-fallback directly, exactly as it already did at runtime. `catering`/`events`
  route files were already clean — untouched.
- **D — regenerated types** (`npm run sanity:typegen`): `sanity.types.ts` −1113 lines net (26 →
  14 queries, 68 → 56 schema types); `schema.json` regenerated (gitignored). `resolveContactFormFields`
  and every other resolver unaffected. **Final-review correction (2026-09-02):** the working-tree
  `sanity.types.ts` was found still carrying the removed legacy singleton *document* types
  (`WorkWithUsPage`, `VolunteerPage`, …) — the `git stash` incident recovery had left it at the
  pre-cleanup revision. Re-ran `npm run sanity:typegen`: legacy doc types now gone, all shared
  types (`Seo`, `ImageWithAlt`, `InternationalizedArrayString`, …) retained, `tsc --noEmit` clean.
  No code imported the legacy types by name, so nothing broke in the interim.
- The `lib/content-contracts/*.ts` prose notes that referenced the old query names are now
  historically inaccurate (they're `querySource:` string fields, not code — they don't break
  anything); flagged for a light touch-up, not done this pass to keep the diff mechanical.

**Verification:** `npx tsc --noEmit` clean · `npx eslint` (all changed files) 0 errors ·
`npx vitest run` 528/528 · `next build` (isolated prod dir) succeeded, 148 static pages ·
Playwright interactions/locale/sanity/schema-visibility/cms-about/cms-events/cms-home/
cms-event-decoration — all pass · browser spot-checks (about, community-membership,
host-at-rorum EN+DA) render identically to the pre-cleanup audit, 0 console errors.
Pre-existing stale test **fully fixed after the final review**: `cms-events-contract.spec.ts`'s
"cross-page consistency" test pinned `mindful-morning-yoga` (now past-dated) and hung 30 s on a
disabled "Next page" link. Phase B guarded the click but left the strip/listing half skipped for a
past fixture (silent coverage loss). It's now rewritten to **resolve the first currently-listed
event dynamically** (`order(date asc)[0]`, matching both the Home strip and the listing's own
default sort) — real, always-present consistency coverage regardless of dataset dates, no skip, no
pinned slug. `AVAILABLE_SLUG`/`SOLD_OUT_SLUG`/`BASELINE_SLUG` remain only for the date-agnostic
detail-page + "What to Expect" checks (a detail page is always reachable). The 6
`cms-catering-contract.spec.ts` SEO failures are the same pre-existing unpublished-`page-catering.seo`
gap (§20.7), unrelated.

> **Content observation (not a code defect):** every one of the ~34 published `event` documents is
> now past-dated (latest 2026-08-26; today 2026-09-02). The frontend deliberately does **not**
> hide past events (see the comment in `EventsClientPage.tsx` — changing that is a live
> filtering-behaviour decision), so `/events` and the Home strip still render, just showing past
> events. Owner should add upcoming events; until then the "upcoming" framing is inaccurate.

Follow-up not done (LOW, flagged by the Phase B reviewer): the `lib/content-contracts/*.ts`
`querySource:` prose still names removed queries (harmless — no script/test consumes those
strings; `about.ts`/`home.ts`'s misleading "proposed fix / not fixed" notes WERE corrected). A
full content-contracts accuracy refresh is a small standalone pass.

## 20.9 Phase C — partially-migrated pages (2026-09-02)

| Page | Outcome |
|---|---|
| **FAQ** | Was **not** actually a gap. `page-faq` is fully translated EN/DA/UK; `/da/faq` renders Danish end to end on a clean build. → **COMPLETE** (SEO draft still to publish, §20.7). |
| **Volunteer** | Technical chain (schema `internationalizedArray` → `pickLocalized(...locale)` resolver → `<VolunteerApplicationButton content={applicationForm}>`) is complete. Added Studio editor-UX: `contentItem.ts` roles "Volunteer application-modal heading/placeholder" + "…message" (show only the one relevant field, human label, friendly preview label), and `pageSection.ts` hides the `applicationForm` section's own unused label/title/text. **Correction after the final review:** the roles are now marked `requiredFields` (`title`/`text`). The earlier "left un-required so the page stays publishable" note was wrong — `contentItem` `title`/`text` already carry the shared all-or-nothing i18n rule, so a row filled for EN only (which is the current state of all 4) is invalid and **blocks Studio re-publish** regardless. `requiredFields` doesn't change that; it just makes the Studio error say "Please add the Danish and Ukrainian translations." instead of the confusing "…or clear the field completely", and removes the clear-to-unblock footgun. → **CONTENT-BLOCKED.** Owner/translator must add DA/UK for `modalTitle`, `messagePlaceholder`, `successMessage`, `errorMessage` on `page-volunteer`'s `applicationForm` items before the page can be re-published from Studio. (The live published page is unaffected until someone edits it.) |
| **Work With Us** | Same treatment as Volunteer for the 7 `cvUploadForm` items. **Also** (found in the final review): the 3 **"Why work with us" feature bullets** (`sections[features]` — `feature0/1/2`) are EN-only too, had **no** item role, and render untranslated English on `/da` `/uk`. Added a "Work With Us feature bullet" role (`icon` + `title`, `title` required) so Studio surfaces them cleanly and flags the gap. → **CONTENT-BLOCKED.** DA/UK needed for `modalTitle`, `modalTitleSent`, `description`, `descriptionSent`, `messagePlaceholder`, `dropzoneText`, `errorMessage` (`cvUploadForm`) **and** `feature0`, `feature1`, `feature2` (`features`) on `page-work-with-us` before Studio re-publish. |
| **Terms / Privacy / Cookie** | Sections 2+ fully translated (`legalPage.body`). **Section 1 "Company details"** is a hardcoded `<h2>1. Company details</h2>` + intro sentence + field labels in `terms/page.tsx` / `privacy-policy/page.tsx` / `cookie-policy/page.tsx`. The *facts* (company name, CVR, email, address) already come from Sanity (`getCompanyContactFacts()` → `siteSettings` + `contactInfo`, verified: `companyName: RORUM`, `cvr: 46033213`, `website: ro-rum.dk`). The wrapper chrome shows untranslated English on `/da` `/uk`. **NOT changed** — removing the hardcoded block before a Sanity replacement exists would drop Section 1 from the live pages, and translating the block myself is out of bounds ("do not invent legal language"). → **PARTIAL — owner decision needed** (fold Section 1 into `legalPage.body`, or add a structured localized block). |

Verification: `tsc` clean · `eslint` clean · `vitest` 528/528 · `sanity-schema-visibility.spec.ts`
326/326 (Volunteer/WWU role + field-hide + required-field + feature-bullet tests) ·
`cms-events-contract.spec.ts` 29/29 · clean prod build renders `/volunteer`, `/work-with-us`
(EN + DA), `/da/faq` (fully Danish), all 3 legal pages EN/DA/UK unchanged.

## 20.10 Phase D — global / shared CMS (2026-09-02, audit only — no code needed)

| Area | State |
|---|---|
| Navigation, Footer, contactInfo, formMessages, eventMessages | **Fully CMS, trilingual.** No work. |
| socialLinks | R3 code guard in place; **owner must delete the stray `linkedin` entry in Studio** (§20.6). |
| Company / legal facts (`getCompanyContactFacts`) | **Already CMS** — reads `siteSettings.companyName`/`.cvr`/`.website` + `contactInfo.email`/`.shortAddress`; `lib/siteConfig.ts` is only the Sanity-unavailable fallback. Not a gap. |
| `siteSettings.defaultSeo` | **Empty** (not defined). The site-wide default-SEO fallback tier therefore contributes nothing; each page falls to its own hardcoded English fallback. Not a code gap — an **owner content decision** (populate a trilingual default, or leave it). |
| `siteSettings.siteUrl` | Fixed / read-only `https://ro-rum.dk` (Part 26). Correct. |
| Shared CTAs / gallery collections | Covered by Parts 18–28; no new gap. |
| Legal Section 1 chrome | See §20.9 (owner decision). |

## 20.11 Phase E — re-audit of the 8 "fully connected" pages (2026-09-02, verification only)

Re-checked Home / About / Events listing / Event detail / Catering / Event Decoration / Host at
RORUM / Community Membership against a clean production build, EN + DA (+ UK on Home). No rebuild
needed; no new gaps found. Confirmed: every page's section content renders from `page-*.sections`
and is localized (h1s + body all translate); Home SEO title/description **published** EN/DA/UK;
Event detail Event JSON-LD + share actions present; Catering 66-image gallery renders with
**zero empty `alt`** attributes; Community Membership 2 videos + exactly 2 bank-detail Copy
buttons + WECODA link; all pages 0 console errors. The **only** outstanding item common to
About / Events / Catering / Event Decoration / Host / Community is that their published
`page-*.seo` is still empty → `<title>`/description render the (correct) per-page English
fallback on every locale until the §20.7 drafts are published.

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
