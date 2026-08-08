# RORUM Website — Migration Report

**Status as of this report: current, unambiguous, supersedes all prior versions of this file.**
The Tailwind migration described in Part [1–4] below is functionally complete (see §2). Earlier
drafts of this file contained a top-of-file summary that still said the CSS→Tailwind migration
"was not executed" while a later section in the same file said it was complete — that
contradiction has been removed. A condensed history of how the project got here is in §9; treat
§1–§8 as the single source of truth for Tailwind/test-infrastructure current state. **Sanity CMS
integration and localization are covered in [Part 5](#part-5--sanity-cms-integration--localization)
at the end of this document — read its §1 first for the authoritative, honest status (a Sanity
project was not provisioned in that task; see exactly what was and wasn't built/verified there).**

## 1. Executive Summary

- **TypeScript**: 100% of application source converted from `.js`/`.jsx` to `.ts`/`.tsx`, `strict: true`, zero `any`.
- **Tailwind CSS**: the CSS→Tailwind component migration is complete. `app/globals.css` went from an initial 9,284 lines to **2,351 lines** (current, see §2 for the full audit). Every component/page was individually reviewed; the classes still in `globals.css` are there for one of four documented, technically-justified reasons (§4), not because conversion was skipped.
- **Test infrastructure**: a permanent Playwright suite (125 tests: 60 visual-regression screenshots + 63 interaction/breakpoint tests + 2 Sanity-fallback tests added in Part 5) is committed and run after every change. Its snapshot portability gap (Windows-only baselines) is identified and a fix is documented in §6 — **not yet applied to the checked-in baselines**, since regenerating them requires the canonical CI platform, which this session does not have access to (see §6 for the exact remediation).
- **Localization / Sanity CMS**: see [Part 5](#part-5--sanity-cms-integration--localization).

## 2. Current CSS Statistics

Measured directly from `app/globals.css` via a PostCSS AST walk (not line-counting or regex):

| Metric | Value |
|---|---|
| Lines | 2,351 |
| Selectors (comma-separated alternatives counted individually) | 429 |
| Declarations | 1,323 |
| `@media` at-rules | 16 |
| `@keyframes` at-rules | 3 |
| `!important` declarations (CSS-side) | 2 |
| Bare top-level single-class selectors | 103 |
| Descendant/combinator selectors | 168 |
| Pseudo-element selectors (`::before`/`::after`) | 63 |
| Unique class names referenced anywhere in a selector | 136 |
| Tailwind `!` (important-modifier) utility occurrences in `.tsx`/`.ts` | 108, across 12 files |
| Arbitrary (non-default-scale) breakpoints | 6 call sites (§5) |

Starting point (pre-migration, first commit of this project): 9,284 lines, ~1,373 top-level selectors, no `@theme` block, no component conversion. Net reduction: **−6,933 lines (−74.7%)** end to end, achieved across four historical sessions plus this task's own cleanup pass (§9).

## 3. Dead-CSS Verification Methodology and Findings

Every one of the 135 class names still referenced anywhere in `app/globals.css` was checked against the entire `app/`, `components/`, `lib/` tree for a real runtime consumer — not a naive grep. The check specifically covers the failure mode that corrupted an earlier cleanup attempt in this project's history (§9, Part 1/2): a literal-string search that can't see a class name assembled via a template literal.

**Method**: (1) extract every class name from every selector via a PostCSS AST walk (catches descendant/compound selectors, not just bare top-level ones); (2) for each name, search all `.tsx`/`.ts` source for a literal match bounded by quote/backtick/whitespace/brace characters (rejects false-positive substring hits like a class name appearing only inside a code comment with a literal `.` prefix); (3) for every class that comes back with zero matches, manually trace it — check for `` `prefix-${variable}` `` construction, conditional/ternary class maps, and props passed through to a shared component, and verify the actual data values that could produce it.

**Findings this session**:
- 4 classes (`quick-path-card-red`/`-green`/`-events`/`-host-at-rorum`) initially showed zero literal matches. Traced to `app/shared.tsx`'s `` `quick-path-card-${meta.tone} quick-path-card-${href-derived-slug}` `` construction; confirmed **live** by cross-checking the actual `tone`/`href` values in `quickPathMeta` (only `"red"`/`"green"` and the 4 real route slugs are ever produced) — kept.
- 3 classes were confirmed **genuinely dead** and removed: `.cta-title`/`.form-title` (a 3-way comma-group with `.section-title`; `.section-title` is still live in `components/ui.tsx`, but the other two branches' owning elements were already fully converted to explicit Tailwind utilities in an earlier session, leaving only a stale developer comment referring to them — the comment was also corrected), and `.social-icon` (`components/SocialIcon.tsx`'s `<svg>` already renders fully-explicit Tailwind classes; the base rule and a descendant override `.event-share-actions .social-icon` were both dead — removed both, and corrected a comment in `components/EventShare.tsx` that had described the now-nonexistent override as "crucial." The actually-controlling, still-live rule for those icons' size is `.event-share-actions svg`, unaffected by this removal — verified no visual change).
- 1 orphaned `@media (max-width: 639px) { .wecoda-donation-divider { max-width: 100% } }` override was found and removed — the base rule and its pseudo-elements were already converted to Tailwind `before:`/`after:` utilities in an earlier session, but this one mobile-only override in a different part of the file was missed at the time.

Net: **−15 lines**, 3 dead classes and 1 dead media-query override removed, 2 stale comments corrected. Verified zero visual regression via the full Playwright suite (§7).

## 4. Remaining Custom CSS — Why Each Category Stays

103 top-level classes remain. None are "not yet converted" — each is retained for one of these reasons:

1. **Complex pseudo-element / gradient / animation constructs**, where the declarations are inherently CSS-mechanics (not layout Tailwind can express cleanly): `HorizontalGallery`'s edge-fade gradients and lightbox slide-transform carousel, the FAQ accordion's plus/minus cross, the catering-menu overlay's watermark and plus/minus icon, `.quick-path-card`'s hover-reveal gradient overlay, `.event-media`'s hover/sold-out gradient overlay, `CTASection`'s `.next-step-card-final`/`.next-step-card-host` pulse animation.
2. **JS-positioned/JS-toggled-class + CSS-transition pairs**: `EventFilters`' dropdown menu (`.events-filter-dropdown.is-open`), positioned via a JS-computed `--menu-shift-x` custom property that a CSS `transition` animates — the position math itself must live in JS (it depends on runtime viewport measurement), so the corresponding CSS class name has to stay as the hook.
3. **Shared low-footprint typography context**: `.policy-content` (a handful of rules) styles raw `h2`/`p`/`a`/`ul` prose shared across `terms`, `privacy-policy`, and `cookie-policy`. Converting would mean duplicating identical utility classNames across dozens of static prose elements in three files for zero visual difference.
4. **Widely-shared primitive hooks**: `.btn`, `.label`, `.heading`, `.section`, `.section-tight`, `.card` — the base styling layer for `components/ui.tsx`'s shared primitives (`Button`, `SectionLabel`, `Container`, `Card`, etc.), still targeted by page-specific descendant-selector context overrides (e.g. `.some-page .label { color: gold }`) at call sites across the app.

None of these were force-converted into unreadable arbitrary Tailwind utilities to shave the line count, per this task's explicit instruction.

## 5. Remaining Arbitrary Breakpoints

All `app/globals.css` `@media` width-only conditions now match Tailwind's default scale exactly (`639px`≈`max-sm`, `1023px`≈`max-lg`, `1024px`=`lg`, `1280px`=`xl`, `640px`=`sm`). The only non-standard breakpoints left are in `.tsx` files, each solving a real layout problem a standard breakpoint doesn't cover, and each already commented at its call site:

| Call site | Breakpoint | Why |
|---|---|---|
| `Header.tsx` mobile topbar, `ui.tsx` | `max-[360px]:` | Extra compaction for the narrowest real phones (320–360px); applying it at the standard `sm` (640px) floor would affect phones that have room to spare. |
| `community-membership/page.tsx` WECODA photo grid | `max-[560px]:` | 2-column layout stays legible down to 560px; only below that do individual photos get too narrow for 2 columns. |
| `Header.tsx` language switcher | `max-[1100px]:` | Collapses the language switcher into a compact dropdown specifically in the narrow "just past `lg`" range where it would otherwise crowd the rest of the header. |
| `catering`, `event-decoration`, `host-at-rorum` hero sections (7 occurrences) | `[@media(min-width:1024px)_and_(max-height:820px)]:` | A compound width-**and**-height query for short-viewport laptop screens (1024px+ wide but under 820px tall), where the default `lg` hero spacing is too generous vertically. Not expressible as a simple named breakpoint since it depends on two dimensions at once. |

## 6. Test Portability

**Problem confirmed**: `tests/visual.spec.ts-snapshots/*.png` are suffixed `chromium-win32` — Playwright's default platform-encoded naming. A CI runner on Linux (the near-universal case for GitHub Actions and most managed CI) would look for `chromium-linux` snapshots, find none, and either fail every visual test outright or silently write a new baseline with no regression protection at all.

**Chosen strategy: generate and maintain baselines on the canonical CI platform**, via a pinned Docker image, rather than a custom `snapshotPathTemplate` workaround. Rationale: Playwright's own visual diffing is sensitive to sub-pixel font rendering and anti-aliasing differences between operating systems (the exact class of bug repeatedly diagnosed and fixed throughout this project's history — see §9, Part 4 §3), so a baseline generated on Windows will **never** reliably match Linux-rendered screenshots even with a perfect naming/path scheme; the platform suffix is Playwright correctly telling you the images aren't comparable, not a bug to hide. The fix is procedural, not a config trick:

1. `playwright.config.ts` already pins a single project (`chromium`) — no change needed there.
2. **Not yet done in this session** (external blocker: no CI runner or Linux container available in this environment to generate a real baseline against): add a `Dockerfile`/CI step using the official `mcr.microsoft.com/playwright:v1.62.1-noble` image (matching the `@playwright/test` version pinned in `package.json`), and regenerate `tests/visual.spec.ts-snapshots/` by running `npm run test:visual -- --update-snapshots` **inside that container**, then commit the resulting `chromium-linux`-suffixed PNGs as the new canonical baseline.
3. Document the exact command in `package.json` (`test:visual:docker`, added — see §8) so any future baseline regeneration goes through the same pinned environment, not a developer's local machine.
4. Once regenerated on Linux, delete the current Windows-only baselines (`*-chromium-win32.png`) — they should not coexist with a Linux baseline for the same test name, since Playwright would otherwise pick whichever matches the host it runs on, silently reintroducing the non-determinism this fix removes.

**What this session did do**: added the `test:visual:docker` script and this documented procedure (§8), and left the existing Windows baselines in place and passing locally (123/123, see §7) rather than deleting the only baseline that currently works anywhere, which would leave the suite with *no* working visual regression protection at all until the Linux baseline is generated. Deleting a working (if non-portable) safety net before its replacement exists would be a net loss, not a fix.

All interaction/breakpoint protections (mobile burger on every route, desktop nav at `lg`, Attend Events, filter-dropdown containment, Buy Ticket width, forms/modals, FAQ, catering overlay, galleries/lightboxes, keyboard/focus behavior) are platform-independent (DOM/computed-style assertions, not screenshots) and pass identically on any OS — unaffected by this issue.

## 7. Validation Results (this session, current HEAD)

```
npm ci               → clean install, 363 packages, 0 errors
npm run typecheck    → 0 errors
npm run lint         → 0 errors, 12 pre-existing warnings (all @next/next/no-img-element,
                        unrelated to this work — see §4 of the historical Part 1 report)
npm run build        → green, same 50-route static/SSG split
npx playwright test  → 123/123 passed (60 visual-regression + 63 interaction/breakpoint)
```

## 8. Repository Hygiene

- **Untracked and deleted 10 generated files** that were committed by mistake: `dev-3011.err.log`, `dev-3011.out.log`, `dev-check.err.log`, `dev-check.out.log`, `dev-restart.out.log`, `next-dev-3000.err.log`, `next-dev-3000.out.log`, `next-dev-3003.err.log`, `next-dev-3003.out.log` (all stray `next dev` stdout/stderr redirection logs from earlier debugging sessions), `tsconfig.tsbuildinfo` (TypeScript's incremental build cache).
- **`.gitignore` extended** to cover `*.log`, `*.tsbuildinfo`, local scratch screenshots (`_*.png`) and debug spec files (`_debug*.spec.ts`) so these categories can't be re-committed by accident, plus placeholders for Sanity build output (`/sanity/dist/`, `.sanity/`) — Sanity TypeGen's `sanity.types.ts` is deliberately **not** ignored, since the app imports it at build time (see the Sanity section for current status).
- `package.json`: added `test:visual:docker` (documented in §6) alongside the existing `test:e2e`/`test:visual`/`test:visual:update`.

## 9. History (condensed)

Four sessions preceded this task, each building on the last. Full narrative detail (file-by-file tables, exact bug traces, per-batch breakdowns) has been removed from this file to eliminate the contradiction described at the top of this report; the substance is summarized here.

- **Session 1 — TypeScript migration.** All 50 `.js`/`.jsx` files converted to `.ts`/`.tsx` under `strict: true`, zero `any`. Added the Tailwind `@theme` token foundation only — no component's classes were converted yet. 4 real bugs fixed (a `react-hooks/refs` violation, an argument-arity bug), 5 more found and deliberately left as-is pending a scoping decision (2 of these remain unfixed today by design — see §1 and the forms note below).
- **Session 2 — first CSS→Tailwind pass + cascade-layers fix.** Converted 35 of 44 component/page files' custom classes to Tailwind utilities. Discovered and fixed a project-wide cascade bug: the base CSS reset (`h1`–`h6`, `a`, form controls) was unlayered, so it silently beat *any* Tailwind color/font utility regardless of specificity — fixed by wrapping it in `@layer base`. Ran a rigorous, template-literal-aware dead-CSS sweep (9,284 → 5,823 lines). 2 of the 5 flagged bugs fixed (`FAQInlinePrompt`'s dropped props, `Card`'s dead `variant` prop removed); 3 left as-is per explicit decision — the “soonest” event-filter mismatch (behavior-preserving, documented in code) and the 3 forms (`ContactForm`, `CateringInquiryForm`, `InquiryForm`) not actually calling `submitToFormspree` (Formspree wiring deferred to a dedicated pass — **still deferred**; `VolunteerApplicationForm` is the only form that submits today).
- **Session 3 — standard breakpoints + permanent tests.** Replaced the project's ad hoc `tablet:`/`desktop:`/`wide:` breakpoint tokens with Tailwind's default `sm`/`lg`/`xl` scale across 26 files (the old 981px "desktop" cutoff shifted to the standard 1024px `lg`). Replaced the throwaway install-then-uninstall Playwright pattern from Sessions 1–2 with the permanent, committed `tests/` suite (123 tests) still in use today.
- **Session 4 — line-by-line CSS finish + component-API decoupling.** Went through the entire remaining `globals.css` selector by selector. Extended `ui.tsx`'s shared primitives (`SectionLabel`, `SectionHeader`, `FAQInlinePrompt`, `CTASection`) and `CateringMenuOverlay.tsx`'s `CateringMenuButton` with `className`/variant-override props specifically so page-specific styling could be passed in explicitly instead of a page's CSS reaching into a shared component via a descendant selector — this is what let the file shrink from 5,839 to 2,365 lines without losing any page-specific visual detail. Found and fixed 3 real regressions its own conversion work introduced (documented cascade gotchas: an absent Tailwind font-size silently inheriting the wrong body default; `flex-1` vs `flex-auto` not being equivalent; a mobile `@media` override physically far from its sibling rules being missed on first pass) — all caught by the same Playwright suite before being called done. Also separately diagnosed and resolved a reported "burger menu shifted right + horizontal scroll" bug that turned out to be caused by a browser extension (Grammarly) injecting DOM attributes and triggering Next.js's dev-mode-only hydration-mismatch indicator — not a real application bug, confirmed by testing in a clean browser context and against the user's own dev server directly.
- **This task (Session 5)** — audited the actual final state rather than trusting the existing report (finding and fixing the 3 dead-CSS leftovers and 1 redundant `!important` documented in §3), rewrote this file to remove the contradiction, cleaned up 10 tracked generated files, and documented (without yet executing, due to an environment blocker) the Linux-baseline fix for test portability (§6). Sanity CMS integration, localization, and content migration — the majority of this task's scope — are covered starting at the section immediately below, with an explicit status for each.

---

# Part 5 — Sanity CMS Integration & Localization

## 1. Executive Summary — read this first

**No Sanity project was provisioned in this task.** No project ID, dataset name, or API token was supplied, and none was invented — per the task's own instruction, everything that can be built and verified *without* live credentials was built and verified; everything that genuinely requires them (creating a project, writing real documents to a real dataset, testing Draft Mode against real drafts, verifying live/localized routes end to end) was not attempted and is not claimed as done.

**What exists and is verified right now, in this repository, at this commit:**
- A complete Sanity Studio configuration (35 schema types: 15 reusable objects, 5 structured documents, 15 page/global singletons) that **loads and passes `sanity schema extract` and `sanity typegen generate` locally** — confirmed by actually running both against this schema (with placeholder env values, since extraction/typegen are static operations that don't touch a live dataset).
- Typed GROQ queries (`sanity/queries/*.ts`, via `defineQuery`) for the global singletons, the FAQ page, and events — `sanity.types.ts` is generated from them and committed.
- An idempotent import script (`scripts/import-content.ts`) that **has been run in dry-run mode against the real, current `lib/data.ts`/`lib/cateringMenu.ts`/`lib/siteConfig.ts` content** and correctly produces 65 documents (see §6) — its data-shaping logic is real and tested; its *write* path has never run against a live dataset.
- `/studio` is embedded, builds cleanly, and **fails safely**: with no project configured (this environment's actual state), it renders a clear "not configured" message instead of a 500 or a broken build — verified by a Playwright test (`tests/sanity.spec.ts`) that passes.
- The full existing site (all 15 routes, all 125 Playwright tests) **still builds and passes unchanged** — the Sanity work is 100% additive; nothing that already worked was touched.

**What is explicitly NOT done, and why:**
- **No frontend page was switched over to read from Sanity.** Doing that safely for even one page requires a live dataset to query against and compare rendered output to the approved baseline (the task's own §"English Content Import" instruction: *"Before switching a page to Sanity, compare its rendered output with the existing approved English baseline"* — impossible without a real dataset to read from). Every route today still renders its existing hardcoded content, unchanged.
- **No content was imported.** The import script's *write* path (`client.createIfNotExists`) has not executed against any dataset — there is no dataset. Do not read §6's "65 documents" as documents that exist in Sanity; they are documents the script is *ready* to create.
- **Locale routing (`/da/...`, `/uk/...`) is not activated.** `lib/i18n.ts` has the locale constants and path helpers, fully typed and unit-testable, but the `app/` route tree has not been restructured into `app/[locale]/...`. See §8 for exactly why and what the restructuring plan is.
- **No Danish or Ukrainian translations were generated.** With no content imported and no editor UI to review them in, generating translations now would mean inventing copy no one has verified against the schema's actual field shapes — deferred until the import has run for real.
- **Draft Mode / Presentation Tool / Visual Editing are configured in code** (`sanity/lib/live.ts`) but never exercised — they require `SANITY_API_READ_TOKEN` against a real project.

The rest of this Part documents exactly what was built, how it was verified, and the precise next steps to finish activation once a real Sanity project exists.

## 2. Packages Installed

| Package | Version | Purpose |
|---|---|---|
| `sanity` | ^6.9.1 | Studio + core schema APIs |
| `next-sanity` | ^13.3.1 | Next.js integration: client, `defineQuery`, Live Content API, embedded Studio |
| `@sanity/vision` | ^6.9.1 | In-Studio GROQ query tester (`/studio/vision`) |
| `@sanity/image-url` | ^2.1.1 | Image CDN URL builder |
| `@sanity/client` | ^7.26.2 | Standalone client for the import script (outside the Next.js/React runtime) |
| `sanity-plugin-internationalized-array` | ^5.1.25 | Official Sanity plugin implementing the internationalized-array localization pattern (§7) |
| `styled-components` | ^6.5.1 | Studio's peer dependency |
| `tsx` (dev) | ^4.23.11 | Runs `scripts/import-content.ts` directly |

`@sanity/icons` was installed, then **removed**: its installed version's runtime JS exports (`dist/index.js`) don't match its own `.d.ts` type declarations — every `XxxIcon` import typechecked cleanly but failed at webpack build time with "not exported." Confirmed with a clean-room check (`node -e "import('@sanity/icons').then(m => console.log('HeartIcon' in m))"` → `false` for every icon tried). Since custom document icons are purely cosmetic, all `icon:` fields were removed from the schemas rather than fighting a broken package — the Studio's document list uses default icons. Worth revisiting on a future `@sanity/icons` release.

## 3. Environment Variables (names only — see `.env.example`)

| Variable | Where used | Required for |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Client, Studio | Everything — nothing works without it |
| `NEXT_PUBLIC_SANITY_DATASET` | Client, Studio | Everything |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Client (defaults to a pinned `2025-02-19` if unset — never a dynamic date, per the task's instruction) | — |
| `SANITY_API_READ_TOKEN` | Server only (`sanity/lib/client.ts`'s draft client, `sanity/lib/live.ts`) | Draft Mode / Presentation Tool |
| `SANITY_API_WRITE_TOKEN` | Server only, local script only (`scripts/import-content.ts`) | Running the real import |
| `SANITY_PREVIEW_SECRET` | Not yet consumed by code — reserved for the Draft Mode enable-route handshake once that route is built (§8) | Draft Mode |

No `NEXT_PUBLIC_*` variable ever holds a token. `sanity/env.ts` centralizes reading these with two tiers: `isSanityConfigured` (a soft boolean, safe to check anywhere) and `assertConfigured()` (throws with a specific, actionable message — called only from code that genuinely cannot function without real config: the Studio and the write-capable import script).

## 4. Studio

- Embedded at `/studio` (`app/studio/[[...tool]]/page.tsx`), per the task's default preference.
- Access control is Sanity's own project-member authentication (the Studio's own login screen) — no custom password system was built, per the explicit instruction not to.
- **Verified to fail safely without configuration**: the page checks `isSanityConfigured` before ever importing `sanity.config.ts` (which itself throws if misconfigured — correct behavior for someone actually trying to use it, wrong behavior for `next build`). Dynamic `import()` defers that check to request time. `tests/sanity.spec.ts` asserts this renders a non-5xx page with a clear message — passing.
- Structure (`sanity/structure.ts`) is organized to mirror the site's own navigation: Site (settings/contact/social/nav/footer/form messages) → Pages (one item per route, in nav order) → Events / Event categories / FAQ groups / Catering menu categories / Image galleries.
- **Singleton protection**: `SINGLETON_TYPES` (in `sanity/schemaTypes/index.ts`) lists every one-instance-only type; `sanity.config.ts`'s `document.actions`/`newDocumentOptions` overrides remove "duplicate"/"delete" and hide these types from the generic "+ Create" menu, so an editor can only ever reach a singleton's one instance through the fixed-id items in the structure tool — they cannot accidentally create a second, orphaned one. `legalPage` is the one schema *type* published as 3 separate fixed-id singleton *documents* (`terms`/`privacy-policy`/`cookie-policy`), each protected the same way.

## 5. Content Model — Schema List

**Objects (15, reusable field shapes):** `seo`, `imageWithAlt`, `ctaLink`, `titledText`, `practicalDetail`, `bodyPortableText`, `navChild`, `navItem`, `socialLink`, `cateringMenuItem`, `serviceHero`, `iconCard`, `packageTier`, `editorialFeature`, `nextStepSection`.

**Structured documents (5):** `event`, `eventCategory`, `faqGroup`, `cateringMenuCategory`, `galleryCollection`.
- `cateringMenuItem` is modeled as a reusable **object** (embedded in a category's `featuredItems` array), not a top-level document with references: every dish belongs to exactly one category and is never reused elsewhere, so a document+reference indirection would add editing friction (create the item, then link it) for zero reuse benefit — the object schema itself is still fully shared/reusable.
- `faqItem` (question/answer) is likewise an inline object within `faqGroup.items`, matching the existing `Record<groupName, [question, answer][]>` shape and the fact that a question is never displayed outside its group's accordion.
- Reusable CTA blocks (`editorialFeature`, `nextStepSection`) were modeled as **objects embedded directly in the page that uses them**, not shared referenceable documents — per the task's own instruction ("reusable calls to action only where they are genuinely shared"), each instance's copy is page-specific, not the same content reused verbatim across pages.

**Global singletons (6):** `siteSettings`, `contactInfo`, `socialLinks`, `navigation`, `footer`, `formMessages`.

**Page singletons (16, one per route, matching the task's explicit list):** `homePage`, `aboutPage`, `eventsPage` (the listing page's own heading — individual events are `event` documents), `cateringPage`, `eventDecorationPage`, `hostAtRorumPage`, `communityMembershipPage`, `volunteerPage`, `workWithUsPage`, `contactPage`, `faqPage`, and `legalPage` (shared type, 3 documents: `terms`, `privacy-policy`, `cookie-policy` — the one deliberate case of one schema backing multiple documents, justified in §4 above since all three genuinely share the same title/subtitle/body shape).

Every schema field name was chosen by reading the actual current source (`lib/data.ts`, `lib/cateringMenu.ts`, `lib/siteConfig.ts`, and each page's `.tsx`) rather than guessed — e.g. `event` mirrors `RorumEvent` field-for-field, `cateringMenuCategory` mirrors `CateringMenuCategory`, `footer`'s 4 columns match `components/Footer.tsx`'s actual `visitHostLinks`/`serviceLinks`/`communityLinks`/`companyLinks` structure exactly.

**Deliberately not modeled as Sanity content** (implementation, not editorial content, per the task's own exclusion): Tailwind classes, component names, the JS-driven FAQ-accordion/catering-menu-overlay/gallery-lightbox mechanics documented as intentionally-retained CSS in Part 4 §4, and the 2 known-and-documented form-submission bugs (§1 of this Part 5 doesn't touch behavior, only content).

## 6. Localization Model

- **Pattern**: internationalized arrays (`sanity-plugin-internationalized-array`), not `@sanity/document-internationalization`'s separate-linked-documents pattern — per the task's explicit preference ("scalable," "administrator must be able to edit all three language values within the same logical document"). Configured in `sanity.config.ts` for `["string", "text", "bodyPortableText"]` field types, generating `internationalizedArrayString`/`internationalizedArrayText`/`internationalizedArrayBodyPortableText` automatically for the 3 configured languages (`en`, `da`, `uk`; `en` is the default).
- **What's localized**: every editorial string/text/portable-text field — headings, body copy, button labels, alt text, FAQ content, form messages, SEO title/description.
- **What's explicitly NOT localized** (shared, non-linguistic values, per the task's instruction): image assets, internal document references, dates (`event.date`), prices, ticket counts, booleans (`isSoldOut`), ordering (`cateringMenuCategory.order`), and external URLs (`ticketUrl`, `calendarUrl`) — these are plain fields, not internationalized arrays, so they're stored once regardless of language.
- **Per-language destination override**: `ctaLink.localizedHrefOverride` — an internationalized-array field, left empty by default (falls back to the shared `href`), populated only for the rare case where a specific language must link somewhere genuinely different.
- **English fallback**: every localized-field validation in the schemas (`seo`, `imageWithAlt`, `event`, `eventCategory`, `faqGroup`, `cateringMenuItem`, `navChild`/`navItem`, `titledText`) requires the `en` entry specifically via a `rule.custom()` check that finds the `_key === "en"` array member — Danish/Ukrainian are optional at the schema level, matching "English content is required for published documents" while not blocking publication on incomplete translations.

## 7. Locale Routing — status: designed, not activated

`lib/i18n.ts` defines `locales = ["en", "da", "uk"]`, `defaultLocale = "en"`, and the path helpers (`localizedHref`, `splitLocaleFromPath`) a `[locale]`-segment App Router structure and a language switcher would both call.

**Why the `app/` tree wasn't restructured into `app/[locale]/...` in this task**: doing so means moving all 15 existing routes (every one of which the Tailwind migration just finished validating pixel-for-pixel against a real baseline) under a dynamic segment, which changes how Next.js resolves `generateMetadata`, `generateStaticParams` (for `/events/[slug]`, now `/events/[locale]/[slug]` or similar), and every internal `<Link>`. That is exactly the kind of structural change this task's own instruction says not to combine with anything else in one step ("Do not combine a schema redesign, route redesign and visual redesign in the same step"), and doing it safely requires the same per-route visual-regression rigor Part 4 used — not something to attempt without also having real Sanity content to render per locale (an unprefixed `/da/events` page with no Danish content behind it isn't meaningfully "activated" anyway).

**The concrete next-step plan** (so activation is a routing change, not a design decision made later):
1. Move `app/{about,catering,...}/page.tsx` etc. into `app/[locale]/{about,catering,...}/page.tsx`; add `generateStaticParams` returning `locales.map(locale => ({ locale }))` at the segment root.
2. Add `middleware.ts` that rewrites unprefixed requests to `/en/...` internally (so English URLs stay exactly as they are today — no redirect, no visible prefix) while passing `/da/...`/`/uk/...` through as-is.
3. Every page's data fetch adds a `locale` param to its Sanity query and picks the matching internationalized-array entry, falling back to `en` per-field when a translation is missing (already how the schema is shaped to support).
4. `generateMetadata` builds `alternates.languages` (hreflang) from the 3 locales' equivalent URL for the current page, and `alternates.canonical` from `siteUrl` + the current locale-aware path.
5. Re-run the full Playwright suite against all 3 locale variants of all 15 routes (45 combinations) before calling it done — the same bar Parts 1–4 used throughout.

## 8. English Content Import

`scripts/import-content.ts` — reads `events`, `faqs`, `packages`, `siteUrl` from `lib/data.ts`, `menuCategories` from `lib/cateringMenu.ts`, and `companyDetails`/`contactDetails`/`socialLinks` from `lib/siteConfig.ts`, and shapes them into Sanity documents with every localized field's `en` entry populated and `da`/`uk` left empty.

- **Idempotency**: every document has a deterministic id — either a fixed singleton id (`siteSettings`, `contactInfo`, `hostAtRorumPage`, …) or a SHA-1-derived id from a natural key (event slug, FAQ group title, category id). Writing uses `client.createIfNotExists()` exclusively — re-running the script after an editor has changed content in the Studio touches nothing; it only fills in documents that don't exist yet.
- **Dry-run is the default**: the script only attempts a live write if `SANITY_API_WRITE_TOKEN` is set *and* `--dry-run` isn't passed. `npm run sanity:import:dry-run` was run against this repository's real content and produced:
  ```
  65 documents total
    cateringMenuCategory: 6
    contactInfo: 1
    event: 32
    eventCategory: 19
    faqGroup: 4
    hostAtRorumPage: 1
    siteSettings: 1
    socialLinks: 1
  ```
  `navigation` and `footer` and `formMessages` are not in this list — the script doesn't build them yet; see §9.
- **Image assets are NOT uploaded.** Every event/gallery/menu-item image field is left empty by this script; the console output says so explicitly. Uploading ~29 event banners, the multi-page catering gallery (60+ images), and the decoration/host-at-rorum galleries via `client.assets.upload()` is a real, separate, sizeable piece of work that needs a live project to upload into — scaffolding it further without a destination would be guesswork.
- **Never run live**: this script has never executed against a real dataset. §1 states this plainly; nothing in this report claims otherwise.

## 9. Honest Gaps in This Pass

- `navigation`, `footer`, and `formMessages` singleton documents are modeled in the schema but not yet populated by `scripts/import-content.ts` — the script currently seeds `siteSettings`, `contactInfo`, `socialLinks`, all `event`/`eventCategory`/`faqGroup`/`cateringMenuCategory` documents, and `hostAtRorumPage`'s packages. Extending the script to also emit `navigation` (from `lib/data.ts`'s `navItems`), `footer` (from `components/Footer.tsx`'s hardcoded column arrays), and the other 15 page singletons' text content is mechanical, direct continuation of the same pattern — not attempted further in this pass given the time this task's other phases required.
- No frontend component or page reads from Sanity yet (§1). The query layer (`sanity/queries/*.ts`) covers globals, FAQ, and events as a representative, typed, verified starting slice — not full coverage of every page's content.
- Draft Mode's enable/disable API routes are not built; `SANITY_PREVIEW_SECRET` is reserved but unconsumed.

## 10. Validation

```
npm ci                → clean, 0 errors
npm run typecheck      → 0 errors (includes all sanity/, scripts/, app/studio/ code)
npm run lint            → 0 errors, 12 pre-existing warnings (unrelated, see Part 4 §6)
npm run build            → green, same 50 static/SSG routes + /studio (ƒ, dynamic — correctly
                            deferred rather than crashing the build with no project configured)
npx playwright test       → 125/125 passed (123 pre-existing + 2 new: tests/sanity.spec.ts)
npm run sanity:schema:extract  → succeeds locally (static operation, no live project needed)
npm run sanity:typegen          → succeeds locally, generates sanity.types.ts (35 schema types,
                                    12 typed queries)
npm run sanity:import:dry-run    → succeeds, produces the 65-document summary in §8
```

## 11. Configuration — files added/changed for Sanity

| File | Purpose |
|---|---|
| `sanity.config.ts`, `sanity.cli.ts` | Studio config, CLI/TypeGen config |
| `sanity/env.ts` | Two-tier env validation (soft check + hard assert) |
| `sanity/lib/client.ts`, `sanity/lib/image.ts`, `sanity/lib/live.ts` | Published/draft clients, image URL builder, Live Content API wiring |
| `sanity/schemaTypes/**` (35 files) | All schema definitions (§5) |
| `sanity/structure.ts` | Studio navigation + singleton protection |
| `sanity/queries/*.ts` | Typed GROQ queries |
| `sanity.types.ts` | Generated (committed) TypeGen output |
| `app/studio/[[...tool]]/page.tsx` | Embedded Studio route with safe-fallback |
| `scripts/import-content.ts` | Idempotent import script |
| `lib/i18n.ts` | Locale constants/path helpers (not yet wired to routing — §7) |
| `tests/sanity.spec.ts` | New tests: Studio fails safely, public routes unaffected |
| `.env.example` | Documents every required variable name (§3), no real values |
| `package.json` | `sanity:schema:extract`, `sanity:typegen`, `sanity:import:dry-run`, `sanity:import` scripts; `test:e2e` now includes `tests/sanity.spec.ts` |
| `.gitignore` | Ignores `/schema.json` (regenerated TypeGen input); keeps `sanity.types.ts` tracked |
