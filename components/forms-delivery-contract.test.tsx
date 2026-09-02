import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Guardrails for Task 4 (unified Formspree delivery). Every real submission
// form must:
//  - go through the ONE shared path (lib/useFormspreeSubmit -> submitToFormspree)
//  - carry no ad-hoc fetch / fake setTimeout "success"
//  - never hardcode a recipient email in the component

const FORM_COMPONENTS = [
  "ContactForm.tsx",
  "VolunteerApplicationForm.tsx",
  "CvUploadModal.tsx",
  "CateringInquiryForm.tsx",
  "InquiryForm.tsx",
];

function read(file: string): string {
  return readFileSync(path.join(process.cwd(), "components", file), "utf-8");
}

describe("form delivery contract — every submission form uses the ONE shared Formspree path", () => {
  it.each(FORM_COMPONENTS)("%s submits via the shared useFormspreeSubmit hook", (file) => {
    expect(read(file)).toMatch(/useFormspreeSubmit\(/);
  });

  it.each(FORM_COMPONENTS)("%s has no ad-hoc fetch() call", (file) => {
    expect(read(file)).not.toMatch(/\bfetch\s*\(/);
  });

  it.each(FORM_COMPONENTS)("%s has no fake setTimeout-then-success submission", (file) => {
    const src = read(file);
    // The only setTimeout allowed anywhere near a form is InquiryForm's
    // deep-link package prefill (setSelectedPackage), never a submission.
    const suspicious = /setTimeout\([^)]*\)[\s\S]{0,120}(setSent\(true\)|"success"|resolve\(\))/i;
    expect(src).not.toMatch(suspicious);
    expect(src).not.toMatch(/submitCvApplication|window\.setTimeout\(resolve/);
  });

  it.each(FORM_COMPONENTS)("%s never hardcodes a real recipient email address (placeholders like you@example.com are fine)", (file) => {
    const src = read(file);
    const realEmails = (src.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []).filter(
      (e) => !e.toLowerCase().endsWith("@example.com"),
    );
    expect(realEmails).toEqual([]);
    expect(src).not.toMatch(/lopatina\.iryna@gmail\.com|rorum\d*@gmail\.com/i);
  });

  it.each(FORM_COMPONENTS)("%s only ever sets success state through the shared hook (no bare setSent(true))", (file) => {
    // Components read `sent` from the hook; none should define their own
    // setSent and flip it to true without a confirmed POST.
    expect(read(file)).not.toMatch(/setSent\(true\)/);
  });
});

describe("form delivery contract — no component owns the recipient", () => {
  it("the approved recipient address appears in NO source file under app/, components/ or lib/", () => {
    // A cheap scan of the dirs a client bundle is built from.
    const dirs = ["components", "app", "lib"];
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.test\.[tj]sx?$/.test(entry.name)) {
          if (readFileSync(full, "utf-8").includes("lopatina.iryna@gmail.com")) hits.push(full);
        }
      }
    };
    for (const d of dirs) walk(path.join(process.cwd(), d));
    expect(hits).toEqual([]);
  });
});
