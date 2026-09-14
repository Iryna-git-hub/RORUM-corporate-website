import { describe, expect, it } from "vitest";
import { planEventLanguageMigration } from "./eventLanguageMigration";

describe("planEventLanguageMigration", () => {
  it("converts each allowed scalar to the exact singleton array", () => {
    expect(planEventLanguageMigration("English")).toEqual({ action: "migrate", value: ["English"] });
    expect(planEventLanguageMigration("Danish")).toEqual({ action: "migrate", value: ["Danish"] });
    expect(planEventLanguageMigration("Ukrainian")).toEqual({ action: "migrate", value: ["Ukrainian"] });
  });

  it("is idempotent and never overwrites an existing array", () => {
    expect(planEventLanguageMigration(["English", "Ukrainian"])).toEqual({ action: "skip-array" });
    expect(planEventLanguageMigration([])).toEqual({ action: "skip-array" });
  });

  it("reports malformed arrays without overwriting them", () => {
    const unknown = ["English", "French"];
    const duplicate = ["Danish", "Danish"];
    expect(planEventLanguageMigration(unknown)).toEqual({ action: "skip-invalid", value: unknown });
    expect(planEventLanguageMigration(duplicate)).toEqual({ action: "skip-invalid", value: duplicate });
  });

  it("leaves missing and unexpected values untouched", () => {
    expect(planEventLanguageMigration(undefined)).toEqual({ action: "skip-missing" });
    expect(planEventLanguageMigration(null)).toEqual({ action: "skip-missing" });
    expect(planEventLanguageMigration("French")).toEqual({ action: "skip-invalid", value: "French" });
  });

  it("routes non-string/non-array garbage shapes to skip-invalid without throwing", () => {
    expect(planEventLanguageMigration(42)).toEqual({ action: "skip-invalid", value: 42 });
    expect(planEventLanguageMigration({ language: "English" })).toEqual({
      action: "skip-invalid",
      value: { language: "English" },
    });
  });
});
