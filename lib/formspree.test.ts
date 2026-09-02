import { afterEach, describe, expect, it, vi } from "vitest";
import { isFormspreeConfigured, submitToFormspree } from "./formspree";

// This project ships WITHOUT a real Formspree endpoint (`.env.example`'s
// placeholder), so every form's submit path must fail *before* any network
// call. These tests lock that guarantee down — see components/ContactForm.tsx
// and components/VolunteerApplicationForm.tsx, both of which rely on it to
// show the "not configured" notice instead of a false success.

afterEach(() => vi.restoreAllMocks());

describe("formspree helper — unconfigured (the project's current, shipped state)", () => {
  it("isFormspreeConfigured() is false when NEXT_PUBLIC_FORMSPREE_ENDPOINT is the placeholder / unset", () => {
    expect(isFormspreeConfigured()).toBe(false);
  });

  it("submitToFormspree() rejects with FORMSPREE_NOT_CONFIGURED and makes ZERO network requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("submitToFormspree must not touch the network when no endpoint is configured");
    });

    await expect(submitToFormspree(new FormData())).rejects.toThrow("FORMSPREE_NOT_CONFIGURED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
