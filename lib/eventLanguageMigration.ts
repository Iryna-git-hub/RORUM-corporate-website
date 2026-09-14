import { eventLanguageOptions, type EventLanguageOption } from "@/lib/eventLanguage";

const allowed = new Set<string>(eventLanguageOptions);

export type EventLanguageMigrationPlan =
  | { action: "migrate"; value: [EventLanguageOption] }
  | { action: "skip-array" }
  | { action: "skip-missing" }
  | { action: "skip-invalid"; value: unknown };

/** Pure migration decision: only an allowed legacy scalar becomes a singleton array. */
export function planEventLanguageMigration(value: unknown): EventLanguageMigrationPlan {
  if (Array.isArray(value)) {
    const valid = value.every((item) => typeof item === "string" && allowed.has(item)) && new Set(value).size === value.length;
    return valid ? { action: "skip-array" } : { action: "skip-invalid", value };
  }
  if (value === undefined || value === null) return { action: "skip-missing" };
  if (typeof value === "string" && allowed.has(value)) {
    return { action: "migrate", value: [value as EventLanguageOption] };
  }
  return { action: "skip-invalid", value };
}
