import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { SocialLinkLabelInput } from "./SocialLinkLabelInput";

function fakeProps(value: unknown[] = []) {
  return {
    value,
    onChange: vi.fn(),
    readOnly: false,
    schemaType: { name: "internationalizedArrayString" },
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
}

describe("SocialLinkLabelInput", () => {
  it("always shows all 3 language rows, with no scoping check needed", () => {
    render(
      <ThemeProvider theme={studioTheme}>
        <SocialLinkLabelInput {...fakeProps()} />
      </ThemeProvider>,
    );
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });
});
