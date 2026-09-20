# RORUM Website — Handoff Notes

Practical notes for taking over ownership, deployment, and maintenance of this project.

## 1. Project overview

Corporate website for RORUM, a community/events space. Multilingual (English,
Danish, Ukrainian), content managed through an embedded Sanity Studio, with
event ticketing via Billetto and contact/inquiry forms via Formspree.

## 2. Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Sanity CMS (Studio embedded in the app at `/studio`)
- Playwright (e2e/visual tests) + Vitest (unit tests)
- Hosted on Netlify

## 3. Install

```
npm install
cp .env.example .env.local   # then fill in real values, see §7 below
```

## 4. Local development

```
npm run dev        # http://localhost:3000 (also serves Sanity Studio at /studio)
```

Never commit `.env.local`.

Production build intentionally uses webpack (`next build --webpack`), not
Turbopack, while `npm run dev` runs on Turbopack normally — this is
deliberate. If you ever see a one-off `ENOENT ... build-manifest.json`
error in local dev on an Event detail page, it's a known, rare, self-healing
Next.js dev-mode artifact — retry, or clear `.next` and restart. It does not
affect production builds.

## 5. Production build

```
npm run build
```

## 6. Production branch

**Not yet finalized — resolve before go-live.** This repository currently has
several branches (`main`, `migration`, `cleanup`, plus a few older feature
branches: `new-hero`, `old-site`, `space-decoration`). There is no
`netlify.toml` or CI config in the repo recording which branch is
"production" — that's configured entirely in Netlify's dashboard. Confirm
and document which branch Netlify actually deploys from, and consider
archiving/deleting the unused branches once confirmed.

## 7. Environment variables

Names only — set real values in Netlify's site settings and in your own local `.env.local`. Full details, including which file/subsystem reads each one, are in `.env.example`'s own comments.

| Variable | Public / Server-only | Required? | Must be set in client's Netlify? |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public | **Required** — app fails to build/start loudly if missing/invalid, by design | Yes |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public | Required | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Public | Required (currently `production`) | Yes |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Public | Optional (has a default) | Optional |
| `NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN` | Public | Optional | Only if Studio is hosted on a different origin |
| `SANITY_API_READ_TOKEN` | Server-only | Optional (needed for draft preview) | Yes, if draft preview is wanted |
| `SANITY_API_WRITE_TOKEN` | Server-only | Optional, local-only — used only by the maintenance scripts in `scripts/`, never by the deployed app | No — not needed in Netlify at all |
| `NEXT_PUBLIC_FORMSPREE_ENDPOINT` | Public | Required for the contact form to submit | Yes |
| `FORMSPREE_RECIPIENT_EMAIL` | Documentation only — not read by any code, configure the actual recipient on the Formspree form itself | N/A | No |
| `BILLETTO_API_KEY_ID` / `BILLETTO_ACCESS_KEY_SECRET` | Server-only | Optional — ticket display degrades gracefully without live availability if unset | Yes, if live ticket availability is wanted |

`NEXT_PUBLIC_*` variables are compiled into the browser bundle — never put a real secret in one. Everything else above is server-only.

## 8. Public vs. server-only variables

Any variable prefixed `NEXT_PUBLIC_` is compiled directly into the browser bundle and is visible to
every site visitor — never put a real secret in one. Everything else in the §7 table (the two
Sanity tokens and the two Billetto credentials) is server-only: read only in server components,
route handlers, or the local `scripts/` tooling, and never sent to the browser. See the "Public /
Server-only" column in §7 for the exact classification of each variable.

## 9. Sanity setup

- **No staging dataset exists.** The `production` dataset is the live dataset — Sanity Studio (`/studio`), even when run from `localhost`, talks to real live content. There is no safety net besides the read-only vs. write-capable tokens.
- Transfer the Sanity project to the client's own Sanity account/organization, and **issue fresh API tokens** for them rather than continuing to use the developer's personal tokens. (One of the developer's tokens may have been printed to a local terminal at some point during development via a Claude Code tool-permission entry — see §16's `.claude/settings.json` item — reinforcing that it should be rotated, not reused, regardless.)
- **CORS**: Sanity's project-level CORS origin allowlist (sanity.io/manage → project → API → CORS Origins) is dashboard-only, not repo-configurable. Add the client's production domain (and any Netlify preview domains) there once the domain changes or the project transfers.
- Regenerate types after any schema change: `npm run sanity:typegen`.

## 10. Netlify setup

- Build command: `npm run build`.
- No `netlify.toml` exists — this is intentional; build settings, the production branch, and all environment variables must be configured in Netlify's dashboard UI, not in the repo.
- Set every "Yes" variable from the table in §7 in Netlify's site settings before deploying — a missing `NEXT_PUBLIC_SITE_URL` will fail the build on purpose.
- Transfer the Netlify site (or the domain/DNS) to the client's own account as part of handoff.

## 11. Formspree setup

- The client should own the Formspree account/form.
- `.env.example`'s `FORMSPREE_RECIPIENT_EMAIL` currently documents the intended recipient (`rorum2025@gmail.com`) — this is informational only (see §7); the actual recipient must be configured on the Formspree form itself in the Formspree dashboard.
- `NEXT_PUBLIC_FORMSPREE_ENDPOINT` in `.env.example` is a placeholder — replace it with the client's real form endpoint and set it in Netlify.

## 12. Billetto setup

- Confirm whether the Billetto credentials currently in use belong to the client's own account; if not, obtain fresh `BILLETTO_API_KEY_ID` / `BILLETTO_ACCESS_KEY_SECRET` under the client's ownership.
- These are server-only and never exposed to the browser (`lib/billetto.ts` is marked `server-only`). The feature degrades gracefully (ticket link still shown, live availability figures hidden) if these are unset — not launch-blocking, but a correctness gap for live ticket counts.

## 13. Site URL / domain configuration

`NEXT_PUBLIC_SITE_URL` is the **only** place the public origin is configured — there is no hardcoded domain fallback anywhere in the code. Changing domains (e.g. moving from a Netlify preview URL to the final custom domain) only requires updating this one variable and redeploying. Remember to also update Sanity's CORS allowlist (§9) when the domain changes.

## 14. Sanity type generation

```
npm run sanity:typegen
```

Run this after any schema change in `sanity/schemaTypes/` — it regenerates `sanity.types.ts`, which the app depends on at build time.

## 15. Key maintenance / test commands

```
npm run dev                    # local dev server
npm run build                  # production build
npm run start                  # run a built production server
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test:unit              # Vitest
npm run test:e2e               # Playwright (interactions, breakpoints, sanity, locale)
npm run sanity:typegen         # regenerate sanity.types.ts after a schema change
npm run sanity:audit-events    # read-only Sanity content audit
npm run sanity:backup-events   # read-only local JSON backup of Event docs (scripts/backups/, gitignored)
```

`scripts/` also contains ~90 other one-off content-migration/backfill/repair scripts used during development (most have a `:dry-run` variant that's safe/read-only by default). These are historical tooling, not part of the app's runtime — the migrations they performed have already been applied and don't need to run again. They're kept intentionally as disaster-recovery reference (how a specific past content fix was done) rather than deleted, per this project's own "don't destructively remove migration tooling" convention.

`migrations/internationalized-array-v5.ts` is a separate, official Sanity CLI migration (`npx sanity migrations run internationalized-array-v5`, dry-run by default) for a past plugin upgrade; safe to re-run (idempotent), kept for any content that predates that migration.

## 16. Ownership-transfer checklist

- [ ] Transfer GitHub repository ownership (or add the client as owner/admin).
- [ ] Confirm and consolidate the production branch (§6); remove or archive stale branches once confirmed unused.
- [ ] Transfer Sanity project ownership; issue the client fresh `SANITY_API_READ_TOKEN` / `SANITY_API_WRITE_TOKEN` (do not hand over the developer's personal tokens — see §9).
- [ ] Update Sanity's CORS origin allowlist for the client's domain(s).
- [ ] Transfer Netlify site ownership and confirm all environment variables from §7 are set there.
- [ ] Set up the client's own Formspree form/account and endpoint (§11).
- [ ] Confirm Billetto credential ownership (§12).
- [ ] Confirm domain/DNS ownership and Netlify's configured production branch.
- [ ] Review the "Known content gaps" in §18 and decide who resolves each before or after go-live.
- [ ] **Remove or heavily trim `.claude/settings.json` before transfer.** It's tracked in git and contains, among many developer-machine-specific one-off entries (hardcoded process IDs, a personal absolute file path, permissions for git-mutating commands like `stash`/`checkout`/`add`/`rm` that contradict this project's own `CLAUDE.md` rules): a standing, no-prompt-required permission entry that runs a command printing the raw `SANITY_API_WRITE_TOKEN` to stdout, plus two blanket `node -e` wildcards that would let any future agent session read `.env.local` (and thus that token) unprompted. It has no effect on the running app, but shipping it as-is hands the new owner's first AI-assisted session a pre-authorized way to leak write access to their own live content dataset. Rotating the token (§9) does not remove this standing authorization for whatever token replaces it.

## 17. Post-transfer smoke-test checklist

Run through this once the site is live on the client's own Netlify/Sanity/Formspree/Billetto accounts:

- [ ] `npm install && npm run dev` succeeds from a clean clone.
- [ ] `npm run build` succeeds using the client's real environment variables.
- [ ] Home page and navigation load in all three locales (`/`, `/da`, `/uk`).
- [ ] An Event detail page renders correctly, including its social-share metadata (check the rendered `<head>`'s `og:title`/`og:image`) and, if configured, live Billetto ticket availability.
- [ ] The contact form submits successfully and an email arrives at the client's configured Formspree recipient.
- [ ] Sanity Studio (`/studio`) loads and an editor can log in with a client-owned account.
- [ ] A test edit in Studio (e.g. changing a text field) publishes and appears on the live site.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the real production domain in the rendered canonical/`og:url` tags.

## 18. Known intentional limitations & content gaps

**Architectural / infrastructure:**
- No staging Sanity dataset — all CMS testing happens against live production content; be deliberate about any manual content edits.
- The production domain is deployment-config-driven (§13), not hardcoded.
- No `.github/` CI workflows and no `netlify.toml` exist — deliberate; build/deploy config lives entirely in Netlify's dashboard.
- `MIGRATION_REPORT.md`, a large historical development diary, was intentionally removed from this repo during handoff cleanup. It's still referenced by name throughout the codebase — not just in `SANITY_MIGRATION.md`/`ARCHITECTURE.md`, but in roughly 70 source-file comments (`.ts`/`.tsx`/`.css`) that point a reader at "see MIGRATION_REPORT.md" for more context, including one runtime error message in `sanity/env.ts`. None of these are functional bugs — the file simply won't be there when someone follows the pointer — but expect to see the name come up while reading code. It's recoverable from git history (`git log`, or `git show origin/main:MIGRATION_REPORT.md`) on branches that predate the cleanup, if ever needed — it does not need to be recreated. (It's also listed in `.gitignore`, so restoring a copy locally for reference will not accidentally get it re-tracked.)
- The repository's `.git` history and tracked assets are large (several hundred MB, mostly tracked images under `public/images/`), making clones slower than ideal. Reducing this would require a destructive git-history rewrite and was intentionally left untouched during handoff cleanup — a decision for the new owner/developer if it becomes a problem.

**Known content gaps in the live Sanity dataset** (not code defects — flagging so they aren't mistaken for bugs):
- A stray, unused `linkedin` entry remains in the live `socialLinks` document. The frontend never renders it, but it does cause a validation warning in Studio on that document — safe to simply delete the entry in Studio.
- A number of approved SEO copy drafts sit unpublished in the production dataset; affected pages currently fall back to their default English SEO text until an editor publishes them.
- Some legal-page section labels (e.g. "Company details") are hardcoded in English and not yet localized for `/da`/`/uk` — needs an owner decision on how to localize.
