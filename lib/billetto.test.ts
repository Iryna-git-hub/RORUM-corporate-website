import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fresh module import per test so the module-level "warned once" flag and
// any fetch-cache assumptions don't leak between cases.
async function loadBilletto() {
  vi.resetModules();
  return import("@/lib/billetto");
}

function mockFetchJson(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response);
}

const CREDS = { BILLETTO_API_KEY_ID: "kid_test", BILLETTO_ACCESS_KEY_SECRET: "secret_test" };

beforeEach(() => {
  vi.stubEnv("BILLETTO_API_KEY_ID", CREDS.BILLETTO_API_KEY_ID);
  vi.stubEnv("BILLETTO_ACCESS_KEY_SECRET", CREDS.BILLETTO_ACCESS_KEY_SECRET);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getBillettoEventAvailability", () => {
  it("a healthy response with available > 1 → { ok, available, status }", async () => {
    const fetchMock = mockFetchJson(200, { availability: { available: 10, status: "high" } });
    vi.stubGlobal("fetch", fetchMock);
    const { getBillettoEventAvailability } = await loadBilletto();

    const result = await getBillettoEventAvailability("1994849");
    expect(result).toEqual({ ok: true, available: 10, status: "high" });
    // request went to the confirmed organiser endpoint
    expect(fetchMock.mock.calls[0]![0]).toBe("https://billetto.dk/api/v3/organiser/events/1994849");
  });

  it("available === 1 is passed through unchanged (singular is the caller's concern)", async () => {
    vi.stubGlobal("fetch", mockFetchJson(200, { availability: { available: 1, status: "low" } }));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: true, available: 1, status: "low" });
  });

  it("available === 0 → { ok, available: 0 } (caller derives sold-out)", async () => {
    vi.stubGlobal("fetch", mockFetchJson(200, { availability: { available: 0, status: "sold_out" } }));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: true, available: 0, status: "sold_out" });
  });

  it("negative / fractional available is clamped to a non-negative integer", async () => {
    vi.stubGlobal("fetch", mockFetchJson(200, { availability: { available: -3, status: "x" } }));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect((await getBillettoEventAvailability("1"))).toEqual({ ok: true, available: 0, status: "x" });
  });

  it("200 but no availability block → malformed (never a false 0)", async () => {
    vi.stubGlobal("fetch", mockFetchJson(200, { id: 1, name: "x" }));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "malformed" });
  });

  it("200 but availability.available is non-numeric → ok with available: null", async () => {
    vi.stubGlobal("fetch", mockFetchJson(200, { availability: { available: "lots", status: "high" } }));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: true, available: null, status: "high" });
  });

  it("response body is not JSON → malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
        text: async () => "<html>gateway</html>",
      } as unknown as Response),
    );
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "malformed" });
  });

  it("401 / 403 → unauthorized", async () => {
    for (const status of [401, 403]) {
      vi.stubGlobal("fetch", mockFetchJson(status, {}));
      const { getBillettoEventAvailability } = await loadBilletto();
      expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "unauthorized" });
    }
  });

  it("404 → not-found", async () => {
    vi.stubGlobal("fetch", mockFetchJson(404, {}));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("nope")).toEqual({ ok: false, reason: "not-found" });
  });

  it("429 → rate-limited (no retry)", async () => {
    const fetchMock = mockFetchJson(429, {});
    vi.stubGlobal("fetch", fetchMock);
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "rate-limited" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("5xx → server-error", async () => {
    vi.stubGlobal("fetch", mockFetchJson(503, {}));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "server-error" });
  });

  it("network failure / timeout → network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "TimeoutError" })));
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "network" });
  });

  it("missing credentials → no-credentials, and NO network request is made", async () => {
    vi.stubEnv("BILLETTO_API_KEY_ID", "");
    vi.stubEnv("BILLETTO_ACCESS_KEY_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { getBillettoEventAvailability } = await loadBilletto();
    expect(await getBillettoEventAvailability("1")).toEqual({ ok: false, reason: "no-credentials" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds the Api-Keypair header server-side and never returns/logs the secret", async () => {
    const fetchMock = mockFetchJson(200, { availability: { available: 5, status: "high" } });
    vi.stubGlobal("fetch", fetchMock);
    const warnSpy = console.warn as unknown as ReturnType<typeof vi.fn>;
    const { getBillettoEventAvailability } = await loadBilletto();

    const result = await getBillettoEventAvailability("1994849");
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers["Api-Keypair"]).toBe("kid_test:secret_test");
    // the secret never appears in the returned value or any warn line
    expect(JSON.stringify(result)).not.toContain("secret_test");
    for (const call of warnSpy.mock.calls) expect(JSON.stringify(call)).not.toContain("secret_test");
  });
});
