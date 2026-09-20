import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { schemaTypes } from "@/sanity/schemaTypes";

/**
 * Regression guard for MIGRATION_REPORT.md Part 34, Phase C — the last
 * superseded standalone schema types are gone and stay gone. Pure static
 * checks (schema registry + source tree); no Studio runtime, no browser, no
 * Sanity client.
 *
 * These 6 top-level types (+ their 2 child object types) had 0 live
 * documents, 0 GROQ references and were wired to no field — galleries, FAQ
 * categories and menu categories are all `pageSection`s on the relevant
 * `page` document now. `event.host` / `formMessages.privacyConsentLabel`
 * were unset from every production document in the same pass.
 */

const DEAD_TYPES = [
  "galleryCollection",
  "faqGroup",
  "faqItem",
  "cateringMenuCategory",
  "cateringMenuItem",
  "serviceHero",
  "editorialFeature",
  "nextStepSection",
] as const;

test.describe("Part 34 legacy schema cleanup — dead types removed and unreferenced", () => {
  const registeredNames = new Set(
    (schemaTypes as { name?: string }[]).map((t) => t.name).filter(Boolean) as string[],
  );

  for (const name of DEAD_TYPES) {
    test(`"${name}" is not registered in the Studio schema`, () => {
      expect(registeredNames.has(name)).toBe(false);
    });
  }

  for (const rel of [
    "sanity/schemaTypes/documents/galleryCollection.ts",
    "sanity/schemaTypes/documents/faqGroup.ts",
    "sanity/schemaTypes/documents/cateringMenuCategory.ts",
    "sanity/schemaTypes/objects/faqItem.ts",
    "sanity/schemaTypes/objects/cateringMenuItem.ts",
    "sanity/schemaTypes/objects/serviceHero.ts",
    "sanity/schemaTypes/objects/editorialFeature.ts",
    "sanity/schemaTypes/objects/nextStepSection.ts",
  ]) {
    test(`source file "${rel}" no longer exists`, () => {
      expect(existsSync(path.join(process.cwd(), rel))).toBe(false);
    });
  }

  test("no schema file references a dead type by name (of/type wiring)", () => {
    // The two child object types could in principle still be referenced by a
    // surviving parent's `of: [{ type: "faqItem" }]`; assert none of the 8
    // names appear as a field type anywhere in the registered schema tree.
    const json = JSON.stringify(schemaTypes, (_k, v) => (typeof v === "function" ? undefined : v));
    for (const name of DEAD_TYPES) {
      expect(json.includes(`"type":"${name}"`), `dead type "${name}" still wired to a field`).toBe(false);
    }
  });

  test('the "+ Create" menu no longer needs to hide the removed types (they cannot appear — unregistered)', () => {
    const config = readFileSync(path.join(process.cwd(), "sanity.config.ts"), "utf8");
    const hidden = config.match(/HIDDEN_FROM_CREATE = new Set\(\[([^\]]*)\]\)/)?.[1] ?? "";
    for (const name of DEAD_TYPES) {
      expect(hidden.includes(name), `${name} should no longer be listed in HIDDEN_FROM_CREATE`).toBe(false);
    }
  });
});
