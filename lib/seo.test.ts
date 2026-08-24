import { describe, expect, it, vi, beforeEach } from "vitest";

let mockSiteDefaults: {
  siteUrl: string;
  title?: { language?: string; value?: string }[];
  description?: { language?: string; value?: string }[];
  image?: string;
  imageAlt?: { language?: string; value?: string }[];
} = { siteUrl: "https://rorum.dk" };

vi.mock("@/lib/siteSettings", () => ({
  getSeoSiteDefaults: vi.fn(async () => mockSiteDefaults),
}));

import { localizedPageMetadata } from "./seo";

beforeEach(() => {
  mockSiteDefaults = { siteUrl: "https://rorum.dk" };
});

describe("localizedPageMetadata — title/description are used as-is, never re-suffixed", () => {
  it("a caller-supplied title (e.g. from seo.title, already including '| RORUM') is used verbatim — no second suffix appended", async () => {
    const result = await localizedPageMetadata({
      path: "/terms",
      locale: "en",
      title: "Terms and Conditions | RORUM",
      description: "A description.",
    });
    expect(result.title).toBe("Terms and Conditions | RORUM");
    expect((result.title as string).match(/\| RORUM/g)).toHaveLength(1);
  });

  it("an empty caller title falls back to siteSettings.defaultSeo.title for this locale", async () => {
    mockSiteDefaults = { siteUrl: "https://rorum.dk", title: [{ language: "en", value: "Sitewide Default" }] };
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "", description: "d" });
    expect(result.title).toBe("Sitewide Default");
  });

  it("both caller title and siteSettings default are empty: falls back to the bare 'RORUM' string, never an empty title", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "", description: "d" });
    expect(result.title).toBe("RORUM");
  });

  it("an empty caller description falls back to siteSettings.defaultSeo.description for this locale, then a static string", async () => {
    mockSiteDefaults = { siteUrl: "https://rorum.dk", description: [{ language: "en", value: "Sitewide default description" }] };
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "" });
    expect(result.description).toBe("Sitewide default description");

    mockSiteDefaults = { siteUrl: "https://rorum.dk" };
    const result2 = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "" });
    expect(result2.description).toBeTruthy();
  });
});

describe("localizedPageMetadata — canonical, hreflang, x-default", () => {
  it("canonical points at this locale's own URL; hreflang lists every alternate; x-default prefers English", async () => {
    const result = await localizedPageMetadata({ path: "/about", locale: "da", title: "T", description: "D" });
    expect(result.alternates?.canonical).toBe("https://rorum.dk/da/about");
    expect(result.alternates?.languages).toEqual({
      en: "https://rorum.dk/about",
      da: "https://rorum.dk/da/about",
      uk: "https://rorum.dk/uk/about",
      "x-default": "https://rorum.dk/about",
    });
  });

  it("a restricted alternateLocales list (Event Detail's visibleLocales) only advertises those locales, and x-default falls back to the first available one when English isn't in the list", async () => {
    const result = await localizedPageMetadata({
      path: "/events/x",
      locale: "da",
      title: "T",
      description: "D",
      alternateLocales: ["da", "uk"],
    });
    expect(result.alternates?.languages).toEqual({
      da: "https://rorum.dk/da/events/x",
      uk: "https://rorum.dk/uk/events/x",
      "x-default": "https://rorum.dk/da/events/x",
    });
  });
});

describe("localizedPageMetadata — Open Graph / Twitter", () => {
  it("Twitter metadata matches Open Graph title/description/image/alt", async () => {
    const result = await localizedPageMetadata({
      path: "/x",
      locale: "en",
      title: "T",
      description: "D",
      image: "https://cdn.sanity.io/foo.jpg",
      imageAlt: "A real alt",
    });
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title: "T",
      description: "D",
      images: [{ url: "https://cdn.sanity.io/foo.jpg", alt: "A real alt" }],
    });
    expect(result.openGraph?.images).toMatchObject([{ url: "https://cdn.sanity.io/foo.jpg", alt: "A real alt" }]);
  });

  it("an already-absolute Sanity CDN image URL is not prefixed with siteUrl again", async () => {
    const result = await localizedPageMetadata({
      path: "/x",
      locale: "en",
      title: "T",
      description: "D",
      image: "https://cdn.sanity.io/images/foo/bar.jpg",
    });
    const images = result.openGraph?.images as { url: string }[];
    expect(images[0]!.url).toBe("https://cdn.sanity.io/images/foo/bar.jpg");
  });

  it("a relative local image path gets siteUrl prefixed exactly once", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "D", image: "/images/hero.jpg" });
    const images = result.openGraph?.images as { url: string }[];
    expect(images[0]!.url).toBe("https://rorum.dk/images/hero.jpg");
  });

  it("no image supplied at all: falls back to the static hero image, never a missing/broken og:image", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "D" });
    const images = result.openGraph?.images as { url: string }[];
    expect(images[0]!.url).toBe("https://rorum.dk/images/hero.jpg");
  });

  it("openGraph.locale/alternateLocale use the exact required BCP47-with-region tags", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "da", title: "T", description: "D" });
    expect(result.openGraph?.locale).toBe("da_DK");
    expect(result.openGraph?.alternateLocale).toEqual(expect.arrayContaining(["en_US", "uk_UA"]));
  });
});

describe("localizedPageMetadata — image alt precedence", () => {
  it("caller-supplied imageAlt (seo.ogImage.alt or the reused image's own alt) wins", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "D", imageAlt: "Caller alt" });
    expect((result.openGraph?.images as { alt: string }[])[0]!.alt).toBe("Caller alt");
  });

  it("no caller alt: falls back to siteSettings.defaultSeo.ogImage.alt for this locale", async () => {
    mockSiteDefaults = { siteUrl: "https://rorum.dk", imageAlt: [{ language: "en", value: "Sitewide default alt" }] };
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "T", description: "D" });
    expect((result.openGraph?.images as { alt: string }[])[0]!.alt).toBe("Sitewide default alt");
  });

  it("no caller alt, no siteSettings default: derives a concise alt from the title (strips the '| RORUM' suffix)", async () => {
    const result = await localizedPageMetadata({ path: "/x", locale: "en", title: "Contact RORUM | Get in Touch", description: "D" });
    expect((result.openGraph?.images as { alt: string }[])[0]!.alt).toBe("Contact RORUM");
  });
});
