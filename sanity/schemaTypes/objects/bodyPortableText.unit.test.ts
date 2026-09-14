import { describe, expect, it } from "vitest";
import bodyPortableText from "./bodyPortableText";

describe("bodyPortableText Studio contract", () => {
  it("is a Portable Text block array with the manager-facing formatting controls", () => {
    expect(bodyPortableText.type).toBe("array");

    const block = bodyPortableText.of?.[0];
    expect(block?.type).toBe("block");
    expect(block?.styles?.map((style) => style.value)).toEqual(["normal", "h2"]);
    expect(block?.lists?.map((list) => list.value)).toEqual(["bullet", "number"]);
    expect(block?.marks?.decorators?.map((decorator) => decorator.value)).toEqual(["strong", "em"]);
    expect(block?.marks?.annotations?.map((annotation) => annotation.name)).toContain("link");
  });
});
