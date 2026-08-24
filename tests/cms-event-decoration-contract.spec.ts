import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

/**
 * Event-Decoration-specific gallery contract — deliberately NOT covered by
 * relying only on Catering's own contract tests or the shared
 * `resolveCanonicalGalleryItems`/`resolveGalleryItems` unit tests: those
 * prove the RESOLVER's policy in the abstract, not that Event Decoration's
 * OWN page (app/[locale]/(site)/event-decoration/page.tsx) actually calls
 * it correctly against Event Decoration's real live document. Same
 * read-only, schema-to-frontend methodology as
 * tests/cms-catering-contract.spec.ts.
 *
 * Split into two describe blocks per the task's own "before vs. after
 * publication" requirement:
 *   - "canonical gallery" — runs against whatever is CURRENTLY published,
 *     today (14 photos, no video yet, as of this writing) — proves the
 *     canonical-media/order/count contract independent of the pending
 *     video.
 *   - "video Lightbox participation" — requires the manager to have
 *     already published the pending video (see MIGRATION_REPORT.md); skips
 *     itself with a clear reason if no video is live yet, rather than
 *     failing or silently passing on stale assumptions.
 */
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: true,
  perspective: "published",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface RawMedia {
  _key?: string;
  kind?: string;
  alt?: I18nEntry[];
}
interface RawSection {
  sectionKey?: string;
  media?: RawMedia[];
}
interface RawPage {
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

const LOCALES: Locale[] = ["en", "da", "uk"];

test.describe("Event Decoration gallery content contract — canonical mixed-media, count/order (read-only)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let eventDecorationPage: RawPage | null;

  test.beforeAll(async () => {
    eventDecorationPage = await sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "eventDecoration"][0]`);
  });

  test("page-event-decoration exists and has a gallery section", () => {
    expect(eventDecorationPage, "page-event-decoration must exist and be published").toBeTruthy();
    const gallery = eventDecorationPage!.sections?.find((s) => s.sectionKey === "gallery");
    expect(gallery, "a canonical gallery section must exist").toBeTruthy();
  });

  for (const locale of LOCALES) {
    test(`locale: ${locale} — rendered gallery count and photo/video split exactly match the canonical Sanity media array (order preserved)`, async ({ page }) => {
      const gallery = eventDecorationPage!.sections!.find((s) => s.sectionKey === "gallery")!;
      const media = gallery.media ?? [];
      expect(media.length, "canonical gallery must have at least one media item live today").toBeGreaterThan(0);

      await gotoAndStabilize(page, localizedHref("/event-decoration", locale));

      const galleryImages = page.locator("#decoration-gallery img");
      const galleryVideos = page.locator("#decoration-gallery video");
      const photoCount = media.filter((m) => m.kind !== "video").length;
      const videoCount = media.filter((m) => m.kind === "video").length;

      // Schema-driven, not hardcoded — this is the exact assertion class
      // that would have caught the original defect (video items silently
      // filtered out before rendering, and the missing-vs-empty fallback
      // bug that could have resurrected legacy photos instead of the real
      // canonical array).
      expect(await galleryImages.count(), "rendered <img> count must match the canonical document's photo-kind media count").toBe(photoCount);
      expect(await galleryVideos.count(), "rendered <video> count must match the canonical document's video-kind media count").toBe(videoCount);

      // Order: the first rendered photo's alt text must match the first
      // photo-kind canonical media item's alt (proves the array wasn't
      // reordered or split into separate photo/video lists).
      const firstPhoto = media.find((m) => m.kind !== "video");
      const expectedAlt = pick(firstPhoto?.alt, locale) ?? pick(firstPhoto?.alt, "en");
      if (expectedAlt && (await galleryImages.count()) > 0) {
        await expect(galleryImages.first()).toHaveAttribute("alt", expectedAlt);
      }
    });
  }
});

test.describe("Event Decoration gallery — video Lightbox participation (requires the pending video to be PUBLISHED first)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  test("a live Event Decoration gallery video opens and participates in the mixed Lightbox, in its exact canonical position", async ({ page }) => {
    const eventDecorationPage = await sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "eventDecoration"][0]`);
    const gallery = eventDecorationPage?.sections?.find((s) => s.sectionKey === "gallery");
    const media = gallery?.media ?? [];
    const videoIndex = media.findIndex((m) => m.kind === "video");

    if (videoIndex === -1) {
      test.skip(true, "no published video in page-event-decoration's gallery yet — this is the final live assertion, run again once the manager publishes the pending draft (see MIGRATION_REPORT.md)");
      return;
    }

    await gotoAndStabilize(page, "/event-decoration");
    const opener = page.getByRole("button", { name: /^Open video: / });
    await expect(opener.first()).toBeVisible();

    await opener.first().click();
    const dialog = page.getByRole("dialog", { name: "Media preview" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".gallery-lightbox-slide-active video")).toBeVisible();

    // The Lightbox counter must reflect the video's exact 1-based position
    // in the CANONICAL mixed array, not a photo-only or video-only count.
    const counter = dialog.locator('[aria-live="polite"]');
    await expect(counter).toHaveText(`${videoIndex + 1} / ${media.length}`);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
