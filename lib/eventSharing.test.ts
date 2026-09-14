import { describe, expect, it } from "vitest";
import type { RorumEvent } from "@/lib/data";
import { buildEventShareLinks, buildNativeSharePayload, resolveEventShareData } from "./eventSharing";
import { plainTextToPortableText } from "./portableText";

function event(overrides: Partial<RorumEvent> = {}): RorumEvent {
  return {
    slug: "community-reset-night",
    title: "Community Reset Night",
    formattedDescription: plainTextToPortableText("A calm evening for the community."),
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
        formattedDescription: plainTextToPortableText("Lang beskrivelse."),
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

  // Regression: sanityEventToRorumEvent() (lib/sanityEvents.ts) falls back to
  // the static seed data's `image` (lib/data.ts) for any event with no
  // Sanity image asset of its own — and that seed data stores RELATIVE paths
  // like "/images/events/banners/community-reset-night.png", not full URLs.
  // JSON-LD's `Event.image` (lib/structuredData.ts, fed from
  // `shareData.image`) has no base URL to resolve a relative path against,
  // so this must always come out absolute.
  it("absolutizes a relative fallback event image (e.g. the static-seed banner path)", () => {
    expect(
      resolveEventShareData(
        event({ image: "/images/events/banners/community-reset-night.png", socialImageUrl: undefined }),
        "en",
      ).image,
    ).toBe("https://ro-rum.dk/images/events/banners/community-reset-night.png");
  });

  it("leaves an already-absolute Sanity CDN image untouched", () => {
    expect(resolveEventShareData(event({ socialImageUrl: "https://cdn.sanity.io/banner-1200x630.jpg" }), "en").image)
      .toBe("https://cdn.sanity.io/banner-1200x630.jpg");
  });

  // Regression: `detailHeroImage` (the decorative Event Detail background,
  // lib/data.ts's "TWO INDEPENDENT IMAGE CONCERNS") must have zero effect on
  // OG/Twitter/JSON-LD sharing — that chain stays exclusively
  // seo.ogImageUrl -> socialImageUrl -> image, never reading
  // `detailHeroImage` at all. Setting it to a completely different URL than
  // every existing image field must not change the resolved share image.
  it("is completely unaffected by detailHeroImage — sharing stays driven only by seo.ogImageUrl/socialImageUrl/image", () => {
    const distinctDetailHeroImage = "https://cdn.sanity.io/detail-hero-only-for-the-page-background.jpg";

    expect(resolveEventShareData(event({ detailHeroImage: distinctDetailHeroImage }), "en").image)
      .toBe("https://cdn.sanity.io/event-banner.jpg");

    expect(
      resolveEventShareData(
        event({ detailHeroImage: distinctDetailHeroImage, socialImageUrl: "https://cdn.sanity.io/banner-1200x630.jpg" }),
        "en",
      ).image,
    ).toBe("https://cdn.sanity.io/banner-1200x630.jpg");

    expect(
      resolveEventShareData(
        event({
          detailHeroImage: distinctDetailHeroImage,
          seo: { ogImageUrl: "https://cdn.sanity.io/social-1200x630.jpg" },
        }),
        "en",
      ).image,
    ).toBe("https://cdn.sanity.io/social-1200x630.jpg");
  });

  it("uses localized fallback share text only when the event has no description", () => {
    expect(resolveEventShareData(event({ formattedDescription: [], seo: undefined }), "uk", "Локалізований текст").text)
      .toBe("Локалізований текст");
  });
});

// Guards against the resolved URL ever silently degrading to a bare,
// event-less homepage link — e.g. if `event.slug` were ever empty/missing,
// the URL must still be recognizably an /events/ URL (never
// "https://ro-rum.dk/" or its localized equivalent) so a caller/crawler
// never mistakes it for the homepage.
describe("resolveEventShareData — canonical URL invariant", () => {
  it.each(["en", "da", "uk"] as const)(
    "%s: the resolved URL always contains this event's own slug",
    (locale) => {
      const url = resolveEventShareData(event(), locale).url;
      expect(url).toContain("community-reset-night");
    },
  );

  it.each([
    ["en", "https://ro-rum.dk/events/"],
    ["da", "https://ro-rum.dk/da/events/"],
    ["uk", "https://ro-rum.dk/uk/events/"],
  ] as const)(
    "%s: an event with an empty slug still resolves an /events/ URL, never the bare homepage",
    (locale, expectedUrl) => {
      const url = resolveEventShareData(event({ slug: "" }), locale).url;
      expect(url).toBe(expectedUrl);
      expect(url).not.toBe("https://ro-rum.dk/");
      expect(url).not.toBe("https://ro-rum.dk/da/");
      expect(url).not.toBe("https://ro-rum.dk/uk/");
      expect(url).toContain("/events/");
    },
  );
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
