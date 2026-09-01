# RORUM — Project Architecture

## Purpose

This document describes the stable architecture and architectural conventions of the RORUM corporate website.

It should remain concise.

Current source code is the ultimate source of truth.

When architecture changes intentionally, update this document.

---

# 1. Application

RORUM is a corporate website built with:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Sanity CMS
- Playwright

The site supports:

- English
- Danish
- Ukrainian

---

# 2. Architectural Goals

The project should remain:

- maintainable
- strongly typed
- reusable without over-abstraction
- responsive
- multilingual
- CMS-driven
- understandable for future developers
- manageable in Sanity by non-technical editors

Prefer simple established project patterns over introducing parallel systems.

---

# 3. Frontend Architecture

Before changing frontend architecture, inspect the current repository.

Identify and preserve the project's actual:

- routing structure
- layout structure
- server/client component boundaries
- shared components
- page components
- utilities
- styling conventions
- image handling
- SEO handling
- localization handling

Do not infer these solely from this document.

---

# 4. CMS Architecture

Sanity is the content source for editable editorial website content.

Expected data flow:

Sanity Studio
→ Sanity Content Lake
→ GROQ / Sanity client
→ Next.js
→ components
→ rendered page

A field is not considered integrated merely because it exists in a schema.

The complete chain must work.

---

# 5. Content Responsibility

Sanity should contain editorial content.

Examples:

- text
- images
- icons where editorial
- video references
- buttons
- links
- cards
- FAQs
- contact information
- section content
- metadata
- SEO content

Application code should retain technical implementation concerns.

Examples:

- layout implementation
- CSS
- breakpoints
- application logic
- technical IDs
- routing internals
- component implementation
- query implementation

---

# 6. Sanity Studio Architecture

Studio should reflect the website rather than the internal React component tree.

For page documents:

Website page order should normally correspond to Studio editing order.

Example:

Website:

1. Hero
2. Introduction
3. Services
4. Gallery
5. CTA

Studio:

1. Hero
2. Introduction
3. Services
4. Gallery
5. CTA

Use grouping only when it improves editor comprehension.

Avoid exposing technical configuration unnecessarily.

---

# 7. Localization Architecture

The website supports:

- EN
- DA
- UKR

Always inspect the repository to determine the established localized-field structure before adding new localized fields.

All new translatable fields must use the same established localization strategy.

Do not introduce another localization format.

---

# 8. Media Architecture

Images and video should use the project's existing Sanity/media patterns.

Important requirements:

- responsive images
- meaningful alt text
- appropriate optimization
- no unnecessary original-resolution downloads
- video should not be eagerly downloaded unless UX requires it

Media implementation must take Sanity bandwidth limits into account.

---

# 9. Testing Architecture

Playwright is the primary browser automation tool.

Testing layers:

## Static checks

Use the scripts actually defined in `package.json`.

Examples may include:

- TypeScript
- lint
- build
- automated tests

## Browser functional testing

Use Playwright for:

- navigation
- interactions
- responsive behavior
- localization
- frontend regression checks

## CMS integration testing

Use Sanity Studio + frontend together to verify:

Sanity edit
→ publish
→ frontend update

when safe.

## Media testing

Routine regression tests should block unnecessary heavy Sanity asset traffic.

---

# 10. Environment Architecture

Local development should normally use localhost.

A local frontend does not require deployment for normal browser verification.

Sanity Studio may also run locally.

Important:

Local Sanity Studio still connects to a hosted Sanity dataset.

Never treat localhost Studio as a local content database.

---

# 11. Dataset Environments

Prefer environment separation where practical:

Development:

- autonomous testing
- temporary edits
- CMS migration verification

Production:

- real website content

If a separate development/staging dataset exists, local automated mutation testing should prefer it.

Do not switch datasets or create datasets without understanding the project's existing environment configuration.

---

# 12. Git Responsibility

Claude may inspect Git for context.

The user owns:

- branches
- commits
- pushes
- merges
- pull requests
- GitHub repository changes

Claude must not modify Git/GitHub state unless explicitly instructed.

---

# 13. Main Project Areas

Keep this section updated from the actual repository.

Typical important areas include:

`app/`
Application routes, layouts and page entry points.

`components/`
Reusable frontend components.

`lib/`
Utilities, clients and shared application logic.

`sanity/`
Sanity Studio configuration, schemas, structures, queries and CMS-related code.

`tests/`
Automated tests.

`MIGRATION_REPORT.md`
Historical migration record.

`SANITY_MIGRATION.md`
Current CMS migration requirements and status.

`CLAUDE.md`
Agent working rules.

---

# 14. Architectural Change Rule

Before creating a new system:

1. search existing code
2. identify the closest established pattern
3. determine whether it can be extended
4. only introduce a new architectural concept when the existing architecture cannot reasonably satisfy the requirement

Do not introduce parallel abstractions for the same problem.
