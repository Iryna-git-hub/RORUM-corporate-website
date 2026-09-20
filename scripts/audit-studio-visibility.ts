/**
 * READ-ONLY. Automated checks for a page's Studio Visibility Contract
 * (lib/content-contracts/*-studio-visibility.ts) — the reverse-direction
 * companion to audit-content-contract.ts. That script proves a connected
 * field's DATA is present; this one instead checks the Studio-facing side:
 * is every field this contract expects to be visible/hidden/localized/
 * populated actually so, in the live document and in the schema itself.
 *
 * Never writes anything: `perspective: "published"`, no write token, and
 * schema files are only ever imported (read), never invoked to mutate
 * anything. Safe to run against production at any time.
 *
 * Covers, mechanically, from the 10-point automated-check list:
 *   4. every visible localized+required field has EN/DA/UK
 *   5. every visible media field representing a current image has an asset ref
 *   6. every visible icon field contains a current Lucide icon name
 *   8. every schema field (not just contract entries) has a non-empty Studio title
 *  10. every visible-unused/misleading/technical/hidden-but-required entry is
 *      printed explicitly — the report can never be "silently green"
 *
 * Checks 1/2/3/9 (hidden-callback correctness, required-validation-on-hidden-
 * fields, readOnly-on-technical-keys) need a mocked Studio `context`, not
 * live content — see tests/sanity-schema-visibility.spec.ts for those.
 *
 * Usage: npm run sanity:audit-studio-visibility -- home|about
 */
import { createClient } from "@sanity/client";
import { icons as lucideIcons } from "lucide-react";
import { homeStudioVisibilityContract } from "@/lib/content-contracts/home-studio-visibility";
import { aboutStudioVisibilityContract } from "@/lib/content-contracts/about-studio-visibility";
import type { StudioVisibilityContract, StudioVisibilityEntry } from "@/lib/content-contracts/studio-visibility-types";
import pageSectionType from "@/sanity/schemaTypes/objects/pageSection";
import contentItemType from "@/sanity/schemaTypes/objects/contentItem";
import ctaActionType from "@/sanity/schemaTypes/objects/ctaAction";
import mediaItemType from "@/sanity/schemaTypes/objects/mediaItem";
import seoType from "@/sanity/schemaTypes/objects/seo";
import pageType from "@/sanity/schemaTypes/documents/page";

const CONTRACTS: Record<string, StudioVisibilityContract> = {
  home: homeStudioVisibilityContract,
  about: aboutStudioVisibilityContract,
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: false,
  perspective: "published",
});

const REQUIRED_LANGUAGES = ["en", "da", "uk"];

// ---- check 8: every field in every schema object used by this contract has a non-empty Studio title ----
interface FieldLike { name?: string; title?: unknown; fields?: FieldLike[]; of?: { fields?: FieldLike[] }[] }
function walkFields(type: FieldLike, path: string, out: { path: string; title: unknown }[]) {
  for (const f of type.fields ?? []) {
    const p = `${path}.${f.name}`;
    out.push({ path: p, title: f.title });
    if (f.fields) walkFields(f, p, out);
    for (const member of f.of ?? []) if (member.fields) walkFields(member as FieldLike, p, out);
  }
}
function checkFieldTitles() {
  console.log("\n== Check 8: every schema field has a non-empty Studio title ==");
  const found: { path: string; title: unknown }[] = [];
  for (const [name, type] of [
    ["pageSection", pageSectionType],
    ["contentItem", contentItemType],
    ["ctaAction", ctaActionType],
    ["mediaItem", mediaItemType],
    ["seo", seoType],
    ["page", pageType],
  ] as const) {
    walkFields(type as unknown as FieldLike, name, found);
  }
  const missing = found.filter((f) => typeof f.title !== "string" || !f.title.trim());
  if (!missing.length) {
    console.log(`  OK: all ${found.length} fields across pageSection/contentItem/ctaAction/mediaItem/seo/page have a title.`);
  } else {
    console.log(`  FAIL: ${missing.length} field(s) with no Studio title:`);
    for (const m of missing) console.log(`    - ${m.path}`);
  }
}

// ---- live-data-driven checks (4, 5, 6, 7) ----
interface RawI18n { language?: string; value?: string }
interface RawSection {
  sectionKey?: string;
  label?: RawI18n[]; title?: RawI18n[]; text?: RawI18n[];
  media?: { kind?: string; alt?: RawI18n[]; image?: { asset?: { _ref?: string } }; videoFile?: { asset?: { _ref?: string } } }[];
  actions?: { actionKey?: string; href?: string; enabled?: boolean }[];
  items?: { itemKey?: string; icon?: string; href?: string }[];
}
interface RawPage { sections?: RawSection[] }

function sectionByKey(doc: RawPage | null, key: string) {
  return doc?.sections?.find((s) => s.sectionKey === key);
}

async function main() {
  const key = process.argv[2] ?? "home";
  const contract = CONTRACTS[key];
  if (!contract) {
    console.error(`No Studio visibility contract registered for "${key}". Known: ${Object.keys(CONTRACTS).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  checkFieldTitles();

  const doc = await client.fetch<RawPage | null>(
    `*[_id == $id][0]{"sections": sections[]{sectionKey, label, title, text, "media": media[]{kind, alt, image{asset}, videoFile{asset}}, "actions": actions[]{actionKey, href, enabled}, "items": items[]{itemKey, icon, href}}}`,
    { id: contract.documentId },
  );

  console.log(`\n== Check 4: EN/DA/UK completeness for every "visible-connected" localized entry ==`);
  let gapCount = 0;
  for (const e of contract.entries) {
    if (e.classification !== "visible-connected" || !e.localized || !e.requiredLanguages.length) continue;
    const section = sectionByKey(doc, e.sectionKey);
    // Only mechanically checkable for simple top-level label/title/text paths — item/action arrays are documented, not parsed here.
    const m = e.fieldPath.match(/\.(label|title|text)$/);
    if (!m || e.fieldPath.includes("[")) continue;
    const values = section?.[m[1] as "label" | "title" | "text"];
    const present = new Set((values ?? []).filter((v) => v.value?.trim()).map((v) => v.language));
    const missing = REQUIRED_LANGUAGES.filter((l) => !present.has(l));
    if (missing.length) {
      gapCount++;
      console.log(`  GAP: [${e.sectionKey}] ${e.fieldPath} missing: ${missing.join(", ")}`);
    }
  }
  console.log(gapCount ? `  ${gapCount} gap(s) found among mechanically-checkable entries.` : "  No gaps among mechanically-checkable entries.");

  console.log(`\n== Check 5/6: media asset refs and icon validity for "visible-connected" entries ==`);
  let mediaIssues = 0;
  for (const s of doc?.sections ?? []) {
    for (const m of s.media ?? []) {
      const ref = m.kind === "video" ? m.videoFile?.asset?._ref : m.image?.asset?._ref;
      if (!ref) {
        mediaIssues++;
        console.log(`  ISSUE: [${s.sectionKey}] a ${m.kind ?? "image"} media item has no asset reference.`);
      }
    }
    for (const i of s.items ?? []) {
      if (i.icon && !(i.icon in lucideIcons)) {
        mediaIssues++;
        console.log(`  ISSUE: [${s.sectionKey}] item "${i.itemKey}" has icon "${i.icon}", which is not a current lucide-react export name.`);
      }
    }
  }
  console.log(mediaIssues ? `  ${mediaIssues} issue(s) found.` : "  No missing asset references or invalid icon names found.");

  console.log(`\n== Check 7: every "visible-connected" CTA destination is non-empty and shaped like a real link ==`);
  let hrefIssues = 0;
  for (const s of doc?.sections ?? []) {
    for (const a of s.actions ?? []) {
      if (a.enabled === false) continue;
      if (!a.href || !(a.href.startsWith("/") || /^https?:\/\//.test(a.href) || a.href.startsWith("#"))) {
        hrefIssues++;
        console.log(`  ISSUE: [${s.sectionKey}] action "${a.actionKey}" href is missing or not a recognizable internal/external/anchor link: ${JSON.stringify(a.href)}`);
      }
    }
  }
  console.log(hrefIssues ? `  ${hrefIssues} issue(s) found.` : "  No issues found.");

  // ---- check 10: never silently pass a visible-unused/misleading/technical/hidden-but-required entry ----
  console.log(`\n== Check 10: classification breakdown (${contract.entries.length} entries) — every non-"visible-connected*" entry listed, never silent ==`);
  const byClass = new Map<string, StudioVisibilityEntry[]>();
  for (const e of contract.entries) {
    if (!byClass.has(e.classification)) byClass.set(e.classification, []);
    byClass.get(e.classification)!.push(e);
  }
  for (const [cls, list] of [...byClass.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cls}: ${list.length}`);
  }
  const mustSurface = ["visible-unused", "visible-misleading", "technical-visible", "hidden-but-required"];
  for (const cls of mustSurface) {
    const list = byClass.get(cls) ?? [];
    if (!list.length) continue;
    console.log(`\n  --- ${cls} (${list.length}) ---`);
    for (const e of list) console.log(`    - [${e.sectionKey}] ${e.fieldPath}`);
  }
}

main().catch((error) => {
  console.error("audit-studio-visibility failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
