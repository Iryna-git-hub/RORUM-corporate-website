import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Permanent static audit: no source file may request a font weight heavier
 * than 800. This is a real file-system scan of app/ and components/ (not a
 * hardcoded "known good" file list), so it catches any *future* regression
 * — a new `font-black`, a new arbitrary Tailwind weight utility above 800,
 * a raw CSS `font-weight` above 800, or an inline `fontWeight` style above
 * 800 — wherever it's introduced.
 *
 * Background: a site-wide normalization pass (see project history) brought
 * every such occurrence down to exactly 800. Anything above 800 is always a
 * mistake going forward — there is no design rationale for >800 anywhere on
 * this site; 800 (`font-extrabold` in this project's stock Tailwind v4
 * scale) is the heaviest intentional weight in use.
 */

const ROOT = join(__dirname, "..");
const SCAN_DIRS = ["app", "components"];
const SCANNED_EXTENSIONS = [".tsx", ".ts", ".css"];
const EXCLUDED_DIR_NAMES = new Set(["node_modules", ".next", ".git"]);

/**
 * Exception allowlist — "path:line" with a required justification comment.
 * Keep this empty. Only add an entry for a genuinely unavoidable case, with
 * a comment explaining exactly why 800 cannot be used at that call site.
 */
const ALLOWED_VIOLATIONS: ReadonlySet<string> = new Set([
  // (none — zero exceptions as of the font-weight normalization pass)
]);

function isTestFile(fileName: string): boolean {
  return /\.test\.(ts|tsx)$/.test(fileName) || /\.spec\.(ts|tsx)$/.test(fileName);
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIR_NAMES.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext)) && !isTestFile(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

type Violation = {
  file: string;
  line: number;
  snippet: string;
};

// Tailwind `font-black` (900) — never an acceptable 800-equivalent.
const FONT_BLACK_RE = /font-black\b/;
// Numeric forms are parsed before comparison so the audit rejects every value
// strictly above 800 (including 801-849 and 1000+) without rejecting 800 or
// any lower custom weight such as 750, 650, or 620.
const NUMERIC_WEIGHT = "([0-9]+(?:\\.[0-9]+)?)";
const ARBITRARY_WEIGHT_RE = new RegExp(`font-\\[${NUMERIC_WEIGHT}\\]`, "g");
const CSS_WEIGHT_RE = new RegExp(`font-weight:\\s*${NUMERIC_WEIGHT}\\b`, "g");
const INLINE_WEIGHT_RE = new RegExp(`fontWeight:\\s*["']?${NUMERIC_WEIGHT}["']?\\b`, "g");

function containsNumericWeightAbove800(lineText: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  return Array.from(lineText.matchAll(pattern)).some((match) => Number(match[1]) > 800);
}

function findViolations(): Violation[] {
  const violations: Violation[] = [];

  for (const dir of SCAN_DIRS) {
    const absoluteDir = join(ROOT, dir);
    let files: string[];
    try {
      files = walk(absoluteDir);
    } catch {
      continue; // directory doesn't exist in this checkout — nothing to scan
    }

    for (const filePath of files) {
      const relPath = relative(ROOT, filePath).split("\\").join("/");
      const lines = readFileSync(filePath, "utf8").split("\n");

      lines.forEach((lineText, index) => {
        const lineNumber = index + 1;
        const matched =
          FONT_BLACK_RE.test(lineText) ||
          containsNumericWeightAbove800(lineText, ARBITRARY_WEIGHT_RE) ||
          containsNumericWeightAbove800(lineText, CSS_WEIGHT_RE) ||
          containsNumericWeightAbove800(lineText, INLINE_WEIGHT_RE);

        if (!matched) return;

        const key = `${relPath}:${lineNumber}`;
        if (ALLOWED_VIOLATIONS.has(key)) return;

        violations.push({ file: relPath, line: lineNumber, snippet: lineText.trim() });
      });
    }
  }

  return violations;
}

describe("numeric font-weight threshold", () => {
  it("accepts 800 and lower values while rejecting only values above 800", () => {
    expect(containsNumericWeightAbove800("font-weight: 800", CSS_WEIGHT_RE)).toBe(false);
    expect(containsNumericWeightAbove800("font-weight: 750", CSS_WEIGHT_RE)).toBe(false);
    expect(containsNumericWeightAbove800("font-weight: 801", CSS_WEIGHT_RE)).toBe(true);
    expect(containsNumericWeightAbove800("font-weight: 1000", CSS_WEIGHT_RE)).toBe(true);
  });
});

describe("font-weight audit — nothing above 800 anywhere in app/ or components/", () => {
  it("finds zero font-black / arbitrary-weight / CSS font-weight / inline fontWeight occurrences above 800", () => {
    const violations = findViolations();

    if (violations.length > 0) {
      const report = violations.map((v) => `  ${v.file}:${v.line} — ${v.snippet}`).join("\n");
      throw new Error(
        `Found ${violations.length} font-weight occurrence(s) above 800 (max allowed weight):\n${report}\n\n` +
          `Any weight greater than 800 must become exactly 800 (font-extrabold in this project's ` +
          `stock Tailwind v4 scale, or font-[800] where an arbitrary-value class is already the ` +
          `established pattern at that call site). If a specific case is genuinely unavoidable, add ` +
          `"path:line" to ALLOWED_VIOLATIONS in this test with a clear justification comment.`,
      );
    }

    expect(violations).toEqual([]);
  });
});
