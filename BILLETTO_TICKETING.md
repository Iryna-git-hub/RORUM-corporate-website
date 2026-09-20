# Billetto ticketing — automatic availability

Ticket availability on the RORUM website (Home "Upcoming events", the Events
listing, and each event page) is read **live from Billetto**. Nobody keeps
two systems in sync by hand.

---

## For the business manager — how to create a new event

1. **Create and publish the event in Billetto.**
2. **Set the ticket quantity in Billetto.**
3. **Copy the event's Billetto page URL** — e.g.
   `https://billetto.dk/e/my-event-billetter-1234567`
   (the "Share" / "Copy link" button gives you this).
4. **Create the event in Sanity Studio** (Events → +).
5. **Paste the Billetto URL into the "Billetto event link" field.**
   A green note confirms availability is now automatic.
6. **Fill in the content** — title, image, description, "What to expect",
   date, time, price — in English, Danish and Ukrainian.
7. **Publish.**

That's it. The website now shows the current number of tickets left, in the
visitor's language ("6 spots left" / "6 pladser tilbage" / "6 місць
залишилось"). When you change the quantity in Billetto, the website updates
by itself within a few minutes.

### You do **not** need to

- enter "Tickets left" or toggle "Sold out" — those fields are hidden for a
  Billetto-connected event.
- type the Billetto event number (`1234567`) anywhere — it's read from the
  URL.
- set a separate "Buy ticket" link — the Billetto link is used.
- touch API keys, `.env`, or the hosting settings — ever.

### The "Buy ticket" button wording

New events start with **"Buy Ticket" / "Køb billet" / "Купити квиток"**
already filled in. You can change it per event if you want.

### Editing an existing (older) event that isn't on Billetto yet

Just paste its Billetto link into "Billetto event link" and re-publish. Its
old "Tickets left" / "Sold out" values are ignored from then on.

### If Billetto is briefly unreachable

The website keeps showing the **Buy ticket** button but simply hides the
"spots left" line until Billetto responds again. It never shows a wrong
"Sold out" or "0 spots left".

---

## For the developer — production setup (one time)

Two **server-only** environment variables, set once in the hosting
environment (Netlify → Site settings → Environment variables), never
`NEXT_PUBLIC_*`, never per event:

```
BILLETTO_API_KEY_ID=<the API key id from the Billetto API Key Pair>
BILLETTO_ACCESS_KEY_SECRET=<the access key secret>
```

- The manager never sees or edits these.
- Locally, put the same two lines in `.env.local` (already git-ignored).
- If they are missing, the site still builds and runs — Billetto-connected
  events fall back to their manual Sanity availability, and a one-line
  developer warning is logged (names only, never values).

### How it works

| Piece | File |
|---|---|
| URL → numeric id (pure) | `lib/billettoUrl.ts` |
| Server-only API client, all failure modes normalised | `lib/billetto.ts` |
| One resolver for every surface; batched + deduped by event id; no false sold-out on failure | `lib/eventAvailability.ts` |
| Studio field + hidden manual fields + notice | `sanity/schemaTypes/documents/event.ts`, `sanity/components/BillettoTicketNotice.tsx` |

- Endpoint: `GET https://billetto.dk/api/v3/organiser/events/{id}`, header
  `Api-Keypair: <id>:<secret>` (built server-side).
- Cached via Next's fetch cache, `revalidate: 90s` (inside Billetto's
  recommended 60–120s), tag `billetto-event-<id>`. Many event cards for the
  same event → one request. 5s timeout, **no retries**, backs off on `429`.
- The number comes from `availability.available`; sold-out is
  `available === 0`. `availability.status` ("high"/"low") is informational
  only.

### Live check

With the site running locally and `.env.local` populated:

```
npm run billetto:verify-live
```

prints the Billetto API number next to what each locale of the site shows,
with a timestamp.

### Test event

`event-ddc618d18d7c` (slug `floral-mood-workshop`) is connected to Billetto
integration test event **1994849**. `npm run sanity:connect-test-event-billetto`
is the (backed-up, revision-guarded) script that connected it.
