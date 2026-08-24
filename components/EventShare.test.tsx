import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EventShare } from "./EventShare";
import type { ShareAction } from "@/lib/data";

afterEach(() => cleanup());

// Regression guard for this session's socialLinks business correction:
// RORUM's shared socialLinks singleton (Contact/Header/Footer) no longer
// offers LinkedIn as a selectable platform (see
// tests/sanity-schema-visibility.spec.ts's "socialLink.ts — platform
// selector narrowed" block) — but Event Share is a completely separate,
// event-document-level feature (event.ts's own hardcoded SHARE_ACTION_TYPES,
// unrelated to the socialLink object type) and must keep supporting
// LinkedIn exactly as before.
describe("EventShare — LinkedIn remains available here, independent of the socialLinks business correction", () => {
  const linkedinAction: ShareAction = { type: "linkedin", label: "Share on LinkedIn", enabled: true };

  it("renders a real LinkedIn share link when the linkedin action is enabled", () => {
    render(<EventShare title="Test Event" url="https://rorum.dk/events/test" actions={[linkedinAction]} heading="Share with Friends" />);
    const link = screen.getByRole("link", { name: "Share on LinkedIn" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("linkedin.com/sharing/share-offsite"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("a disabled linkedin action renders nothing for it", () => {
    render(<EventShare title="Test Event" url="https://rorum.dk/events/test" actions={[{ ...linkedinAction, enabled: false }]} heading="Share with Friends" />);
    expect(screen.queryByRole("link", { name: "Share on LinkedIn" })).not.toBeInTheDocument();
  });

  it("LinkedIn renders alongside other enabled share actions without interfering with them", () => {
    const actions: ShareAction[] = [
      linkedinAction,
      { type: "facebook", label: "Share on Facebook", enabled: true },
      { type: "whatsapp", label: "Share on WhatsApp", enabled: true },
    ];
    render(<EventShare title="Test Event" url="https://rorum.dk/events/test" actions={actions} heading="Share with Friends" />);
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on WhatsApp" })).toBeInTheDocument();
  });
});
