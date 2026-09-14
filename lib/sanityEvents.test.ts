// Pure-function tests for sanityEventToRorumEvent's image resolution —
// specifically the separation between the event banner (`image`) and the
// independent, decorative Event Detail background (`detailHeroImage`). See
// lib/data.ts's "TWO INDEPENDENT IMAGE CONCERNS" comment for the full
// reasoning behind this split.
//
// `@/sanity/lib/image`'s real urlForImage depends on
// NEXT_PUBLIC_SANITY_PROJECT_ID/_DATASET (unset in this test environment, so
// it would always return undefined) — mocked here with a deterministic fake
// CDN URL builder, same pattern as lib/sanityGallery.test.ts, so the
// RESOLUTION/FALLBACK LOGIC under test is independent of real Sanity config.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/sanity/lib/image", () => ({
  urlForImage: vi.fn((source: { asset?: { _ref?: string } } | undefined | null) => {
    const ref = source?.asset?._ref;
    if (!ref) return undefined;
    return {
      width: (w: number) => ({
        url: () => `https://cdn.test/image/${ref}-w${w}.jpg`,
        height: () => ({ fit: () => ({ url: () => `https://cdn.test/image/${ref}-social.jpg` }) }),
      }),
    };
  }),
}));

import { sanityEventToRorumEvent, type SanityEventLike } from "./sanityEvents";
import { getEventLanguagesLabel } from "./eventLanguage";

function baseDoc(overrides: Partial<SanityEventLike> = {}): SanityEventLike {
  return {
    _id: "event-1",
    slug: { current: "some-event-with-no-static-fallback" },
    title: [{ _key: "en", language: "en", value: "Some event" }],
    image: { _type: "image", asset: { _type: "reference", _ref: "image-banner-ref" } },
    ...overrides,
  };
}

describe("sanityEventToRorumEvent — detailHeroImage (Event Detail background)", () => {
  it("resolves detailHeroImage to its OWN asset's URL when the event has one, not the banner", () => {
    const doc = baseDoc({
      detailHeroImage: { _type: "image", asset: { _type: "reference", _ref: "image-detail-hero-ref" } },
    });

    const result = sanityEventToRorumEvent(doc, "en");

    expect(result.detailHeroImage).toBe("https://cdn.test/image/image-detail-hero-ref-w1200.jpg");
    // And the banner keeps resolving independently to its own, different URL.
    expect(result.image).toBe("https://cdn.test/image/image-banner-ref-w1200.jpg");
    expect(result.detailHeroImage).not.toBe(result.image);
  });

  it("falls back to the already-resolved banner URL (not /images/hero.jpg) when the event has no detailHeroImage of its own", () => {
    const doc = baseDoc(); // no detailHeroImage set at all

    const result = sanityEventToRorumEvent(doc, "en");

    expect(result.detailHeroImage).toBe(result.image);
    expect(result.detailHeroImage).toBe("https://cdn.test/image/image-banner-ref-w1200.jpg");
    expect(result.detailHeroImage).not.toBe("/images/hero.jpg");
  });

  it("falls back to the banner URL even when neither image nor a static-seed fallback exists (no content migration required)", () => {
    const doc: SanityEventLike = {
      _id: "event-2",
      slug: { current: "brand-new-event-no-images-at-all" },
      title: [{ _key: "en", language: "en", value: "Brand new event" }],
      // No `image` asset and no matching static-seed fallback for this slug.
    };

    const result = sanityEventToRorumEvent(doc, "en");

    // Both should degrade together to the same final safety net.
    expect(result.detailHeroImage).toBe(result.image);
    expect(result.detailHeroImage).toBe("/images/hero.jpg");
  });
});

// Full pipeline (raw Sanity doc shape → RorumEvent.language array →
// Event Detail's rendered label string) for 1, 2 and 3 selected languages —
// the shapes now actually present in production after the scalar→array
// migration (see lib/eventLanguageMigration.ts and MIGRATION_REPORT.md): 36
// migrated single-language events, plus one pre-existing 3-language document
// (`test-5-event`, unaffected/untouched by the migration) used verbatim as
// the 3-language fixture below.
describe("sanityEventToRorumEvent — language (raw doc array → RorumEvent.language → Event Detail label)", () => {
  it("one language", () => {
    const result = sanityEventToRorumEvent(baseDoc({ language: ["Ukrainian"] }), "en");
    expect(result.language).toEqual(["Ukrainian"]);
    expect(getEventLanguagesLabel(result.language, "en")).toBe("Ukrainian");
  });

  it("two languages", () => {
    const result = sanityEventToRorumEvent(baseDoc({ language: ["English", "Ukrainian"] }), "en");
    expect(result.language).toEqual(["English", "Ukrainian"]);
    expect(getEventLanguagesLabel(result.language, "en")).toBe("English, Ukrainian");
  });

  it("three languages (production's own test-5-event shape: [\"English\",\"Danish\",\"Ukrainian\"])", () => {
    const result = sanityEventToRorumEvent(baseDoc({ language: ["English", "Danish", "Ukrainian"] }), "en");
    expect(result.language).toEqual(["English", "Danish", "Ukrainian"]);
    expect(getEventLanguagesLabel(result.language, "en")).toBe("English, Danish, Ukrainian");
    expect(getEventLanguagesLabel(result.language, "da")).toBe("Engelsk, Dansk, Ukrainsk");
    expect(getEventLanguagesLabel(result.language, "uk")).toBe("Англійська, Данська, Українська");
  });

  it("falls back to [\"English\"] only when the doc has no language and no static-seed fallback has one either", () => {
    const result = sanityEventToRorumEvent(baseDoc({ language: undefined }), "en");
    expect(result.language).toEqual(["English"]);
  });
});
