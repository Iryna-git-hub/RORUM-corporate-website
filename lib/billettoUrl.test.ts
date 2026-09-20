import { describe, expect, it } from "vitest";
import { isBillettoEventUrl, parseBillettoEventId } from "@/lib/billettoUrl";

describe("parseBillettoEventId — Billetto event URL → numeric id", () => {
  it("extracts the id from the canonical `-billetter-<id>` share URL", () => {
    expect(parseBillettoEventId("https://billetto.dk/e/rorum-integration-test-billetter-1994849")).toBe("1994849");
  });

  it("ignores a UTM/query string", () => {
    expect(
      parseBillettoEventId(
        "https://billetto.dk/e/rorum-integration-test-billetter-1994849?utm_source=organiser&utm_medium=share",
      ),
    ).toBe("1994849");
  });

  it("ignores a trailing slash and a #fragment", () => {
    expect(parseBillettoEventId("https://billetto.dk/e/my-event-billetter-42/")).toBe("42");
    expect(parseBillettoEventId("https://billetto.dk/e/my-event-billetter-42#tickets")).toBe("42");
  });

  it("accepts the bare `<slug>-<id>` form (Billetto `public_url`)", () => {
    expect(parseBillettoEventId("https://billetto.dk/e/some-event-slug-1234567")).toBe("1234567");
  });

  it("accepts other Billetto TLDs and subdomains where `billetto` is the registrable domain", () => {
    expect(parseBillettoEventId("https://billetto.com/e/an-event-billetter-99")).toBe("99");
    expect(parseBillettoEventId("https://www.billetto.co.uk/e/an-event-billetter-7")).toBe("7");
    expect(parseBillettoEventId("https://shop.billetto.com/e/an-event-billetter-8")).toBe("8");
  });

  it("accepts a scheme-less paste and an all-caps paste", () => {
    expect(parseBillettoEventId("billetto.dk/e/my-event-billetter-500")).toBe("500");
    expect(parseBillettoEventId("HTTPS://BILLETTO.DK/E/MY-EVENT-BILLETTER-501")).toBe("501");
  });

  it("returns null for non-Billetto hosts and look-alikes where `billetto` is only a subdomain", () => {
    expect(parseBillettoEventId("https://eventbrite.com/e/my-event-billetter-1994849")).toBeNull();
    expect(parseBillettoEventId("https://billetto.dk.evil.com/e/x-billetter-1")).toBeNull();
    expect(parseBillettoEventId("https://billetto.evil.com/e/x-billetter-1")).toBeNull();
    expect(parseBillettoEventId("https://billetto.attacker.io/e/x-billetter-1")).toBeNull();
    expect(parseBillettoEventId("https://notbilletto.dk/e/x-billetter-1")).toBeNull();
    expect(parseBillettoEventId("https://mybilletto.dk/e/x-billetter-1")).toBeNull();
  });

  it("returns null when there is no trailing numeric id", () => {
    expect(parseBillettoEventId("https://billetto.dk/e/my-event")).toBeNull();
    expect(parseBillettoEventId("https://billetto.dk/")).toBeNull();
    expect(parseBillettoEventId("https://billetto.dk/organiser/dashboard")).toBeNull();
  });

  it("returns null for empty / non-string input", () => {
    expect(parseBillettoEventId("")).toBeNull();
    expect(parseBillettoEventId("   ")).toBeNull();
    expect(parseBillettoEventId(null)).toBeNull();
    expect(parseBillettoEventId(undefined)).toBeNull();
    expect(parseBillettoEventId("not a url at all")).toBeNull();
  });

  it("isBillettoEventUrl mirrors parseBillettoEventId", () => {
    expect(isBillettoEventUrl("https://billetto.dk/e/x-billetter-1")).toBe(true);
    expect(isBillettoEventUrl("https://billetto.dk/")).toBe(false);
    expect(isBillettoEventUrl("")).toBe(false);
  });
});
