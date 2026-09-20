// Regression test for the Studio Events list's Sort menu: it must show
// EXACTLY 3 options (Date, Last edited, Created) and nothing else — not one
// menu item per schema field (Price, Address, Language, Billetto event url,
// Waitlist url, Tickets left, Is sold out, Ticket provider, etc.).
//
// That long field-by-field menu is what Sanity produces by default: when a
// schema type declares no `orderings`, `@sanity/schema`'s
// `guessOrderingConfig` (run by `ObjectType.extend`, which
// `DocumentType.extend` reuses — see node_modules/@sanity/schema/lib/
// Schema-BckCkziq.js) auto-generates one ordering per top-level primitive
// (string/number/boolean) field on the type. Declaring a non-empty
// `orderings` array short-circuits that auto-guessing entirely
// (`subTypeDef.orderings || guessOrderingConfig(subTypeDef)`), so only our
// one "Date" ordering survives compilation. Separately, Sanity's
// structure-tool source (getOrderingMenuItemsForSchemaType in
// node_modules/sanity/lib/StructureToolProvider-BF6aVR4a.js) concatenates
// whatever `orderings` the compiled type ends up with onto its own built-in
// DEFAULT_ORDERING_OPTIONS ("Last edited" / "Created") — never replacing
// them — giving exactly 3 menu items total. We deliberately do NOT
// re-implement or snapshot Sanity's own DEFAULT_ORDERING_OPTIONS here —
// that's Sanity's concern — we only assert our own schema's `orderings`
// array plus the real compiled output of Sanity's schema compiler, which is
// the part of this contract this project actually controls/can verify.
import { describe, expect, it } from "vitest";
import { Schema } from "@sanity/schema";
import eventType from "./event";

describe("event schema — Studio Sort menu contract", () => {
  it("declares exactly one custom ordering, named/titled Date, sorting by the `date` field", () => {
    const orderings = eventType.orderings;
    expect(orderings).toBeDefined();
    expect(orderings).toHaveLength(1);

    const dateOrdering = orderings![0]!;
    expect(dateOrdering.name).toBe("date");
    expect(dateOrdering.title).toBe("Date");
    expect(dateOrdering.by).toEqual([{ field: "date", direction: "asc" }]);
  });

  it("does not declare orderings for any other field (Price, Address, Language, Billetto url, etc.)", () => {
    const orderings = eventType.orderings ?? [];
    const orderedFieldNames = orderings.flatMap((ordering) => ordering.by.map((clause) => clause.field));
    expect(orderedFieldNames).toEqual(["date"]);
  });

  // The real, independent check: run our schema type through Sanity's own
  // compiler (the same `@sanity/schema` package Studio uses) and assert the
  // COMPILED type's `orderings` still contains only "date" — i.e.
  // `guessOrderingConfig`'s per-primitive-field auto-generation (which would
  // otherwise add `time`, `price`, `address`, `language`, `billettoEventUrl`,
  // `waitlistUrl`, `ticketsLeft`, `isSoldOut` and `ticketProvider`, exactly
  // the fields removed from the original Sort menu) is genuinely bypassed,
  // not just absent from our own source object.
  it("compiles through Sanity's real schema compiler without auto-generating orderings for other primitive fields", () => {
    const schema = Schema.compile({ name: "event-ordering-test", types: [eventType] });
    const compiledEventType = schema.get("event");

    expect(compiledEventType.orderings).toEqual([
      { name: "date", title: "Date", by: [{ field: "date", direction: "asc" }] },
    ]);
  });
});
