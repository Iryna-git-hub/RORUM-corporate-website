# RORUM Website — Handoff Notes

Practical notes for taking over ownership and maintenance of this project.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Sanity CMS (Studio embedded in the app at `/studio`)
- Playwright (e2e/visual tests) + Vitest (unit tests)
- Hosted on Netlify

## Install & run locally

```
npm install
npm run dev        # http://localhost:3000 (also serves Sanity Studio at /studio)
```

Requires a `.env.local` file — copy `.env.example` and fill in real values (see
"Environment variables" below). Never commit `.env.local`.

## Build

```
npm run build
```

Production build intentionally uses webpack (`next build --webpack`), not
Turbopack. `npm run dev` also runs on Turbopack normally; if you ever see a
one-off `ENOENT ... build-manifest.json` error in local dev on an Event
detail page, it's a known, rare, self-healing Next.js dev-mode artifact —
retry, or clear `.next` and restart. It does not affect production builds.

## Environment variables (names only — set real values in Netlify + your local `.env.local`)

- `NEXT_PUBLIC_SITE_URL` — the site's public origin (e.g. `https://ro-rum.dk`). **Required**; the app fails to build/start loudly if this is missing or invalid, by design — it must never silently fall back to the wrong domain.
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET` (currently `production`)
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN`
- `SANITY_API_READ_TOKEN` — server-only, Viewer role
- `SANITY_API_WRITE_TOKEN` — server-only, Editor role, needed for the maintenance scripts under `scripts/` and for enabling draft preview
- `NEXT_PUBLIC_FORMSPREE_ENDPOINT`
- `FORMSPREE_RECIPIENT_EMAIL` — update this to the client's real inbox before go-live; the current `.env.example` default is the developer's own address as a placeholder, not a live value.

## Sanity

- **No staging dataset exists.** The `production` dataset is the live dataset — Sanity Studio (`/studio`), even when run from `localhost`, talks to real live content. There is no safety net besides the read-only `SANITY_API_READ_TOKEN` vs. the write-capable `SANITY_API_WRITE_TOKEN`.
- Project ownership: transfer the Sanity project to the client's own Sanity account/organization, and issue fresh API tokens for them rather than continuing to use the developer's personal tokens.
- Regenerate types after any schema change: `npm run sanity:typegen`.

## Netlify / deployment

- Build command: `npm run build`.
- Set every environment variable above in Netlify's site settings before deploying — a missing `NEXT_PUBLIC_SITE_URL` will fail the build on purpose.
- This repo currently has several branches (`main`, `migration`, `cleanup`, plus a few older feature branches). **Confirm which branch Netlify is actually configured to deploy from before handoff** — historically `main` had drifted behind active development; verify this is resolved and Netlify points at the intended production branch.
- Transfer the Netlify site (or the domain/DNS) to the client's own account as part of handoff.

## External services

- **Sanity** — CMS/content.
- **Billetto** — event ticketing integration (`lib/billetto*`); server-side credentials only, never exposed client-side.
- **Formspree** — contact/inquiry form submissions.
- **Netlify** — hosting/build/deploy.

## Key maintenance commands

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

`scripts/` also contains a number of one-off content-migration scripts used during development (each has a `:dry-run` variant that's safe/read-only by default). These are historical tooling, not part of the app's runtime — most have already been applied and don't need to be run again; keep them for reference on how past content migrations were done.

## Known intentional limitations

- No staging Sanity dataset — all CMS testing happens against live production content; be deliberate about any manual content edits.
- The production domain (`NEXT_PUBLIC_SITE_URL`) is deployment-config-driven, not hardcoded — changing domains only requires updating this one variable and redeploying.
- `migrations/internationalized-array-v5.ts` is an official Sanity CLI migration (`npx sanity migrations run internationalized-array-v5`) for a past plugin upgrade; safe to re-run (idempotent), kept for any content that predates that migration.

## Ownership-transfer checklist

- [ ] Transfer GitHub repository ownership (or add the client as owner/admin).
- [ ] Confirm and consolidate the production branch; remove or archive stale branches once confirmed unused.
- [ ] Transfer Sanity project ownership; issue the client fresh `SANITY_API_READ_TOKEN` / `SANITY_API_WRITE_TOKEN` (do not hand over the developer's personal tokens).
- [ ] Transfer Netlify site ownership and confirm all environment variables are set there.
- [ ] Update `FORMSPREE_RECIPIENT_EMAIL` to the client's real inbox.
- [ ] Confirm domain/DNS ownership and Netlify's configured production branch.
- [ ] Confirm the client (or their new developer) can run `npm install && npm run dev` and `npm run build` successfully from a clean clone.
