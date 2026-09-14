import { describe, expect, it } from "vitest";
import { plainTextToPortableText, portableTextToPlainText } from "./portableText";

describe("portableTextToPlainText", () => {
  it("preserves block paragraph separation and inline span order", () => {
    expect(portableTextToPlainText([
      { _type: "block", children: [{ _type: "span", text: "First ", marks: ["strong"] }, { _type: "span", text: "paragraph", marks: [] }] },
      { _type: "block", children: [{ _type: "span", text: "Second\nline", marks: ["link"] }] },
    ])).toBe("First paragraph\n\nSecond\nline");
  });

  it("ignores formatting metadata and unknown objects without stringifying them", () => {
    expect(portableTextToPlainText([
      { _type: "image", asset: { _ref: "image" } },
      { _type: "block", markDefs: [{ _type: "link" }], children: [{ _type: "span", text: "Readable", marks: ["strong"] }, { object: true }] },
    ])).toBe("Readable");
    expect(portableTextToPlainText(undefined)).toBe("");
    expect(portableTextToPlainText([{ object: true }])).not.toContain("[object Object]");
  });

  it("round-trips plain paragraphs into technical plain text", () => {
    expect(portableTextToPlainText(plainTextToPortableText(" One\nline\n\nTwo "))).toBe("One\nline\n\nTwo");
  });
});
