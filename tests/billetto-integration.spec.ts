import { expect, test } from "@playwright/test";
import eventType from "@/sanity/schemaTypes/documents/event";
import { parseBillettoEventId } from "@/lib/billettoUrl";

/**
 * Schema-level tests for the Billetto ticketing integration (Part 36).
 * Direct inspection of the `event` schema object — no Studio runtime, no
 * browser, no network. Frontend behaviour is covered by
 * `cms-events-contract.spec.ts`; the Billetto client + resolver by
 * `lib/billetto*.test.ts` / `lib/eventAvailability.test.ts`.
 */

interface FieldDef {
  name: string;
  title?: string;
  hidden?: unknown;
  initialValue?: unknown;
  validation?: (rule: unknown) => unknown;
}

const fields = (eventType.fields as unknown as FieldDef[]);
const field = (name: string) => {
  const f = fields.find((x) => x.name === name);
  if (!f) throw new Error(`event field "${name}" not found`);
  return f;
};

function callHidden(f: FieldDef, document: Record<string, unknown>): boolean {
  const h = f.hidden;
  if (typeof h === "boolean") return h;
  if (typeof h === "function") return Boolean((h as (ctx: { document: unknown }) => boolean)({ document }));
  return false;
}

function customValidator(f: FieldDef): (value: unknown) => unknown {
  const captured: ((value: unknown) => unknown)[] = [];
  const rule = {
    custom(fn: (value: unknown) => unknown) {
      captured.push(fn);
      return rule;
    },
    required() {
      return rule;
    },
  };
  f.validation?.(rule);
  if (!captured.length) throw new Error(`field "${f.name}" has no rule.custom(...)`);
  return (value) => {
    for (const fn of captured) {
      const r = fn(value);
      if (r !== true) return r;
    }
    return true;
  };
}

const VALID_URL = "https://billetto.dk/e/rorum-integration-test-billetter-1994849";
const VALID_URL_WITH_UTM = `${VALID_URL}?utm_source=organiser&utm_medium=share`;

test.describe("event schema — Billetto event link field (Phase 4)", () => {
  test("the field exists, is a plain string, and is always visible to the manager", () => {
    const f = field("billettoEventUrl");
    expect((eventType.fields as { name: string; type: string }[]).find((x) => x.name === "billettoEventUrl")?.type).toBe("string");
    expect(callHidden(f, {})).toBe(false);
    expect(callHidden(f, { billettoEventUrl: VALID_URL })).toBe(false);
  });

  test("validation: empty is allowed (optional)", () => {
    const validate = customValidator(field("billettoEventUrl"));
    expect(validate(undefined)).toBe(true);
    expect(validate("")).toBe(true);
    expect(validate("   ")).toBe(true);
  });

  test("validation: accepts a real billetto.dk event URL (with or without UTM query)", () => {
    const validate = customValidator(field("billettoEventUrl"));
    expect(validate(VALID_URL)).toBe(true);
    expect(validate(VALID_URL_WITH_UTM)).toBe(true);
    expect(validate("https://billetto.com/e/my-event-billetter-42")).toBe(true);
  });

  test("validation: rejects a malformed / non-Billetto URL with a friendly message", () => {
    const validate = customValidator(field("billettoEventUrl"));
    for (const bad of [
      "https://eventbrite.com/e/x-billetter-1994849",
      "https://billetto.dk/",
      "https://billetto.dk/e/no-id-here",
      "just some text",
      "billetto.dk.evil.com/e/x-billetter-1",
    ]) {
      expect(validate(bad), bad).toBe("Enter a valid Billetto event URL.");
    }
  });

  test("the numeric id the API needs is derivable from the URL — the manager never types it", () => {
    expect(parseBillettoEventId(VALID_URL_WITH_UTM)).toBe("1994849");
  });
});

test.describe("event schema — manual availability fields hidden when connected (Phase 5)", () => {
  const connected = { billettoEventUrl: VALID_URL };
  const notConnected = { billettoEventUrl: "" };

  for (const name of ["ticketsLeft", "isSoldOut", "ticketUrl"]) {
    test(`"${name}" is hidden for a Billetto-connected event, visible otherwise`, () => {
      expect(callHidden(field(name), connected), `${name} hidden when connected`).toBe(true);
      expect(callHidden(field(name), notConnected), `${name} visible when not connected`).toBe(false);
      expect(callHidden(field(name), {}), `${name} visible on a brand-new event`).toBe(false);
      // A half-typed / invalid Billetto URL does NOT hide the manual fields
      // (otherwise a typo would silently drop the only availability source).
      expect(callHidden(field(name), { billettoEventUrl: "https://billetto.dk/typo" }), `${name} visible on invalid URL`).toBe(false);
    });
  }
});

test.describe("event schema — new-event Buy Ticket label defaults (Phase 7)", () => {
  test("ticketButtonLabel initialValue is populated EN/DA/UK with the approved wording", () => {
    const iv = field("ticketButtonLabel").initialValue as { language: string; value: string }[];
    expect(Array.isArray(iv)).toBe(true);
    const byLang = Object.fromEntries(iv.map((e) => [e.language, e.value]));
    expect(byLang).toEqual({ en: "Buy Ticket", da: "Køb billet", uk: "Купити квиток" });
  });

  test("every entry is a well-formed internationalizedArrayString value", () => {
    const iv = field("ticketButtonLabel").initialValue as { _key: string; _type: string; language: string }[];
    for (const e of iv) {
      expect(e._type).toBe("internationalizedArrayStringValue");
      expect(e._key).toBe(e.language);
    }
  });
});
