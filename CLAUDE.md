# RORUM — Claude Code Working Instructions

## 1. Project

This repository contains the RORUM corporate website.

Main technologies:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Sanity CMS
- Playwright
- multilingual content: English, Danish and Ukrainian

Sanity is the source of truth for editable website content.

The long-term CMS goal is:

A non-technical RORUM administrator should be able to maintain website content through Sanity Studio without editing source code.

---

# 2. Primary Working Principle

Do not start modifying code immediately after receiving a non-trivial task.

For every substantial task follow this workflow:

1. Understand the requested outcome.
2. Inspect the existing implementation.
3. Identify affected routes, components, schemas, queries and utilities.
4. Search for existing project patterns before creating new ones.
5. Read the relevant sections of `MIGRATION_REPORT.md`.
6. Consult `ARCHITECTURE.md` when architectural context is needed.
7. Consult `SANITY_MIGRATION.md` for Sanity migration work.
8. Use Context7 only when current external-library documentation is required.
9. Create a short implementation plan.
10. Implement the smallest coherent solution.
11. Run relevant static checks.
12. Run the application locally when browser verification is relevant.
13. Test the implementation with Playwright.
14. Fix problems discovered during testing.
15. Repeat testing until the affected functionality passes.
16. Review the final diff.
17. Report clearly what was changed and what was actually verified.

Generating code is not completion.

A task is complete only after implementation and appropriate verification.

---

# 3. Git and GitHub Rules

The user controls Git history, branches, commits, pushes and GitHub.

Read-only Git inspection is allowed when useful.

Examples:

- `git status`
- `git diff`
- `git log`
- `git show`
- `git branch`

Do NOT:

- commit
- push
- pull
- merge
- rebase
- reset
- stash
- create branches
- delete branches
- switch branches unless explicitly requested
- force push
- create pull requests
- modify GitHub repository state

Do NOT propose commit messages.

Do NOT finish a task by suggesting that the user should commit or push.

Leave all code changes in the working tree.

The user will review, commit, branch and push manually.

---

# 4. Preserve Existing Architecture

Before introducing a new abstraction, search the repository.

Check whether the project already has:

- a reusable component
- a page-section pattern
- a Sanity schema pattern
- a GROQ query pattern
- localization helpers
- image helpers
- icon handling
- button/CTA models
- SEO utilities
- validation helpers
- reusable field definitions
- tests for similar behavior

Prefer extending existing patterns over creating parallel systems.

Do not refactor unrelated code merely because another implementation appears cleaner.

Do not redesign architecture as a side effect of a feature task.

If a significant architectural change appears necessary, first determine whether the current architecture can solve the requirement safely.

---

# 5. Source of Truth Priority

When information conflicts, use the following priority:

1. Current working code
2. Actual application behavior
3. `ARCHITECTURE.md`
4. `SANITY_MIGRATION.md`
5. Relevant recent entries in `MIGRATION_REPORT.md`
6. Historical implementation assumptions

`MIGRATION_REPORT.md` is historical context, not an absolute source of truth.

---

# 6. MIGRATION_REPORT.md Usage

`MIGRATION_REPORT.md` may be large.

Do NOT read the whole document for every task.

Instead:

1. identify the current page or feature
2. search the report for that page, schema, component or feature
3. read only relevant sections
4. use it to avoid repeating completed work or undoing deliberate decisions

Current code takes precedence when the report is outdated.

When migration work is completed, update the report only when useful to preserve important migration history.

Do not rewrite unrelated historical sections.

Do not turn `MIGRATION_REPORT.md` into a task checklist.

Use `SANITY_MIGRATION.md` for migration status and acceptance criteria.

---

# 7. Context7 Usage

Context7 is available for current external documentation.

Use it when implementation depends on current behavior of:

- Next.js
- React
- Sanity
- Playwright
- Tailwind
- other installed libraries

Do not use Context7 when the answer already exists inside the repository.

Preferred sequence:

existing repository pattern
→ project documentation
→ Context7 if external API verification is still needed

Do not introduce a new library API pattern merely because documentation shows a newer alternative if the project's established implementation remains valid.

---

# 8. Sanity CMS Principle

Editorial website content should normally be managed from Sanity.

Examples include:

- headings
- subheadings
- paragraphs
- labels
- captions
- images
- image alt text
- videos
- icons
- logos where editorially appropriate
- CTA labels
- CTA destinations
- cards
- lists
- statistics
- contact information
- FAQ entries
- testimonials
- downloadable files
- page-section content
- SEO titles
- SEO descriptions
- relevant metadata

Do NOT expose implementation details merely to make everything technically configurable.

Values that should normally remain in code include:

- CSS values
- breakpoints
- internal component IDs
- technical route configuration
- internal query configuration
- purely implementation-level flags
- internal constants with no editorial meaning

The goal is not maximum configurability.

The goal is a clear content-management experience for a non-technical administrator.

---

# 9. Sanity Migration Workflow

For full-site CMS migration work, process the website systematically.

Do not attempt to change every schema simultaneously.

Work page by page or by a clearly shared page family.

For each page:

## Phase 1 — Inspect the actual page

Open the rendered page.

Scroll from top to bottom.

Identify every visible section.

Create an internal page-content inventory.

Do not infer page content only from source files.

The rendered website must be inspected.

---

## Phase 2 — Map frontend content to Sanity

For every visible editorial element determine whether it is:

- already fully controlled by Sanity
- partially controlled by Sanity
- hardcoded
- obsolete
- duplicated
- incorrectly modeled
- unnecessarily exposed to editors

Trace the complete data path:

Sanity field
→ document
→ GROQ/data fetching
→ frontend component
→ rendered result

Do not stop after adding a schema field.

---

## Phase 3 — Design Sanity Studio UX

Sanity Studio is part of the product.

The administrator should not need to understand React, TypeScript, GROQ or the internal component tree.

Where reasonable, Studio should follow the conceptual top-to-bottom order of the website.

If the page contains:

1. Hero
2. Introduction
3. Services
4. Statistics
5. CTA

Studio should normally present those sections in the same conceptual order.

Use human-readable labels.

Prefer:

- Hero
- Main heading
- Introduction
- Main image
- Button text
- Button link
- Services
- Contact details

Avoid exposing labels such as:

- `heroData`
- `ctaConfig`
- `sectionRef`
- `rawItems`
- internal property identifiers

unless technically necessary.

Use field descriptions when meaning is not obvious.

---

# 10. Sanity Editor UX Requirements

For relevant document types:

- fields appear in logical page order
- related fields are grouped
- unnecessary technical fields are hidden
- obsolete fields are removed from the editor when safe
- validation is understandable
- required fields are sensible
- arrays are reorderable when page order matters
- document previews are understandable
- image previews are useful
- icon selection is understandable
- references have meaningful previews
- field labels use normal human language

Avoid deep nested structures unless they provide a real editorial benefit.

A schema is not complete merely because it compiles.

---

# 11. Localization

The website supports:

- English
- Danish
- Ukrainian

Preserve the existing localization architecture.

Do not introduce a second localization strategy.

For user-facing translated content:

- preserve existing translations
- do not silently replace Danish or Ukrainian with English
- do not delete locale values
- use the established project pattern
- verify all supported locales when the change affects localized content

Playwright should verify language switching when relevant.

---

# 12. Images

For images managed by Sanity, verify:

Sanity asset
→ image field
→ query
→ frontend image URL
→ rendering
→ alt text
→ responsive behavior

Do not leave duplicated hardcoded editorial images once Sanity becomes the authoritative source unless the hardcoded image is an intentional fallback.

Do not delete existing assets during routine migration.

---

# 13. Icons

If an icon conveys editorial meaning and an administrator may reasonably need to change it, make it editable.

Prefer controlled icon selectors or constrained choices.

Do not require non-technical administrators to know arbitrary technical icon identifiers.

Verify that changing the selected icon produces the expected frontend change.

---

# 14. Buttons and Links

For editable CTA elements verify:

- visible label
- URL/destination
- internal versus external navigation
- accessibility
- empty state
- responsive behavior

Reuse existing button/link content models where appropriate.

Avoid creating a different CTA schema structure for every page without a reason.

---

# 15. Playwright Is Part of Definition of Done

For changes affecting:

- rendered pages
- interactions
- responsive behavior
- forms
- navigation
- localization
- Sanity Studio
- CMS/frontend integration

browser verification is required.

Use Playwright.

Do not consider a UI task complete based only on code inspection.

Do not use Playwright only for screenshots.

Interact with the application.

Examples:

- navigate
- scroll
- click
- open menus
- change locale
- fill fields
- submit forms
- open dialogs
- close dialogs
- interact with Sanity Studio
- publish content where safe
- reload frontend
- inspect rendered values

---

# 16. Localhost First

Normal development and verification should happen locally.

Inspect project scripts and configuration before assuming port numbers.

Possible local environments include:

Frontend:
`http://localhost:3000`

Sanity Studio:
often `http://localhost:3333`

but always inspect actual configuration first.

A deployment is not required for the normal:

implement
→ test
→ fix
→ retest

loop.

The user controls deployment.

---

# 17. Dataset Safety

Running Sanity Studio on localhost does NOT mean the content is stored locally.

Before performing any content mutation, determine which Sanity dataset is active.

Never assume a localhost Studio is safe production-isolated storage.

Prefer a dedicated development or staging dataset for extensive automated CMS mutation testing.

When testing against production content is unavoidable:

- make only minimal reversible changes
- record original values
- restore them immediately after testing
- do not bulk modify content
- do not bulk delete content
- do not perform destructive migrations without explicit instruction

---

# 18. Sanity Publishing Tests

Where safe and appropriate, verify real CMS behavior.

A complete representative CMS test may include:

1. open the relevant document
2. record the current value
3. edit the field
4. verify validation
5. publish
6. reload the frontend
7. verify the changed value
8. restore the original value
9. publish the restoration
10. verify restoration

Do not leave QA text, QA images or temporary test data in the dataset.

If authentication or permissions prevent an action, report the exact limitation.

Never claim Publish was tested when it was not.

---

# 19. Bandwidth-Safe Testing

Sanity project bandwidth is limited.

Images and especially video must not be repeatedly downloaded during automated testing.

The default Playwright strategy is:

BLOCK HEAVY SANITY ASSET DOWNLOADS.

For routine functional tests:

- block Sanity image asset requests when image rendering itself is not under test
- block Sanity video/media downloads
- prevent autoplay
- do not play video
- do not repeatedly fetch original high-resolution images
- inspect DOM attributes, asset references and URLs instead

Text, navigation, forms, localization, layout structure and CMS integration can usually be tested without downloading full media.

---

# 20. Playwright Network Policy

For routine page audits and regression tests, use request interception where appropriate.

Heavy Sanity CDN image/video requests should normally be aborted unless the current test specifically validates media rendering.

Sanity media domains should be identified from the actual requests/configuration rather than broad-blocking unrelated application resources.

Do not block:

- Sanity API requests required to retrieve content
- authentication requests
- Studio application resources
- JavaScript/CSS required for page behavior

Only avoid unnecessary heavy asset transfer.

When request interception is used, verify that the resulting test still exercises the intended functionality.

---

# 21. Image Testing Policy

Most CMS image integration tests do NOT require downloading the full image.

Prefer verifying:

- image asset reference exists
- expected asset reference changes
- frontend URL changes
- alt text changes
- expected image element exists
- responsive attributes/configuration are correct

When actual rendering must be verified:

- allow the specific image request
- prefer a transformed/resized asset
- avoid original-resolution requests
- avoid repeating the same heavy visual test unnecessarily

After one representative media-render verification, subsequent regression checks should normally use lightweight verification.

---

# 22. Video Testing Policy

Routine automated testing must NOT play videos.

Prefer verifying:

- video component exists
- correct video reference exists
- playback/source identifier is correct
- poster configuration is correct
- controls/configuration are correct
- video does not unexpectedly autoplay

Use lazy loading / `preload="none"` where consistent with the intended UX and existing implementation.

Only download or play video when the task specifically concerns video playback.

---

# 23. CMS Media Mutation Tests

When verifying that an image or video can be changed from Sanity:

1. record the existing asset reference
2. select/change the asset in Studio
3. publish when safe
4. verify the frontend data/reference changed
5. verify the appropriate DOM/source attribute changed
6. avoid downloading the full asset unless required
7. restore the original asset
8. publish restoration
9. verify restoration

Do not repeatedly download media merely to prove the CMS connection works.

---

# 24. Responsive Verification

Relevant frontend changes must be tested at representative:

- mobile
- tablet
- desktop

viewport sizes.

Check:

- overflow
- clipping
- spacing
- typography
- navigation
- menus
- cards
- grids
- buttons
- images
- video containers
- sticky elements
- horizontal scrolling
- content order

Do not fix desktop by breaking mobile.

---

# 25. Static Validation

Before browser verification, inspect `package.json` and use the project's actual available scripts.

Relevant checks may include:

- TypeScript
- lint
- tests
- Playwright suite
- production build

Do not invent command names.

Fix errors introduced by the current task.

Do not make unrelated broad changes just to remove historical warnings.

---

# 26. Production Build

For substantial changes involving:

- schemas
- routing
- server/client boundaries
- data fetching
- shared components
- significant CMS integration

run a production build when practical.

A dev server working successfully does not automatically prove that production compilation succeeds.

---

# 27. Autonomous Bug-Fix Loop

If testing reveals an error, do not immediately stop and ask the user what to do.

For technical failures within task scope:

1. inspect failure
2. determine the cause
3. fix it
4. rerun the failed test
5. run relevant regression checks
6. repeat until passing or genuinely blocked

Ask the user only when a business/product decision cannot reasonably be inferred.

---

# 28. Scope Control

Do not expand a task into unrelated redesign or refactoring.

If an unrelated issue is discovered:

- record it
- continue current work when safe
- mention it in the final report

Fix unrelated issues only if they directly block the requested task or make the current implementation unsafe.

---

# 29. Definition of Done — Normal Task

A normal task is complete when:

- requested behavior is implemented
- relevant existing architecture is preserved
- unnecessary duplication was avoided
- relevant checks pass
- affected browser behavior is tested
- responsive behavior is checked where relevant
- no relevant new console/runtime errors remain
- CMS integration is tested where relevant
- temporary QA content is restored
- final diff is reviewed
- Git/GitHub state has not been modified

---

# 30. Definition of Done — Sanity Page Migration

A page is fully migrated only when:

- every visible section has been audited
- every appropriate editable element has been identified
- appropriate editorial content is managed from Sanity
- hardcoded editorial content is removed where appropriate
- queries retrieve the correct data
- frontend renders Sanity values
- EN/DA/UKR behavior is correct
- images are connected
- icons are connected where applicable
- buttons/links are connected
- reorderable content works where applicable
- Studio follows the conceptual page order
- Studio is understandable to a non-technical editor
- unnecessary implementation fields are not exposed
- validation works
- representative publishing tests work
- representative frontend updates work
- temporary testing values are restored
- mobile/tablet/desktop are checked
- no relevant runtime errors remain

---

# 31. Definition of Done — Entire Website Sanity Migration

Do not declare the website migration complete merely because schemas compile.

Perform a route-by-route audit.

For every public page:

1. open actual rendered page
2. inspect from top to bottom
3. inventory editable content
4. map content to Sanity
5. fix missing integration
6. inspect Studio UX
7. test representative edits
8. test publishing where safe
9. verify frontend updates
10. verify localization
11. verify responsive behavior
12. record migration status in `SANITY_MIGRATION.md`

Do not skip pages merely because they resemble another page.

Shared components should receive representative deep testing and regression checks on pages where they are reused.

---

# 32. Final Response

When finished, report:

## Completed

What was implemented.

## Verified

What was actually tested.

## Remaining issues

Only genuine unresolved issues or blockers.

## Files changed

A concise summary where useful.

Never describe an unperformed test as successful.

Do not propose commit messages.

Do not suggest commits or pushes.

Do not modify Git or GitHub.
