import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventDescription } from "./EventDescription";
import { sanityEventToRorumEvent } from "@/lib/sanityEvents";

const span = (key: string, text: string, marks: string[] = []) => ({
  _key: key,
  _type: "span",
  marks,
  text,
});

const block = (
  key: string,
  text: string,
  options: { marks?: string[]; listItem?: "bullet" | "number"; markDefs?: unknown[] } = {},
) => ({
  _key: key,
  _type: "block",
  style: "normal",
  children: [span(`${key}-span`, text, options.marks)],
  markDefs: options.markDefs ?? [],
  ...(options.listItem ? { level: 1, listItem: options.listItem } : {}),
});

describe("EventDescription", () => {
  it("renders formatted paragraphs, line breaks, lists, emphasis, and links semantically", () => {
    const formatted = [
      block("p1", "First paragraph."),
      block("p2", "Line one\nLine two"),
      block("bold", "Bold", { marks: ["strong"] }),
      block("italic", "Italic", { marks: ["em"] }),
      block("bullet", "Bullet item", { listItem: "bullet" }),
      block("number", "Numbered item", { listItem: "number" }),
      block("link", "RORUM link", {
        marks: ["link-mark"],
        markDefs: [{ _key: "link-mark", _type: "link", href: "https://ro-rum.dk/events" }],
      }),
    ];

    const { container } = render(
      <EventDescription formatted={formatted} />,
    );

    expect(container.querySelectorAll(".event-description > p").length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector("br")).not.toBeNull();
    expect(container.querySelector("ul li")?.textContent).toBe("Bullet item");
    expect(container.querySelector("ol li")?.textContent).toBe("Numbered item");
    expect(container.querySelector("strong")?.textContent).toBe("Bold");
    expect(container.querySelector("em")?.textContent).toBe("Italic");
    expect(screen.getByRole("link", { name: "RORUM link" }).getAttribute("href")).toBe(
      "https://ro-rum.dk/events",
    );
  });

  it.each(["en", "da", "uk"] as const)("maps formatted Event content through the %s locale", (locale) => {
    const values = {
      en: [block("en", "English formatted overview")],
      da: [block("da", "Dansk formateret oversigt")],
      uk: [block("uk", "Український форматований опис")],
    };
    const event = sanityEventToRorumEvent(
      {
        slug: { current: "formatted-event" },
        title: [{ _key: locale, language: locale, value: "Event" }],
        formattedDescription: (Object.keys(values) as (keyof typeof values)[]).map((language) => ({
          _key: language,
          language,
          value: values[language],
        })),
      },
      locale,
    );

    expect(event.formattedDescription).toEqual(values[locale]);
  });
});
