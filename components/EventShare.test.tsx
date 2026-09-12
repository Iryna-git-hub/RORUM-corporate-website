import { describe, expect, it, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    render(<EventShare title="Test Event" url="https://ro-rum.dk/events/test" actions={[linkedinAction]} heading="Share with Friends" />);
    const link = screen.getByRole("link", { name: "Share on LinkedIn" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("linkedin.com/sharing/share-offsite"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("a disabled linkedin action renders nothing for it", () => {
    render(<EventShare title="Test Event" url="https://ro-rum.dk/events/test" actions={[{ ...linkedinAction, enabled: false }]} heading="Share with Friends" />);
    expect(screen.queryByRole("link", { name: "Share on LinkedIn" })).not.toBeInTheDocument();
  });

  it("LinkedIn renders alongside other enabled share actions without interfering with them", () => {
    const actions: ShareAction[] = [
      linkedinAction,
      { type: "facebook", label: "Share on Facebook", enabled: true },
      { type: "whatsapp", label: "Share on WhatsApp", enabled: true },
    ];
    render(<EventShare title="Test Event" url="https://ro-rum.dk/events/test" actions={actions} heading="Share with Friends" />);
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on WhatsApp" })).toBeInTheDocument();
  });
});

describe("EventShare — supported browser behavior", () => {
  const canonicalUrl = "https://ro-rum.dk/da/events/community-reset-night";

  it("copies the canonical production URL, never the current localhost URL", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <EventShare
        title="Fællesskabsaften"
        text="Kom med."
        url={canonicalUrl}
        actions={[{ type: "copyLink", label: "Kopiér link", enabled: true }]}
        heading="Del"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kopiér link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(canonicalUrl));
  });

  it("passes localized title, text and canonical URL to native sharing without an image file", async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(
      <EventShare
        title="Вечір спільноти"
        text="Приєднуйтеся до події."
        url="https://ro-rum.dk/uk/events/community-reset-night"
        actions={[{ type: "share", label: "Поділитися", enabled: true }]}
        heading="Поділитися"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "Вечір спільноти",
        text: "Приєднуйтеся до події.",
        url: "https://ro-rum.dk/uk/events/community-reset-night",
      }),
    );
  });

  it("truthfully copies the link for Instagram instead of launching an unsupported prefilled post", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <EventShare
        title="Community Reset Night"
        url={canonicalUrl}
        actions={[{ type: "instagram", label: "Instagram", enabled: true }]}
        heading="Share"
        instagramCopyMessage="Link copied. You can paste it into Instagram."
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(canonicalUrl));
    expect(await screen.findByText("Link copied. You can paste it into Instagram.")).toBeVisible();
  });

  it("does not announce success when the legacy clipboard fallback reports failure", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const execCommand = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    render(
      <EventShare
        title="Community Reset Night"
        url={canonicalUrl}
        actions={[{ type: "instagram", label: "Instagram", enabled: true }]}
        heading="Share"
        instagramCopyMessage="Link copied. You can paste it into Instagram."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    await waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
    expect(screen.getByText("Link copied")).toHaveClass("opacity-0");
    expect(screen.queryByText("Link copied. You can paste it into Instagram.")).not.toBeInTheDocument();
  });
});
