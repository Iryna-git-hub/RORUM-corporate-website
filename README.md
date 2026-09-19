# RORUM Website

Corporate website for RORUM — a Next.js app with a Sanity-powered CMS,
supporting English, Danish, and Ukrainian.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Sanity CMS
(Studio embedded at `/studio`) · Playwright + Vitest

## Quick setup

```
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

## Core commands

```
npm run build          # production build
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run test:unit       # Vitest
npm run test:e2e        # Playwright
npm run sanity:typegen  # regenerate sanity.types.ts after a schema change
```

## Deployment, environment variables, ownership & maintenance

See **[HANDOFF.md](./HANDOFF.md)** for environment variable names, Sanity/Netlify/Formspree/Billetto
setup, the ownership-transfer checklist, and known limitations.
