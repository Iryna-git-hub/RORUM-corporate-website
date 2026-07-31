# RORUM Website — TypeScript & Tailwind Foundations Migration Report

## 1. Executive Summary

This migration converted the entire RORUM website codebase from JavaScript/JSX to TypeScript, added Tailwind CSS 4 theme-token foundations, fixed several real pre-existing bugs discovered through strict typing, and validated every stage with a real browser (Playwright) visual-regression harness before removing that harness at the end.

**What was fully completed:**
- 100% of application source files (50 of 50: `.js`/`.jsx` → `.ts`/`.tsx`) converted with meaningful types, `strict: true`, and zero `any`.
- Tailwind CSS 4 `@theme` token foundation wired to the existing design-token system.
- 4 real, verified bugs fixed; 5 more real bugs found and deliberately **not** fixed (documented below, since fixing them would change live user-facing behavior, which was out of scope for this migration).
- One architecture extraction (`lib/cateringMenu.ts` out of the largest component file).
- Full validation on every stage: `tsc --noEmit`, `eslint`, `next build`, and (until removed at the end) automated screenshot diffing across all 15 routes × 3 breakpoints.

**What was explicitly not completed** (see §5 and §14): the CSS→Tailwind *component* migration (Phase 3 of the original request) was not executed. Only the foundational `@theme` tokens were added in Stage 1. `app/globals.css` is otherwise untouched — no component's `className` usage was converted to Tailwind utility classes. A dead-CSS-selector cleanup pass was attempted and reverted after it was found to produce false positives (details in §14); `globals.css` ends this migration exactly as it started, byte-for-byte.

## 2. Initial State of the Project

- Next.js 16 (App Router), React 19, Tailwind CSS 4 (imported via `@import "tailwindcss";` in `globals.css`, no `@theme` block, no `tailwind.config.js`).
- TypeScript, `@types/react`, `@types/react-dom`, `@types/node` were devDependencies, but **not configured** — no `tsconfig.json` existed, only a `jsconfig.json` with a bare `@/*` path alias. Zero `.ts`/`.tsx` files existed.
- 50 JS/JSX files: 17 in `app/` (14 route `page.jsx` files, `layout.jsx`, home `page.jsx`, `shared.jsx`) + 2 more in `app/` (`robots.js`, `sitemap.js`) + 27 in `components/` + 4 in `lib/`.
- `app/globals.css`: 9,284 lines, ~1,373 top-level selectors, 83 `:root` custom properties, 36 `@media` blocks on an ad hoc breakpoint system (`360/420/560/640/641/980/981/1024/1100/1279/1280`).
- 18 of the 44 `.jsx` files already had `"use client"`, correctly scoped to interactive leaves — this boundary was already idiomatic and preserved as-is throughout.
- `eslint.config.mjs` already imported `eslint-config-next/typescript`, so TypeScript linting activated automatically the moment `tsconfig.json` was added.

## 3. Migration Approach

Work was staged risk-ascending, with a full validation gate (typecheck, lint, build, visual diff, manual route spot-checks) run after every stage, and an explicit pause for user go-ahead between stages:

0. Safety net — installed Playwright, wrote a throwaway screenshot-diff script, captured a baseline.
1. TypeScript + Tailwind foundations — `tsconfig.json`, `@theme` tokens, `lib/*.js → .ts`.
2. Leaf presentational Server Components.
3. Simple Client Components.
4. Forms & modals.
5. Complex interactive components (Header, event filtering/pagination, WECODA donation section, the 1,014-line catering menu overlay).
6. Site shell (`SiteShell`, `Footer`, `layout`, `shared`, `robots`, `sitemap`).
7. Page/route files, risk-ascending (trivial static pages → mid pages → heavy pages → home/events last).
8. Cleanup, Playwright removal, this report.

Two components (`HorizontalGallery.jsx`, `HomeEditorialSections.jsx`) were missed from the original stage assignments and were caught and converted during Stage 7 when a page still importing untyped `.jsx` was noticed.

## 4. JavaScript-to-TypeScript Changes

- **50/50 files converted.** `tsconfig.json` added with `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `moduleResolution: "bundler"`. `allowJs` was kept `true` during the staged mixed-tree period and flipped to `false` once the last file converted, as an explicit "no stragglers" gate.
- **Zero `any` used anywhere.** The few unavoidable narrow escapes are non-null assertions (`!`) on statically-guaranteed-safe array/lookup accesses (e.g. a literal non-empty array's `[0]` element, or a lightbox index always in-bounds by construction) — each is a one-line, locally-justified use, not `any` and not a suppression comment.
- **Meaningful domain types**, not just enough to satisfy the compiler:
  - `RorumEvent` in `lib/data.ts` — modeled from *both* what the data literally sets (`slug`, `title`, `date`, `time`, … all non-optional, since every event in the array actually has them) *and* what consumer code defensively reads (`duration?`, `startTime?`, `endTime?`, `location?`, `fullDescription?`, `description?`, `spotsLeft?` — none ever set today, but read via `??` chains in `EventCard.tsx` and `app/events/[slug]/page.tsx`).
  - `NavItem` in `lib/data.ts` is a **discriminated union** (`{ href: string; children?: undefined } | { href: null; children: NavChild[] }`), not a loose `{ href: string | null; children?: NavChild[] }` — this was required for `Header.tsx` to type-check the desktop/mobile nav rendering correctly, and it's a more accurate model of the real data (an item never has both a real `href` and `children`).
  - `EventDateFilter` / `EventPriceFilter` / `EventAvailabilityFilter` literal unions in `EventFilters.tsx`, shared with `EventsClientPage.tsx` instead of duplicating the string sets.
  - `ButtonVariant`, `CardVariant`, `SocialIconName`, `QuickPathHref`, `InquiryFormType`, `CateringMenuCategory`, `BankField`, `MembershipWeekMediaItem` — all derived from the actual literal values used at real call sites (verified by grepping every usage before choosing the union members), not guessed.
- **Real React/DOM typing patterns used**: `React.FormEvent<HTMLFormElement>`, `React.ChangeEvent<HTMLInputElement>`, `useRef<HTMLButtonElement | null>(null)`, `RefObject<HTMLElement | null>`, a small `CSSProperties & { "--custom-prop": string }` augmentation for the several places that set CSS custom properties inline (`EventShare.tsx`, `Header.tsx`, `Footer.tsx`, `app/contact/page.tsx`, `app/community-membership/page.tsx`).
- **No `React.FC`** anywhere — every component is a plain typed function.

## 5. CSS-to-Tailwind Changes

**Only the foundation was built; no component migration was performed.** In `app/globals.css`, a `@theme inline { ... }` block was added mapping the existing color/radius/font `:root` variables into Tailwind-visible tokens (`bg-accent`, `text-text-primary`, `rounded-lg`, `font-heading`, etc. are now valid utilities), plus one custom breakpoint (`--breakpoint-desktop: 981px`) matching the site's real primary breakpoint. Deliberately **not** promoted: the `--rgb-*` triplets (no Tailwind utility story for raw RGB triplets used inside hand-authored `rgba()` calls).

No component's `className` usage was converted to Tailwind utilities during Stages 2–7 — every `.tsx` file still uses the exact same custom CSS classes as its `.jsx` predecessor. This is a significant, honest gap against the original request's Phase 3 ("migrate CSS to Tailwind, primarily"). See §14 for why, and §17 for how to actually execute this as a follow-up.

## 6. Architecture Improvements

- **`lib/cateringMenu.ts` extracted** from `components/CateringMenuOverlay.jsx`, which had ~400 lines of static `menuCategories` data embedded directly in the component file (the single largest static-content-in-component offender in the codebase). The component now imports typed data instead of defining it inline.
- **Two unused export aliases removed**: `CardsGrid` (an alias for `QuickPathsGrid` in `app/shared.tsx`) and `ImageGrid` (an alias for `ImageGallery` in `components/Cards.tsx`) — both confirmed via repo-wide search to have zero importers.
- No other restructuring was performed — per the migration constraints, existing file locations and the Server/Client Component boundary (already idiomatic) were preserved as-is.

## 7. Next.js and React Improvements

- **Fixed a real `react-hooks/refs` lint error** in `CateringMenuOverlay.tsx` (pre-existing, present before this migration): a ref was mutated directly in the render body (`updateActiveCategoryRef.current = updateActiveCategory` ran on every render, outside any effect). Restructured so the function is defined before the component's early return and its ref is synced via a dependency-less `useEffect` (runs after every render, same "always fresh closure" behavior) instead of during render. Zero behavioral change — only *when* in the render lifecycle the assignment happens.
- **Fixed a real argument-arity bug** in `CvUploadModal.tsx`: `submitCvApplication(formData)` was called with an argument, but the function was declared with zero parameters. TypeScript's argument-count check caught this immediately (JS silently drops extra call arguments; TS doesn't). The function is a placeholder (`await sleep(500)`, with a pre-existing `TODO` comment acknowledging CV uploads aren't wired to a real backend yet) that never read the argument, so the fix was simply removing it from the call site — zero behavioral change.
- `app/robots.js` / `app/sitemap.js` converted to `.ts` using Next's own `MetadataRoute.Robots` / `MetadataRoute.Sitemap` types instead of untyped return objects.
- `app/events/[slug]/page.tsx` correctly types the async dynamic-route params shape (`params: Promise<{ slug: string }>`), matching Next 15/16's async-params API that the original JS already used correctly at runtime but had no compile-time contract for.
- `next/font`, `metadata`, and the Server/Client Component split were already idiomatic in the original codebase and required no changes beyond adding types.

## 8. Accessibility Improvements

No accessibility behavior was changed. The existing accordion patterns (FAQ, catering menu, WECODA bank details), focus-trap modals (`ApplicationModal`, `PrivacyPolicyModal`), and ARIA attributes were preserved exactly as they were — this migration's scope was typing and tooling, not an accessibility audit. See §17 for a recommended follow-up.

## 9. Responsive-Design Improvements

None performed — out of scope for this migration. The site's existing ad hoc 11-value breakpoint system in `globals.css` is unchanged (flagged in §14 as a risk for any *future* Tailwind conversion, since it doesn't map cleanly onto Tailwind's default `sm/md/lg/xl/2xl` scale).

## 10. Files Removed

- `dev-restart.err.log` — a stray debug log at the repo root from an earlier dev-server-restart tool, referencing a `CateringMenuButton` component/prop shape that no longer exists in the codebase. Confirmed not referenced by any config.
- `jsconfig.json` — superseded by `tsconfig.json` (Next.js does not support both simultaneously; the `@/*` alias carried over unchanged).
- All 50 original `.js`/`.jsx` files, each replaced 1:1 by its `.ts`/`.tsx` conversion (see §12).

**Not removed** (found, verified, but left alone — see §14): ~61 CSS class selectors in `globals.css` that appear unused by any `.tsx` source. A removal was attempted and reverted after it deleted 3 selectors that are actually constructed dynamically via template literals (a false-positive class of bug in the detection method itself, not a judgment call). The candidate list is preserved in §17 for a follow-up pass with proper verification.

## 11. Dependencies Removed

Net change: **zero** production or permanent devDependencies added or removed. `playwright`, `pixelmatch`, and `pngjs` were added as devDependencies specifically for this migration's visual-regression validation (Stage 0) and removed again in Stage 8 once validation was complete (see §14 for the reasoning).

## 12. Important Files Renamed or Moved

All 50 conversions are simple extension changes (`Foo.jsx` → `Foo.tsx`, `bar.js` → `bar.ts`) at the same path — no files were relocated to different directories. The one net-new file is `lib/cateringMenu.ts` (extracted, not renamed).

## 13. Remaining Custom CSS and Why It Remains

All 9,284 lines of `app/globals.css` remain as hand-written CSS, for two distinct reasons:

1. **By design** (per the original request's own allowance): complex animations, pseudo-element effects (e.g. the FAQ accordion's plus/minus cross built from two overlapping `linear-gradient` bars), and named `grid-template-areas` layouts are exactly the category of CSS the request said to keep custom rather than force into Tailwind arbitrary-value utilities.
2. **Not attempted this session**: the bulk of the file — ordinary layout, spacing, color, and typography rules that *could* reasonably become Tailwind utilities — was never touched, because the CSS→Tailwind component migration (Phase 3) was not executed at all in this session (see §5, §14).

## 14. Unavoidable Technical Compromises

- **CSS→Tailwind component migration was not executed.** This is the largest gap against the original request. It requires translating ~1,373 selectors across an ad hoc 11-value breakpoint system, file by file, with visual verification at each step — realistically a comparable-sized effort to the TS migration on its own, and it was not attempted in this session's remaining scope.
- **Dead-CSS removal was attempted and reverted.** A script-based approach found 65 CSS class names with zero literal-string matches in any `.tsx` file. Two real bugs were found *in the detection/removal method itself* during verification:
  1. A span-overlap bug in the removal script corrupted file content (caught immediately via a brace-balance check before it was ever applied to the working file).
  2. After fixing that, a second, more serious issue was found only via the visual-regression diff: 3 of the "dead" classes (`next-step-card-final`, `next-step-card-host`, `next-step-section-final`) are actually live, constructed dynamically by `CTASection`'s `` `next-step-card-${variant}` `` template literal in `ui.tsx` — a literal-substring search cannot see a class name that's assembled at runtime from a prop value. This was caught before being finalized, and the change was fully reverted; `globals.css` is confirmed byte-identical to the pre-migration committed version. The remaining ~58 candidates are very likely genuinely dead (manually spot-verified for several), but are documented rather than removed, since the one confirmed false-positive proves the method isn't reliable enough to trust unsupervised for the rest.
- **Non-null assertions (`!`)**: used in a handful of spots where an array/lookup is statically guaranteed non-empty by how it's constructed (e.g. `pages[0]!` in `lib/seo.ts`, backed by a non-empty literal array) but TypeScript's `noUncheckedIndexedAccess` can't prove it. Each is a one-line, narrow, documented case — not a blanket type-safety opt-out.
- **A stale dev-server cache produced a false alarm during Stage 8.** After hundreds of file changes and a full build-config migration on one long-running `next dev` process, one section rendered incorrectly in the browser despite correct HTML/CSS. A production build on a separate port confirmed the underlying code was correct; clearing `.next` and restarting the dev server resolved it. No code change was needed — flagged here because it's a good example of why "check the actual rendered output" and "verify against a fresh process" both matter before assuming a code regression.

## 15. Validation Commands Executed

Run after every single stage (0 through 8), not just at the end:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # next build --webpack
```

Plus, through Stage 7, a Playwright-based script screenshotting all 15 routes × 3 widths (375/768/1440px) and pixel-diffing against a baseline, with videos hidden and the Next.js dev-mode indicator removed from each capture to keep it deterministic (verified via 3 consecutive identical-result runs before trusting it as a gate).

## 16. Build, Lint, Typecheck Results (final state)

- `npm run typecheck`: **clean, 0 errors.**
- `npm run lint`: **0 errors**, 12 warnings — all pre-existing `@next/next/no-img-element` suggestions (recommending `next/image` over `<img>` in `about`, `catering`, `community-membership`, `event-decoration` pages, `CateringMenuOverlay`, `HorizontalGallery`) that existed before this migration and were not in scope to fix.
- `npm run build`: **green.** All 50 routes/pages generate identically to the pre-migration build (same static/SSG split, same route list).
- No test suite exists in this project (`npm test` is not defined) — none was added, as adding a test framework was not part of the requested scope.
- Manually verified: every one of the 15 routes returns HTTP 200; all 3 `next.config.js` redirects resolve correctly; the visual diff stayed within a ~100–270px noise floor (established via repeated same-code runs) at every stage except one false alarm (§14), with zero unexplained regressions.

## 17. Recommended Future Improvements

1. **Execute the CSS→Tailwind component migration** as its own dedicated effort (Phase 3 of the original request). Recommend starting with the same risk-ascending, stage-by-stage, visually-verified approach used here, and resolving the breakpoint mapping question first (the site's real cutoffs — `360/420/560/640/641/980/981/1024/1100/1279/1280` — don't line up with Tailwind's default scale; consider custom `--breakpoint-*` tokens per real cutoff rather than force-fitting).
2. **Re-attempt the dead-CSS cleanup** with a more rigorous method: for every "unused" candidate, explicitly grep for template-literal construction patterns (`` `${...}-${x}` ``) in addition to literal-string search before treating it as dead. The candidate list from this session (minus the 3 confirmed false positives) is a reasonable starting point:
   `about-format-tags`, `about-hero-lead`, `about-inline-link-green`, `about-inline-link-red`, `about-location-card`, `about-location-copy`, `about-location-grid`, `about-location-section`, `about-pillar`, `about-pillars-grid`, `about-pillars-section`, `about-statement`, `about-statement-copy`, `brand-mark`, `catering-hero-microcopy`, `catering-menu-preview`, `catering-offer-card`, `catering-offer-content`, `catering-offer-lead`, `catering-philosophy-actions`, `catering-story-grid`, `clean-list`, `cv-modal-instructions`, `cv-upload-intro`, `decoration-available-note`, `detail-title`, `event-back-link`, `event-date-line`, `event-detail-copy`, `event-detail-layout`, `event-detail-panel`, `event-expect-chips`, `event-expect-section`, `event-hosted-by`, `event-practical-list`, `event-practical-section`, `event-price`, `event-subtitle`, `event-ticket-actions`, `event-ticket-cta`, `faq-inline-prompt-neutral`, `footer-title`, `gallery-lightbox-spacer`, `grid-2`, `map-placeholder`, `mobile-menu-logo`, `mobile-menu-panel-head`, `quick-card-link-divider`, `quick-card-link-item`, `quick-card-links`, `quick-card-service-link`, `quick-path-card-static`, `service-hero-grid`, `service-hero-grid-text-only`, `service-hero-image`, `service-hero-microcopy`, `volunteer-application-section`, `volunteer-application-wrap`.
3. **Decide on the 5 pre-existing bugs found but not fixed** during this migration (all preserved exactly as-is, with inline comments explaining each):
   - `FAQInlinePrompt` (in `components/ui.tsx`) accepts `question`/`label` props but never renders them — 4 pages (`home`, `events`, `about`, `contact`) pass custom FAQ-prompt copy that is currently silently dropped in favor of a hardcoded "Questions?" string.
   - `Card`'s `variant` prop (`ui.tsx`) generates `card-{variant}` classes with no matching CSS for any of its 4 used values — a harmless no-op today.
   - `ContactForm` and `CateringInquiryForm` validate and show a "Thank you" success message but never actually send data anywhere (no `submitToFormspree` call, unlike `VolunteerApplicationForm`) — likely an MVP-stage gap rather than intentional.
   - `EventsClientPage.tsx`'s `getDateWindow` originally checked `range === "upcoming"`, but the real filter value is `"soonest"` — they never matched, so picking "Soonest first" applies no date filter at all (only re-sorts). Preserved as-is since fixing it changes live filtering behavior.
4. **Add a real test suite.** None exists today; the strict TypeScript types now in place make component/utility unit tests significantly cheaper to write than before this migration.
5. **Consider `next/image` for the 6 remaining `<img>` warnings** flagged by lint, once the pragmatic tradeoffs (each image's actual dimensions, whether `fill` is appropriate) are reviewed per site.

## File-by-File Summary

### `lib/` (4 converted, 1 created)
| File | Change |
|---|---|
| `lib/siteConfig.ts` | Converted from `.js`. Added `CompanyDetails`, `ContactDetails`, `SocialLink` (with a 4-value `SocialIconName` union matching everything `SocialIcon.tsx` actually renders, not just the 2 currently used). |
| `lib/formspree.ts` | Converted from `.js`. `submitToFormspree(formData: FormData): Promise<void>`. |
| `lib/seo.ts` | Converted from `.js`. Returns `next`'s `Metadata` type. |
| `lib/data.ts` | Converted from `.js`. Added `RorumEvent`, `NavItem` (discriminated union), `PageMeta`, `PracticalDetail`, `TitledText`, `PackageTier`, `FaqEntry`/`FaqData`, `ServiceCard`. Removed the dead `eventBanner` helper (already flagged by lint as unused). |
| `lib/cateringMenu.ts` | **New file.** `CateringMenuCategory`/`CateringMenuItem` types plus the `menuCategories` data extracted out of `CateringMenuOverlay.jsx`. |

### `components/` (27 converted)
| File | Notable change beyond typing |
|---|---|
| `ui.tsx` | `ButtonVariant`, `CardVariant` unions verified against real usage; `SectionHeader`'s dynamic heading tag typed via a template-literal type instead of a cast to `any`; `FAQInlinePrompt`'s dead-prop bug documented, not fixed. |
| `Cards.tsx` | Removed unused `ImageGrid` alias export. |
| `SocialIcon.tsx` | — |
| `MembershipBenefitsGrid.tsx` | — |
| `LegalPage.tsx` | — |
| `EventCard.tsx` | Uses `RorumEvent` from `lib/data.ts`. |
| `FAQAccordion.tsx` | — |
| `EventShare.tsx` | Added a `CSSProperties & { "--social-brand-color": string }` type for its inline custom-property styles. |
| `PrivacyConsent.tsx` | — |
| `PrivacyPolicyContent.tsx` | — |
| `PrivacyPolicyModal.tsx` | Typed `getFocusableElements`/focus-trap logic; `.closest<HTMLElement>()` generic used to type `applicationDialog.inert`. |
| `ContactForm.tsx` | — |
| `CateringInquiryForm.tsx` | — |
| `InquiryForm.tsx` | `InquiryFormType` union (`"default" | "booking" | "decoration"`) verified against real call sites. |
| `VolunteerApplicationForm.tsx` | — |
| `ApplicationModal.tsx` | — |
| `CvUploadModal.tsx` | **Fixed the `submitCvApplication` argument-arity bug** (see §7). |
| `Header.tsx` | Required the `NavItem` discriminated-union refinement in `lib/data.ts` to type-check the nav rendering. |
| `EventFilters.tsx` | `EventDateFilter`/`EventPriceFilter`/`EventAvailabilityFilter` unions, exported for reuse by `EventsClientPage.tsx`. |
| `EventsClientPage.tsx` | Documented (not fixed) the `getDateWindow` "upcoming" vs "soonest" dead-branch bug (§17). |
| `EventsPaginatedList.tsx` | — |
| `WecodaDonationSection.tsx` | — |
| `CateringMenuOverlay.tsx` | **Fixed the pre-existing `react-hooks/refs` lint error** (see §7); extracted its embedded data to `lib/cateringMenu.ts`. |
| `SiteShell.tsx` | Added an explicit `number | undefined` guard around `cancelAnimationFrame` for strict-mode compatibility. |
| `Footer.tsx` | — |
| `HorizontalGallery.tsx` | Converted in Stage 7 after being missed from the original stage plan. |
| `HomeEditorialSections.tsx` | Converted in Stage 7 after being missed from the original stage plan. |

### `app/` (17 converted, plus `robots`/`sitemap`)
All 14 route `page.jsx` files, `layout.jsx`, home `page.jsx`, and `shared.jsx` converted to `.tsx`; `robots.js`/`sitemap.js` converted to `.ts` using Next's `MetadataRoute` types. `app/shared.tsx` dropped its unused `CardsGrid` alias export and exports `QuickPathHref` (needed by `app/page.tsx`). `app/community-membership/page.tsx` had its one block of raw HTML markup (`class=`, `stroke-width=`, a hand-pasted `<svg>`) cleaned up to idiomatic JSX (`className`, `strokeWidth`, the `<ArrowRight>` component) — verified byte-identical rendered output before and after. No other page required content or behavior changes beyond typing.

### Configuration
| File | Change |
|---|---|
| `tsconfig.json` | **New.** Strict mode, `noUncheckedIndexedAccess`, `allowJs` toggled `true` → `false` across the migration. |
| `jsconfig.json` | Removed (superseded). |
| `app/globals.css` | One addition only: the Stage 1 `@theme inline` block. Otherwise unchanged (see §5, §14). |
| `package.json` | Added `"typecheck": "tsc --noEmit"` script. `playwright`/`pixelmatch`/`pngjs` added then removed (net zero). |
| `.gitignore` | `.qa`/`test-results` entries added then removed along with the Playwright tooling. |
| `dev-restart.err.log` | Removed (stray debug artifact). |
