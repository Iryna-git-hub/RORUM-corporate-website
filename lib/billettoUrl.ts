// Pure helpers for the manager-facing "Billetto event link" field — no
// network, no credentials, no `server-only`, so this can be imported from
// the Sanity schema's validation callback, from `lib/billetto.ts`, and from
// tests alike.
//
// The manager pastes a Billetto event page URL. Billetto's canonical share
// URL format is:
//
//   https://billetto.dk/e/<any-slug-text>-billetter-<numericId>
//   https://billetto.<tld>/e/<any-slug-text>-billetter-<numericId>?utm_source=…
//
// and the API/`public_url` also uses the bare form without the "billetter-"
// segment:
//
//   https://billetto.dk/e/<slug>-<numericId>
//
// We accept either, strip any query string / fragment / trailing slash, and
// pull out the trailing numeric id. The numeric id is what
// `GET /api/v3/organiser/events/{eventId}` needs — it is NEVER stored as a
// separate manager field, always derived here.

// Known second-level labels that sit under a country-code TLD (billetto.co.uk).
const CCTLD_SECOND_LEVEL = new Set(["co", "com", "org", "net", "ac", "gov"]);

/**
 * True only when `billetto` is the REGISTRABLE domain — `billetto.dk`,
 * `www.billetto.dk`, `billetto.co.uk`, `shop.billetto.com`. Rejects
 * look-alikes where `billetto` is merely a subdomain of someone else's
 * domain (`billetto.evil.com`, `billetto.dk.attacker.io`).
 */
function isBillettoHost(hostname: string): boolean {
  const labels = hostname.toLowerCase().split(".");
  if (labels.length < 2) return false;
  // billetto.<tld>
  if (labels[labels.length - 2] === "billetto") return true;
  // billetto.<sld>.<cctld>   e.g. billetto.co.uk
  if (
    labels.length >= 3 &&
    labels[labels.length - 3] === "billetto" &&
    CCTLD_SECOND_LEVEL.has(labels[labels.length - 2]!)
  ) {
    return true;
  }
  return false;
}

/** The trailing numeric id in a Billetto event URL, or `null` if the string isn't one. */
export function parseBillettoEventId(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname: string;
  try {
    const parsed = new URL(trimmed.includes("//") ? trimmed : `https://${trimmed}`);
    if (!isBillettoHost(parsed.hostname)) return null;
    pathname = parsed.pathname;
  } catch {
    return null;
  }

  // /e/<slug>-billetter-<id>  OR  /e/<slug>-<id>  (id = 1+ digits, at the end).
  // Path lower-cased so an all-caps paste still resolves.
  const match = pathname.toLowerCase().replace(/\/+$/, "").match(/\/e\/[^/]*?-(\d+)$/);
  return match ? match[1]! : null;
}

/** True when the string is a Billetto event URL we can extract an id from. Empty/blank is NOT valid (use "is this field filled?" separately). */
export function isBillettoEventUrl(url: string | null | undefined): boolean {
  return parseBillettoEventId(url) !== null;
}
