import { describe, expect, it } from "vitest";
import { eventJsonLd, organizationJsonLd, websiteJsonLd } from "./structuredData";

describe("organizationJsonLd / websiteJsonLd — no fabricated fields", () => {
  it("Organization has exactly name/url/logo, nothing invented", () => {
    const result = organizationJsonLd({ siteUrl: "https://rorum.dk", name: "RORUM", logoUrl: "https://rorum.dk/logo.png" });
    expect(result).toEqual({ "@context": "https://schema.org", "@type": "Organization", name: "RORUM", url: "https://rorum.dk", logo: "https://rorum.dk/logo.png" });
  });

  it("WebSite has exactly name/url", () => {
    const result = websiteJsonLd({ siteUrl: "https://rorum.dk", name: "RORUM" });
    expect(result).toEqual({ "@context": "https://schema.org", "@type": "WebSite", name: "RORUM", url: "https://rorum.dk" });
  });
});

describe("eventJsonLd — startDate/endDate parsing (never a guessed time)", () => {
  it("a clean 'HH:MM-HH:MM' range produces both startDate and endDate", () => {
    const result = eventJsonLd({
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
      siteUrl: "https://rorum.dk",
      path: "/events/x",
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
