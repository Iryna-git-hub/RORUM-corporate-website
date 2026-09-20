import { describe, expect, it } from "vitest";
import { stegaFilter } from "@/sanity/lib/stegaFilter";

type Seg = string | number | { _key: string };

// `props.filterDefault` — stub that always says "encode" so we only observe
// what `stegaFilter` itself vetoes. `props` is loosely typed here: stegaFilter
// only reads `sourcePath` / `resultPath` / `filterDefault`.
const encode = () => true;
const call = (path: Seg[]): boolean =>
  (stegaFilter as unknown as (p: { sourcePath: Seg[]; resultPath: Seg[]; filterDefault: () => boolean }) => boolean)({
    sourcePath: path,
    resultPath: path,
    filterDefault: encode,
  });

describe("stegaFilter", () => {
  it("never encodes the structural discriminators the resolver layer matches with ===", () => {
    for (const field of ["sectionKey", "sectionKind", "itemKey", "actionKey", "kind", "pageKey"]) {
      expect(call(["sections", { _key: "a" }, field]), field).toBe(false);
    }
  });

  it("never encodes pageSection.settings[].value (a control token, not editorial text)", () => {
    expect(call(["sections", { _key: "a" }, "settings", { _key: "s" }, "value"])).toBe(false);
  });

  it("never encodes event.visibleLocales[] (locale codes matched with .includes())", () => {
    expect(call(["visibleLocales", 0])).toBe(false);
    expect(call(["visibleLocales", 2])).toBe(false);
  });

  it("DOES encode ordinary editorial strings (title / text / a contentItem value)", () => {
    expect(call(["sections", { _key: "a" }, "title", { _key: "en" }, "value"])).toBe(true);
    expect(call(["sections", { _key: "a" }, "text", { _key: "en" }, "value"])).toBe(true);
    expect(call(["sections", { _key: "a" }, "items", { _key: "i" }, "value"])).toBe(true); // bank-detail value
    expect(call(["title", { _key: "uk" }, "value"])).toBe(true); // event title
  });
});
