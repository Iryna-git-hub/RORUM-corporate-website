import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { homeContract } from "@/lib/content-contracts/home";
import { localizedHref } from "@/lib/i18n";

/**
 * Read-only schema-to-frontend connection proof for every entry in the Home
 * content contract (lib/content-contracts/home.ts) that is currently
 * classified "connected" — fetches the live, published Sanity value and
 * asserts the rendered page (EN/DA/UK) actually shows/links to it, by
 * stable key where the field is one of several repeated items.
 *
 * Never mutates anything: `perspective: "published"`, no write token. Safe
 * to run against production at any time. Entries classified
 * "pending-approved-migration"/"pending-decision"/"technical-hidden" are
 * intentionally NOT asserted as rendered here — each has an explicit
 * `test.skip` with its contract classification as the reason, so "not yet
 * covered" is a documented, visible fact instead of a silent gap.
 */

// `useCdn: true` deliberately matches sanity/lib/client.ts's `getClient()`
// (what the real site reads through) rather than the freshest possible
// value — this spec proves "what's rendered matches what the same read path
// production uses would return," not "matches the absolute latest write."
// Sanity's CDN can lag a live edit briefly; comparing against the same CDN
// path the site itself uses avoids a false failure from that lag alone.
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
interface RawAction {
  actionKey?: string;
  label?: I18nEntry[];
  href?: string;
  openInNewTab?: boolean;
  enabled?: boolean;
}
interface RawItem {
  itemKey?: string;
  icon?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  label?: I18nEntry[];
  href?: string;
}
interface RawMedia {
  kind?: string;
  alt?: I18nEntry[];
}
interface RawSection {
  sectionKey?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: RawMedia[];
  actions?: RawAction[];
  items?: RawItem[];
}
interface RawPage {
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

test.describe("Home content contract — schema-to-frontend connection (read-only)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let page_: RawPage = {};

  test.beforeAll(async () => {
    page_ = await sanity.fetch<RawPage>(
      `*[_id == "page-home"][0]{
        "seo": seo{title, description},
        "sections": sections[]{
          sectionKey, label, title, text,
          "media": media[]{kind, alt},
          "actions": actions[]{actionKey, label, href, openInNewTab, enabled},
          "items": items[]{itemKey, icon, title, text, label, href}
        }
      }`,
    );
  });

  const byKey = (key: string) => page_.sections?.find((s) => s.sectionKey === key);
  const itemByKey = (section: RawSection | undefined, key: string) => section?.items?.find((i) => i.itemKey === key);
  const actionByKey = (section: RawSection | undefined, key: string) => section?.actions?.find((a) => a.actionKey === key);

  for (const locale of ["en", "da", "uk"] as const) {
    test.describe(`locale: ${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(localizedHref("/", locale));
      });

      // ---- hero ----------------------------------------------------------
      test("hero label", async ({ page }) => {
        const value = pick(byKey("hero")?.label, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByTestId("home-hero-label")).toHaveText(value!);
      });

      test("hero H1", async ({ page }) => {
        const value = pick(byKey("hero")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.locator(".home-hero-full h1")).toHaveText(value!);
      });

      test("hero text", async ({ page }) => {
        const value = pick(byKey("hero")?.text, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByTestId("home-hero-text")).toHaveText(value!);
      });

      test("hero media renders a background (image or video)", async ({ page }) => {
        const hero = page.locator(".home-hero-full");
        const style = await hero.getAttribute("style");
        expect(style).toContain("background-image");
      });

      test("hero primary action (label + href)", async ({ page }) => {
        const action = actionByKey(byKey("hero"), "primary");
        const label = pick(action?.label, locale);
        test.skip(!label || action?.enabled === false, "no published label, or action disabled");
        const link = page.getByTestId("home-hero-primary-cta");
        await expect(link).toContainText(label!);
        await expect(link).toHaveAttribute("href", localizedHref(action!.href!, locale));
      });

      test("hero secondary action (label + href)", async ({ page }) => {
        const action = actionByKey(byKey("hero"), "secondary");
        const label = pick(action?.label, locale);
        test.skip(!label || action?.enabled === false, "no published label, or action disabled");
        const link = page.getByTestId("home-hero-secondary-cta");
        await expect(link).toContainText(label!);
        await expect(link).toHaveAttribute("href", localizedHref(action!.href!, locale));
      });

      test("hero trust badges render one per populated item, by stable key", async ({ page }) => {
        const items = byKey("hero")?.items?.filter((i) => i.itemKey?.startsWith("trust")) ?? [];
        for (const item of items) {
          const title = pick(item.title, locale);
          if (!title) continue; // this locale's translation not published for this badge
          await expect(page.getByTestId(`home-hero-trust-${item.itemKey}`)).toContainText(title);
        }
      });

      // ---- quickPaths ------------------------------------------------------
      test("quick paths label", async ({ page }) => {
        const value = pick(byKey("quickPaths")?.label, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByTestId("home-quickpaths-label")).toHaveText(value!);
      });

      test("quick paths title", async ({ page }) => {
        const value = pick(byKey("quickPaths")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 2, name: value! })).toBeVisible();
      });

      test("quick path cards render by stable key with correct title/href", async ({ page }) => {
        const section = byKey("quickPaths");
        for (const key of ["events", "hostAtRorum", "catering", "eventDecoration"]) {
          const item = itemByKey(section, key);
          const title = pick(item?.title, locale);
          if (!title) continue;
          const slug = (item?.href ?? "").replace(/^\/+/, "").replaceAll("/", "-");
          const card = page.locator(`.quick-path-card-${slug}`);
          await expect(card).toContainText(title);
          await expect(card).toHaveAttribute("href", localizedHref(item!.href!, locale));
        }
      });

      test("quick path icons render the canonical Sanity-sourced value by stable key", async ({ page }) => {
        const section = byKey("quickPaths");
        const canonical: Record<string, string> = {
          events: "CalendarDays",
          hostAtRorum: "Presentation",
          catering: "ConciergeBell",
          eventDecoration: "Balloon",
        };
        for (const key of ["events", "hostAtRorum", "catering", "eventDecoration"]) {
          const item = itemByKey(section, key);
          test.skip(!item?.icon, `no published icon value for "${key}" yet`);
          expect(item!.icon, `${key} should hold its approved canonical icon`).toBe(canonical[key]);
          const slug = (item?.href ?? "").replace(/^\/+/, "").replaceAll("/", "-");
          const icon = page.locator(`.quick-path-card-${slug} svg`);
          await expect(icon).toHaveAttribute("data-icon", canonical[key]!);
        }
      });

      // ---- eventsStrip -------------------------------------------------
      test("events strip label", async ({ page }) => {
        const value = pick(byKey("eventsStrip")?.label, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByTestId("home-events-label")).toHaveText(value!);
      });

      test("events strip title", async ({ page }) => {
        const value = pick(byKey("eventsStrip")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 2, name: value! })).toBeVisible();
      });

      test("events strip view-all action (label + href)", async ({ page }) => {
        const action = actionByKey(byKey("eventsStrip"), "viewAll");
        const label = pick(action?.label, locale);
        test.skip(!label || action?.enabled === false, "no published label, or action disabled");
        const link = page.getByTestId("home-events-view-all");
        await expect(link).toContainText(label!);
        await expect(link).toHaveAttribute("href", localizedHref(action!.href!, locale));
      });

      test("events strip settings (Studio-only, not applicable to frontend rendering)", async () => {
        test.skip(true, "eventsStrip.settings is a Studio-only field (hidden, unused by the frontend) — nothing to assert in rendered output; see the contract's technical-hidden entry");
      });

      test("events strip renders event cards from separate `event` documents", async ({ page }) => {
        await expect(page.locator(".event-section-head").locator("xpath=following-sibling::*[1]")).toBeVisible();
      });

      // ---- editorial features ------------------------------------------
      for (const [sectionKey, testId] of [
        ["editorialAttendEvents", "home-feature-attend"],
        ["editorialHostAtRorum", "home-feature-host"],
      ] as const) {
        test(`${sectionKey}: eyebrow/intro/description`, async ({ page }) => {
          const section = byKey(sectionKey);
          const eyebrow = pick(section?.label, locale);
          const intro = pick(section?.text, locale);
          const description = pick(itemByKey(section, "description")?.text, locale);
          if (eyebrow) await expect(page.getByTestId(`${testId}-eyebrow`)).toHaveText(eyebrow);
          if (intro) await expect(page.getByTestId(`${testId}-intro`)).toHaveText(intro);
          if (description) await expect(page.getByTestId(`${testId}-description`)).toHaveText(description);
        });

        test(`${sectionKey}: feature bullets by stable key`, async ({ page }) => {
          const section = byKey(sectionKey);
          for (const key of ["feature0", "feature1", "feature2", "feature3"]) {
            const item = itemByKey(section, key);
            const label = pick(item?.title, locale);
            if (!label) continue;
            await expect(page.getByTestId(`${testId}-feature-${key}`)).toContainText(label);
          }
        });

        test(`${sectionKey}: feature icons render by stable key`, async ({ page }) => {
          const section = byKey(sectionKey);
          const items = ["feature0", "feature1", "feature2", "feature3"]
            .map((key) => itemByKey(section, key))
            .filter((item): item is RawItem => !!item?.icon);
          test.skip(!items.length, "no published icon values for this section yet");
          for (const item of items) {
            const icon = page.getByTestId(`${testId}-feature-${item.itemKey}`).locator("svg");
            await expect(icon).toHaveAttribute("data-icon", item.icon!);
          }
        });

        test(`${sectionKey}: cta (label + href)`, async ({ page }) => {
          const action = actionByKey(byKey(sectionKey), "cta");
          const label = pick(action?.label, locale);
          test.skip(!label || action?.enabled === false, "no published label, or action disabled");
          const link = page.getByTestId(`${testId}-cta`);
          await expect(link).toContainText(label!);
          await expect(link).toHaveAttribute("href", localizedHref(action!.href!, locale));
        });

        test(`${sectionKey}: media (image + localized alt text)`, async ({ page }) => {
          const media = byKey(sectionKey)?.media?.[0];
          const alt = pick(media?.alt, locale);
          test.skip(!media || !alt, "no published media/alt for this locale yet");
          const el = page.getByTestId(`${testId}-media`);
          await expect(el).toHaveAttribute("role", "img");
          await expect(el).toHaveAttribute("aria-label", alt!);
          await expect(el).toHaveAttribute("style", /background-image/);
        });
      }

      // ---- servicesTeaser --------------------------------------------------
      test("services label + title", async ({ page }) => {
        const label = pick(byKey("servicesTeaser")?.label, locale);
        const title = pick(byKey("servicesTeaser")?.title, locale);
        if (label) await expect(page.getByTestId("home-services-label")).toHaveText(label);
        if (title) await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
      });

      test("service cards render by stable key with correct title/href", async ({ page }) => {
        const section = byKey("servicesTeaser");
        for (const key of ["catering", "eventDecoration"]) {
          const item = itemByKey(section, key);
          const title = pick(item?.title, locale);
          if (!title || !item?.href) continue;
          const testId = `home-service-${item.href.replace(/^\/+/, "").replaceAll("/", "-")}`;
          const card = page.getByTestId(testId);
          await expect(card).toContainText(title);
          await expect(card).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- communityTeaser -------------------------------------------------
      test("community label/title/text", async ({ page }) => {
        const section = byKey("communityTeaser");
        const label = pick(section?.label, locale);
        const title = pick(section?.title, locale);
        const text = pick(section?.text, locale);
        if (label) await expect(page.getByTestId("home-community-label")).toHaveText(label);
        if (title) await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
        if (text) await expect(page.getByTestId("home-community-text")).toHaveText(text);
      });

      test("community media: uses the Sanity image, decorative (no accessible image label)", async ({ page }) => {
        const media = byKey("communityTeaser")?.media?.[0];
        test.skip(!media, "no published media for communityTeaser yet");
        const el = page.getByTestId("home-community-teaser");
        // Sourced from Sanity now, not the old local /images/... fallback path.
        await expect(el).toHaveAttribute("style", /background-image.*cdn\.sanity\.io/);
        // Decorative: must NOT expose an accessible image name (no role="img", no aria-label) —
        // the community background is a CSS background, same treatment as the Home hero.
        await expect(el).not.toHaveAttribute("role", "img");
        await expect(el).not.toHaveAttribute("aria-label", /.+/);
      });

      test("community pill links by stable key", async ({ page }) => {
        const section = byKey("communityTeaser");
        for (const key of ["wecoda", "workWithUs", "volunteer"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = page.getByTestId("home-community-teaser").getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- closingCta --------------------------------------------------
      test("closing eyebrow/title/text", async ({ page }) => {
        const section = byKey("closingCta");
        const eyebrow = pick(section?.label, locale);
        const title = pick(section?.title, locale);
        const text = pick(section?.text, locale);
        if (eyebrow) await expect(page.getByTestId("home-closing-cta-eyebrow")).toHaveText(eyebrow);
        if (title) await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
        if (text) await expect(page.getByTestId("home-closing-cta-text")).toHaveText(text);
      });

      test("closing main cta (label + href)", async ({ page }) => {
        const action = actionByKey(byKey("closingCta"), "main");
        const label = pick(action?.label, locale);
        test.skip(!label || action?.enabled === false, "no published label, or action disabled");
        const link = page.getByTestId("home-closing-cta-cta");
        await expect(link).toContainText(label!);
        await expect(link).toHaveAttribute("href", localizedHref(action!.href!, locale));
      });

      test("closing FAQ prompt (question + label)", async ({ page }) => {
        const section = byKey("closingCta");
        const question = pick(itemByKey(section, "faqQuestion")?.title, locale);
        const label = pick(itemByKey(section, "faqLabel")?.title, locale);
        if (question) await expect(page.locator(".faq-inline-prompt span").first()).toHaveText(question);
        if (label) await expect(page.locator(".faq-inline-prompt-link span")).toHaveText(label);
      });

      test("closing suggested-path links by stable key", async ({ page }) => {
        const section = byKey("closingCta");
        for (const key of ["link0", "link1", "link2", "link3"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = page.locator('[aria-label="Suggested paths"]').getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- SEO ---------------------------------------------------------
      test("SEO description", async ({ page }) => {
        const value = pick(page_.seo?.description, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.locator('head meta[name="description"]')).toHaveAttribute("content", value!);
      });

      test("SEO title falls back to the hardcoded default when Sanity has no value", async ({ page }) => {
        const value = pick(page_.seo?.title, locale);
        test.skip(!!value, "a value is published for this locale — see the companion 'reflects the published value' test instead");
        await expect(page).toHaveTitle("RORUM | Creative Event Space in Copenhagen");
      });

      test("SEO title reflects the published Sanity value when present", async ({ page }) => {
        const value = pick(page_.seo?.title, locale);
        test.skip(!value, "no published SEO title for this locale yet — see the companion fallback test instead");
        await expect(page).toHaveTitle(value!);
      });
    });
  }

  test('every "connected" contract entry has a real, non-"n/a" frontend selector', () => {
    const connected = homeContract.entries.filter((e) => e.classification === "connected");
    for (const entry of connected) {
      expect(entry.frontendSelector, `${entry.sectionKey}: ${entry.fieldPurpose}`).not.toBe("n/a");
    }
  });

  test("no contract entry is stale-classified \"disconnected\" (regression guard — every finding from the Home audit was fixed or reclassified this pass)", () => {
    const stillDisconnected = homeContract.entries.filter((e) => e.classification === "disconnected");
    expect(stillDisconnected.map((e) => e.sanityPath)).toEqual([]);
  });

  test('the SEO description fix is reflected in the contract (was "disconnected", must now be "connected")', () => {
    const entry = homeContract.entries.find((e) => e.sanityPath === "seo.description");
    expect(entry?.classification).toBe("connected");
  });
});
