import { describe, expect, it } from "vitest";
import { eventJsonLd, organizationJsonLd, websiteJsonLd } from "./structuredData";
import { resolveEventShareData } from "./eventSharing";
import type { RorumEvent } from "./data";

describe("organizationJsonLd / websiteJsonLd — no fabricated fields", () => {
  it("Organization has exactly name/url/logo, nothing invented", () => {
    const result = organizationJsonLd({ siteUrl: "https://ro-rum.dk", name: "RORUM", logoUrl: "https://ro-rum.dk/logo.png" });
    expect(result).toEqual({ "@context": "https://schema.org", "@type": "Organization", name: "RORUM", url: "https://ro-rum.dk", logo: "https://ro-rum.dk/logo.png" });
  });

  it("WebSite has exactly name/url", () => {
    const result = websiteJsonLd({ siteUrl: "https://ro-rum.dk", name: "RORUM" });
    expect(result).toEqual({ "@context": "https://schema.org", "@type": "WebSite", name: "RORUM", url: "https://ro-rum.dk" });
  });
});

describe("eventJsonLd — startDate/endDate parsing (never a guessed time)", () => {
  it("a clean 'HH:MM-HH:MM' range produces both startDate and endDate", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:30-21:30",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.startDate).toBe("2026-09-10T18:30:00");
    expect(result.endDate).toBe("2026-09-10T21:30:00");
  });

  it("a single 'HH:MM' start time (no range) produces startDate only, no fabricated endDate", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:30",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.startDate).toBe("2026-09-10T18:30:00");
    expect(result).not.toHaveProperty("endDate");
  });

  it("an unparseable time string (e.g. 'TBA') falls back to the bare date, never a guessed time", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "TBA",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.startDate).toBe("2026-09-10");
    expect(result).not.toHaveProperty("endDate");
  });
});

describe("eventJsonLd — only proven fields, nothing invented (Section 15)", () => {
  it("no ticketUrl: no offers block at all (never a fabricated price/availability)", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result).not.toHaveProperty("offers");
  });

  it("a real ticketUrl produces an offers block whose availability reflects the real isSoldOut flag, never a fabricated price", () => {
    const soldOut = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: true,
      ticketUrl: "https://billetto.dk/x",
      organizerName: "RORUM",
    });
    expect(soldOut.offers).toEqual({ "@type": "Offer", url: "https://billetto.dk/x", availability: "https://schema.org/SoldOut" });
    expect(soldOut.offers).not.toHaveProperty("price");

    const available = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: false,
      ticketUrl: "https://billetto.dk/x",
      organizerName: "RORUM",
    });
    expect(available.offers).toEqual({ "@type": "Offer", url: "https://billetto.dk/x", availability: "https://schema.org/InStock" });
  });

  it("location uses the event's own real address, never a fabricated one", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Buermistersgade 26, Copenhagen",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.location).toEqual({ "@type": "Place", name: "RORUM", address: "Buermistersgade 26, Copenhagen" });
  });

  it("eventAttendanceMode is always Offline — this project has no online-event concept to draw a different value from", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
  });

  it("no description supplied: the field is simply absent, never a fabricated summary", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result).not.toHaveProperty("description");
  });

  it("no image supplied: the field is simply absent", () => {
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: "https://ro-rum.dk/events/x",
      name: "Workshop",
      date: "2026-09-10",
      time: "18:00",
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result).not.toHaveProperty("image");
  });
});

// Regression coverage for the fixed divergence: the event detail page's
// JSON-LD call site used to independently re-derive `description` (from
// `event.longDescription`, skipping `event.seo?.description`) and `image`
// (a locally-computed value with no `seo.ogImageUrl`/`socialImageUrl`
// priority and no exclusion of the generic `/images/hero.jpg` placeholder)
// instead of reusing the same `resolveEventShareData()` result the page's
// own OG/Twitter metadata and EventShare buttons are built from. These
// tests mirror the page's actual call shape — `eventJsonLd({ ...,
// name: shareData.title, description: shareData.description || undefined,
// image: shareData.image })` — to prove the SEO-prioritized fields reach
// JSON-LD, not the raw/independently-derived ones.
describe("eventJsonLd — consumes resolveEventShareData(), not independently-derived fields", () => {
  function rorumEvent(overrides: Partial<RorumEvent> = {}): RorumEvent {
    return {
      slug: "community-reset-night",
      title: "Community Reset Night",
      longDescription: "The long internal description, not meant for search results.",
      image: "https://cdn.sanity.io/images/event-banner-full-res.jpg",
      ...overrides,
    } as RorumEvent;
  }

  it("prefers event.seo.description over event.longDescription in the rendered JSON-LD description", () => {
    const event = rorumEvent({
      seo: { description: "The concise SEO description." },
    });
    const shareData = resolveEventShareData(event, "en");
    expect(shareData.description).toBe("The concise SEO description.");

    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: shareData.url,
      name: shareData.title,
      description: shareData.description || undefined,
      date: "2026-09-10",
      time: "18:00",
      image: shareData.image,
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.description).toBe("The concise SEO description.");
    expect(result.description).not.toBe(event.longDescription);
  });

  it("prefers event.seo.ogImageUrl over the raw event.image in the rendered JSON-LD image", () => {
    const event = rorumEvent({
      seo: { ogImageUrl: "https://cdn.sanity.io/images/event-social-1200x630.jpg" },
    });
    const shareData = resolveEventShareData(event, "en");
    expect(shareData.image).toBe("https://cdn.sanity.io/images/event-social-1200x630.jpg");

    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: shareData.url,
      name: shareData.title,
      description: shareData.description || undefined,
      date: "2026-09-10",
      time: "18:00",
      image: shareData.image,
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.image).toBe("https://cdn.sanity.io/images/event-social-1200x630.jpg");
    expect(result.image).not.toBe(event.image);
  });

  it("excludes the generic /images/hero.jpg UI placeholder from the JSON-LD image, same as OG/Twitter", () => {
    const event = rorumEvent({ image: "/images/hero.jpg", seo: undefined, socialImageUrl: undefined });
    const shareData = resolveEventShareData(event, "en");
    expect(shareData.image).toBeUndefined();

    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: shareData.url,
      name: shareData.title,
      description: shareData.description || undefined,
      date: "2026-09-10",
      time: "18:00",
      image: shareData.image,
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result).not.toHaveProperty("image");
  });

  it("name always matches the resolver's own title", () => {
    const event = rorumEvent({ title: "Fællesskabets resetaften" });
    const shareData = resolveEventShareData(event, "da");
    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: shareData.url,
      name: shareData.title,
      description: shareData.description || undefined,
      date: "2026-09-10",
      time: "18:00",
      image: shareData.image,
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.name).toBe("Fællesskabets resetaften");
  });

  // Regression coverage for the fixed defect: `eventJsonLd`'s `url` used to
  // be built from a bare, un-localized `/events/<slug>` path, so it never
  // carried the `/da/` or `/uk/` prefix that `og:url`/canonical already had
  // for those locales. `url` is now the resolver's own `shareData.url`
  // passed straight through, so it is locale-correct by construction — this
  // asserts that for all three supported locales.
  it.each([
    ["en", "https://ro-rum.dk/events/community-reset-night"],
    ["da", "https://ro-rum.dk/da/events/community-reset-night"],
    ["uk", "https://ro-rum.dk/uk/events/community-reset-night"],
  ] as const)("%s: JSON-LD url matches the resolver's own locale-prefixed shareData.url", (locale, expectedUrl) => {
    const event = rorumEvent();
    const shareData = resolveEventShareData(event, locale);
    expect(shareData.url).toBe(expectedUrl);

    const result = eventJsonLd({
      siteUrl: "https://ro-rum.dk",
      url: shareData.url,
      name: shareData.title,
      description: shareData.description || undefined,
      date: "2026-09-10",
      time: "18:00",
      image: shareData.image,
      address: "Some Street 1",
      isSoldOut: false,
      organizerName: "RORUM",
    });
    expect(result.url).toBe(expectedUrl);
  });
});
