import { describe, expect, it } from "vitest";
import eventType from "./event";

type FieldLike = {
  name?: string;
  type?: string;
  of?: { type?: string }[];
  options?: { list?: string[]; layout?: string };
  validation?: (rule: unknown) => unknown;
};

function languageField(): FieldLike {
  return (eventType.fields as FieldLike[]).find((field) => field.name === "language")!;
}

describe("Event spoken languages Studio schema", () => {
  it("uses the native array-of-string checklist with the existing human values", () => {
    const field = languageField();
    expect(field.type).toBe("array");
    expect(field.of).toEqual([expect.objectContaining({ type: "string" })]);
    expect(field.options).toEqual({
      list: ["English", "Danish", "Ukrainian"],
      layout: "grid",
    });
  });

  it("remains optional while rejecting duplicates and values outside the checklist", () => {
    let uniqueApplied = false;
    let custom: ((value: unknown) => true | string) | undefined;
    const rule = {
      unique() { uniqueApplied = true; return this; },
      custom(fn: (value: unknown) => true | string) { custom = fn; return this; },
    };
    languageField().validation!(rule);
    expect(uniqueApplied).toBe(true);
    expect(custom!(undefined)).toBe(true);
    expect(custom!(["English", "Ukrainian"])).toBe(true);
    expect(custom!(["French"])).toBe("Select only English, Danish, or Ukrainian.");
    expect(custom!("English")).toBe("Event languages must be selected from the checklist.");
  });
});
