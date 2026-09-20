import { describe, expect, it, vi } from "vitest";

// createDataAttribute needs a projectId/dataset; the real env module reads
// them from process.env which isn't populated in the unit runner.
vi.mock("@/sanity/env", () => ({ projectId: "p1", dataset: "production" }));

const {
  sanityFieldAttr,
  sanitySectionMediaAttr,
  sanitySectionItemAttr,
  sanityEventImageAttr,
} = await import("@/sanity/lib/dataAttr");

describe("dataAttr helpers", () => {
  it("returns undefined outside Draft Mode (editable = false) — never emitted to published HTML", () => {
    expect(sanityFieldAttr(false, "page-home", "page", ["sections"])).toBeUndefined();
    expect(sanitySectionMediaAttr(false, "page-home", "s1", "m1")).toBeUndefined();
    expect(sanitySectionItemAttr(false, "page-home", "s1", "i1")).toBeUndefined();
    expect(sanityEventImageAttr(false, "event-abc")).toBeUndefined();
  });

  it("returns undefined when a required id/key is missing", () => {
    expect(sanityFieldAttr(true, undefined, "page", ["sections"])).toBeUndefined();
    expect(sanityFieldAttr(true, "page-home", "page", [])).toBeUndefined();
    expect(sanitySectionMediaAttr(true, "page-home", undefined, "m1")).toBeUndefined();
    expect(sanitySectionMediaAttr(true, "page-home", "s1", null)).toBeUndefined();
    expect(sanitySectionItemAttr(true, "page-home", "s1", undefined)).toBeUndefined();
  });

  it("builds a data-sanity value naming the published doc id, type and a _key-based field path", () => {
    const attr = sanitySectionMediaAttr(true, "page-home", "heroKey", "mediaKey")!;
    expect(attr).toContain("id=page-home");
    expect(attr).toContain("type=page");
    // stable _key path segments (`array:<_key>`), never positional indexes (`array[0]`)
    expect(attr).toContain("path=sections:heroKey.media:mediaKey");
    expect(attr).not.toMatch(/sections\[\d+\]|sections\.\d+/);
  });

  it("strips the drafts. id prefix so the overlay always targets the published document", () => {
    const attr = sanityFieldAttr(true, "drafts.page-about", "page", ["sections", { _key: "x" }])!;
    expect(attr).toContain("id=page-about");
    expect(attr).not.toContain("drafts.");
  });

  it("sanitySectionItemAttr scopes to items[] and sanityEventImageAttr to an event's image", () => {
    expect(sanitySectionItemAttr(true, "page-home", "s1", "quick0")).toContain("path=sections:s1.items:quick0");
    const ev = sanityEventImageAttr(true, "drafts.event-xyz")!;
    expect(ev).toContain("id=event-xyz");
    expect(ev).toContain("type=event");
    expect(ev).toContain("path=image");
  });
});
