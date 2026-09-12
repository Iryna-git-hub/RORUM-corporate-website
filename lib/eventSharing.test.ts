import { describe, expect, it } from "vitest";
import type { RorumEvent } from "@/lib/data";
import { buildEventShareLinks, buildNativeSharePayload, resolveEventShareData } from "./eventSharing";

function event(overrides: Partial<RorumEvent> = {}): RorumEvent {
  return {
    slug: "community-reset-night",
    title: "Community Reset Night",
    longDescription: "A calm evening for the community.",
    image: "https://cdn.sanity.io/event-banner.jpg",
    imageAlt: "People gathering at RORUM",
    ...overrides,
  } as RorumEvent;
}

describe("resolveEventShareData", () => {
  it.each([
    ["en", "https://ro-rum.dk/events/community-reset-night"],
    ["da", "https://ro-rum.dk/da/events/community-reset-night"],
    ["uk", "https://ro-rum.dk/uk/events/community-reset-night"],
  ] as const)("builds the canonical public %s event URL", (locale, expectedUrl) => {
    expect(resolveEventShareData(event(), locale).url).toBe(expectedUrl);
  });

  it("uses localized event content and the explicit SEO image for metadata and sharing", () => {
    const resolved = resolveEventShareData(
      event({
        title: "Fællesskabsaften",
        longDescription: "Lang beskrivelse.",
        seo: {
          title: "Fællesskabsaften | RORUM",
          description: "Kort dansk beskrivelse.",
          ogImageUrl: "https://cdn.sanity.io/social-1200x630.jpg",
          ogImageAlt: "Fællesskab i RORUM",
        },
      }),
      "da",
    );

    expect(resolved).toMatchObject({
      locale: "da",
      title: "Fællesskabsaften",
      metadataTitle: "Fællesskabsaften | RORUM",
      description: "Kort dansk beskrivelse.",
      text: "Kort dansk beskrivelse.",
      image: "https://cdn.sanity.io/social-1200x630.jpg",
      imageAlt: "Fællesskab i RORUM",
    });
  });

  it("falls back from SEO image to the crawler-sized event banner, then the regular event image", () => {
    expect(resolveEventShareData(event({ socialImageUrl: "https://cdn.sanity.io/banner-1200x630.jpg" }), "en").image)
      .toBe("https://cdn.sanity.io/banner-1200x630.jpg");
    expect(resolveEventShareData(event(), "en").image).toBe("https://cdn.sanity.io/event-banner.jpg");
  });

  it("does not let the generic UI placeholder override the site-wide social fallback", () => {
    expect(resolveEventShareData(event({ image: "/images/hero.jpg", socialImageUrl: undefined }), "en").image)
      .toBeUndefined();
  });

  it("uses localized fallback share text only when the event has no description", () => {
    expect(resolveEventShareData(event({ longDescription: "", seo: undefined }), "uk", "Локалізований текст").text)
      .toBe("Локалізований текст");
  });
});

describe("event share payload builders", () => {
  const data = {
    title: "Fællesskab & ro",
    text: "Kom med til aftenen.",
    url: "https://ro-rum.dk/da/events/faellesskab?ref=a&b=c",
  };

  it("passes only the encoded canonical URL to Facebook and LinkedIn", () => {
    const links = buildEventShareLinks(data);
    const encodedUrl = encodeURIComponent(data.url);
    expect(links.facebook).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    expect(links.linkedin).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
  });

  it("prefills WhatsApp with the localized title and URL", () => {
    const links = buildEventShareLinks(data);
    expect(decodeURIComponent(new URL(links.whatsapp).searchParams.get("text")!)).toBe(`${data.title}\n${data.url}`);
  });

  it("prefills email subject and body with localized copy, title and URL", () => {
    const links = buildEventShareLinks(data);
    const query = new URL(links.email.replace("mailto:", "https://mail.invalid/")).searchParams;
    expect(query.get("subject")).toBe(data.title);
    expect(query.get("body")).toBe(`${data.text}\n\n${data.title}\n\n${data.url}`);
  });

  it("builds the native Web Share payload without files", () => {
    expect(buildNativeSharePayload(data)).toEqual(data);
  });
});
