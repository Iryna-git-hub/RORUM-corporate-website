/**
 * READ-ONLY full-dataset validation audit — developer / pre-release QA.
 *
 * Thin wrapper around `sanity documents validate` (the official headless
 * runner that executes the REAL studio schema — every custom rule, every
 * `skip`-when-hidden predicate, every i18n completeness check — against every
 * published AND draft document in the live dataset). We shell out to it rather
 * than re-implement validation so this audit can never drift from what Studio
 * actually enforces on Publish.
 *
 * On top of the raw markers it:
 *   - keeps only `error`-level markers (the ones that actually block Publish;
 *     unknown-field / unknown-type warnings are printed as a separate,
 *     non-failing "backlog" section),
 *   - renders each marker as `<doc id>  <human path>  <message>`,
 *   - classifies each into missing-required / alt-or-media / hidden-required /
 *     localization / invalid-format,
 *   - separates defects that need an explicit OWNER CONTENT DECISION (listed in
 *     OWNER_DECISION_DOCS — currently the two known test/demo events) from
 *     genuine blocking defects,
 *   - exits non-zero ONLY when a genuine (non-owner-decision) blocking defect
 *     remains.
 *
 * It never writes anything. Managers do not run this during normal editing.
 *
 * Usage:
 *   npm run sanity:audit-validation
 *   npm run sanity:audit-validation -- --all      # also fail on owner-decision docs
 *   npm run sanity:audit-validation -- --warnings # include the warning backlog inline
 */
import { spawnSync } from "node:child_process";

// Documents whose validation errors need an explicit OWNER content decision
// (delete, or write real content) rather than a code/data fix — kept out of
// the failing count so this audit doesn't block on a decision only the owner
// can make. Add an id here (with a comment) when such a case appears; the two
// junk test events that used to live here were deleted 2026-09-08 (Phase A).
const OWNER_DECISION_DOCS = new Set<string>([]);

const FAIL_ON_ALL = process.argv.includes("--all");
const SHOW_WARNINGS = process.argv.includes("--warnings");

interface Marker {
  level: string;
  message: string;
  path: (string | { _key: string })[];
}
interface DocResult {
  documentId: string;
  documentType: string;
  level: string;
  markers: Marker[];
}

function humanPath(path: Marker["path"]): string {
  return path
    .map((seg) => (typeof seg === "string" ? seg : `[_key=="${seg._key}"]`))
    .join(".")
    .replace(/\.\[/g, "[");
}

function classify(message: string, path: string): string {
  if (/did not match any allowed values|must be|is not a valid|Invalid/i.test(message)) return "invalid-format / custom-rule";
  if (/\balt\b/i.test(message) || /\.alt(\b|$)/.test(path) || /media\[/.test(path)) return "alt / media";
  if (/some languages but not all|add the .* translation|alt text — this event/i.test(message)) return "localization (partial / missing translation)";
  if (message === "Required" || /is required/i.test(message)) {
    return /\.(href|label)(\b|\[)/.test(path) ? "missing-required (possibly hidden-field — verify)" : "missing-required";
  }
  return "other";
}

function canonical(id: string): string {
  return id.replace(/^drafts\./, "");
}

function run(): DocResult[] {
  const res = spawnSync(
    "npx",
    ["sanity", "documents", "validate", "--yes", "--level", "error", "--format", "json"],
    {
      encoding: "utf8",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        // `sanity documents validate` authenticates as the logged-in CLI user
        // OR via SANITY_AUTH_TOKEN. Feed it the READ-ONLY Viewer token so this
        // audit needs no interactive login and no write credential.
        SANITY_AUTH_TOKEN: process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? "",
      },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const out = (res.stdout || "").trim();
  const start = out.indexOf("[");
  if (start === -1) {
    console.error("Could not parse `sanity documents validate` output:\n", res.stdout, res.stderr);
    process.exit(2);
  }
  try {
    return JSON.parse(out.slice(start)) as DocResult[];
  } catch {
    console.error("Invalid JSON from `sanity documents validate`:\n", out.slice(start, start + 500));
    process.exit(2);
  }
}

function main() {
  console.log("== RORUM validation audit (live production dataset, published + drafts) ==\n");
  const results = run();

  const blocking: { id: string; type: string; path: string; message: string; cls: string; ownerDecision: boolean }[] = [];
  for (const doc of results) {
    for (const m of doc.markers) {
      if (m.level !== "error") continue;
      const p = humanPath(m.path);
      blocking.push({
        id: doc.documentId,
        type: doc.documentType,
        path: p,
        message: m.message,
        cls: classify(m.message, p),
        ownerDecision: OWNER_DECISION_DOCS.has(canonical(doc.documentId)),
      });
    }
  }

  const genuine = blocking.filter((b) => !b.ownerDecision);
  const ownerDecision = blocking.filter((b) => b.ownerDecision);

  const byClass = new Map<string, number>();
  for (const b of genuine) byClass.set(b.cls, (byClass.get(b.cls) ?? 0) + 1);

  if (genuine.length === 0) {
    console.log("BLOCKING VALIDATION ERRORS: 0  ✅\n");
  } else {
    console.log(`BLOCKING VALIDATION ERRORS: ${genuine.length}  ❌\n`);
    for (const b of genuine) console.log(`  [${b.cls}]  ${b.id}\n      ${b.path}\n      ${b.message}`);
    console.log("\n  By class:");
    for (const [c, n] of byClass) console.log(`    ${c}: ${n}`);
  }

  if (ownerDecision.length) {
    console.log(`\n── Owner content decision required (${ownerDecision.length} marker(s), ${new Set(ownerDecision.map((b) => canonical(b.id))).size} document(s)) ──`);
    console.log("   Test/demo events — delete them or provide real content (see OWNER_DECISION_DOCS):");
    for (const b of ownerDecision) console.log(`   ${b.id}  ${b.path}  — ${b.message}`);
  }

  if (SHOW_WARNINGS) {
    const warn = spawnSync("npx", ["sanity", "documents", "validate", "--yes", "--level", "warning", "--format", "json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, SANITY_AUTH_TOKEN: process.env.SANITY_API_READ_TOKEN ?? "" },
      maxBuffer: 64 * 1024 * 1024,
    });
    console.log("\n── Non-blocking warning backlog (unknown fields / orphaned legacy types) ──");
    console.log((warn.stdout || "").trim().slice((warn.stdout || "").indexOf("[")).slice(0, 4000));
  }

  const fail = FAIL_ON_ALL ? blocking.length > 0 : genuine.length > 0;
  process.exit(fail ? 1 : 0);
}

main();
