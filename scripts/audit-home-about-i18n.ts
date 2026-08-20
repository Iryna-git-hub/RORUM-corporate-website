/**
 * READ-ONLY. Recursive validation-completeness audit for page-home and
 * page-about (published + draft, `perspective: "raw"`). Unlike
 * audit-content-contract.ts / audit-studio-visibility.ts (which only
 * mechanically check simple top-level section label/title/text paths and
 * document item/action arrays are "documented, not parsed here"), this walks
 * every validation-relevant field recursively: section label/title/text,
 * section media (asset ref + alt), actions (label + href when enabled),
 * items (title/text/label/image+alt/icon), and page-level SEO title/
 * description — reporting exact paths in the form
 * `<docId>.sections[<sectionKey>].<field> -> missing: da, uk`.
 *
 * Distinguishes "field entirely unset" (fine for optional
 * allOrNothingLanguages-validated fields — an empty array is valid) from
 * "partially populated" (a real problem: some languages present, others
 * missing, or a present language holding an empty string) so it doesn't cry
 * wolf on legitimately-empty optional content. A field reported here as
 * "missing"/"empty"/"duplicate" is one that would fail this repo's own
 * i18nValidation.ts rules if it were visible and validated.
 *
 * Never mutates anything: perspective "raw" needs a token only to see
 * drafts, but no write ever happens. Safe to run against production.
 *
 * Usage: npm run sanity:audit-home-about
 */
import { createClient } from "@sanity/client";
import { icons as lucideIcons } from "lucide-react";

const REQUIRED_LANGUAGES = ["en", "da", "uk"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: false,
  perspective: "raw",
  token: process.env.SANITY_API_WRITE_TOKEN,
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface RawMedia {
  _key?: string;
  kind?: string;
  alt?: I18nEntry[];
  image?: { asset?: { _ref?: string } };
  videoFile?: { asset?: { _ref?: string } };
}
interface RawAction {
  _key?: string;
  actionKey?: string;
  label?: I18nEntry[];
  href?: string;
  enabled?: boolean;
}
interface RawItem {
  _key?: string;
  itemKey?: string;
  icon?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  label?: I18nEntry[];
  href?: string;
  image?: { alt?: I18nEntry[]; asset?: { _ref?: string } };
}
interface RawSection {
  _key?: string;
  sectionKey?: string;
  sectionKind?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: RawMedia[];
  actions?: RawAction[];
  items?: RawItem[];
}
interface RawDoc {
  _id: string;
  sections?: RawSection[];
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
}

/**
 * Checks one i18n array against the "allOrNothing" rule every one of these
 * fields is actually validated with: an entirely empty/unset array is VALID
 * (optional content, nothing to report); duplicates, or any non-empty subset
 * of the 3 required languages, is a real problem.
 */
function checkI18nField(entries: I18nEntry[] | undefined, pathLabel: string, out: string[]) {
  const list = (entries ?? []).filter((e) => e.language);
  if (list.length === 0) return; // fully unset — valid for optional content, nothing to report

  const seen = new Map<string, number>();
  for (const e of list) seen.set(e.language!, (seen.get(e.language!) ?? 0) + 1);
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  const missing = REQUIRED_LANGUAGES.filter((l) => !seen.has(l));
  const empty = list.filter((e) => REQUIRED_LANGUAGES.includes(e.language!) && !e.value?.trim()).map((e) => e.language!);

  if (duplicates.length) out.push(`${pathLabel} -> duplicate: ${duplicates.join(", ")}`);
  if (missing.length) out.push(`${pathLabel} -> missing: ${missing.join(", ")}`);
  if (empty.length) out.push(`${pathLabel} -> empty: ${empty.join(", ")}`);
}

function auditDoc(doc: RawDoc): string[] {
  const out: string[] = [];

  for (const s of doc.sections ?? []) {
    const sKey = s.sectionKey ?? s._key ?? "(no key)";
    const sectionPath = `sections[${sKey}]`;

    checkI18nField(s.label, `${sectionPath}.label`, out);
    checkI18nField(s.title, `${sectionPath}.title`, out);
    checkI18nField(s.text, `${sectionPath}.text`, out);

    (s.media ?? []).forEach((m, i) => {
      const mediaPath = `${sectionPath}.media[${i}]`;
      checkI18nField(m.alt, `${mediaPath}.alt`, out);
      const ref = m.kind === "video" ? m.videoFile?.asset?._ref : m.image?.asset?._ref;
      if (!ref) out.push(`${mediaPath} -> missing asset reference (kind=${m.kind ?? "image"})`);
    });

    (s.actions ?? []).forEach((a) => {
      const aKey = a.actionKey ?? a._key ?? "(no key)";
      const actionPath = `${sectionPath}.actions[${aKey}]`;
      checkI18nField(a.label, `${actionPath}.label`, out);
      if (a.enabled !== false && !a.href?.trim()) out.push(`${actionPath}.href -> missing (action is enabled)`);
    });

    (s.items ?? []).forEach((it, i) => {
      const iKey = it.itemKey ?? it._key ?? `#${i}`;
      const itemPath = `${sectionPath}.items[${iKey}]`;
      checkI18nField(it.title, `${itemPath}.title`, out);
      checkI18nField(it.text, `${itemPath}.text`, out);
      checkI18nField(it.label, `${itemPath}.label`, out);
      if (it.image) checkI18nField(it.image.alt, `${itemPath}.image.alt`, out);
      if (it.icon && !(it.icon in lucideIcons)) {
        out.push(`${itemPath}.icon -> "${it.icon}" is not a current lucide-react export name`);
      }
    });
  }

  // SEO title/description are optional (no allOrNothingLanguages rule is
  // attached to them — see seo.ts's own custom English-length-only
  // validation) — reported the same way for visibility, but never treated as
  // blocking, since Studio itself doesn't block on them.
  if (doc.seo) {
    checkI18nField(doc.seo.title, "seo.title", out);
    checkI18nField(doc.seo.description, "seo.description", out);
  }

  return out;
}

async function main() {
  const ids = ["page-home", "drafts.page-home", "page-about", "drafts.page-about"];
  let totalIssues = 0;

  for (const id of ids) {
    const doc = await client.fetch<RawDoc | null>(
      `*[_id == $id][0]{
        _id,
        "seo": seo{title, description},
        "sections": sections[]{
          _key, sectionKey, sectionKind, label, title, text,
          "media": media[]{_key, kind, alt, image{asset}, videoFile{asset}},
          "actions": actions[]{_key, actionKey, label, href, enabled},
          "items": items[]{_key, itemKey, icon, title, text, label, href, "image": image{alt, asset}}
        }
      }`,
      { id },
    );

    if (!doc) {
      console.log(`\n=== ${id}: document does not exist ===`);
      continue;
    }

    const issues = auditDoc(doc);
    totalIssues += issues.length;
    console.log(`\n=== ${id} (${issues.length} issue${issues.length === 1 ? "" : "s"}) ===`);
    for (const line of issues) console.log(`  ${id}.${line}`);
    if (!issues.length) console.log("  No validation-relevant issues found.");
  }

  console.log(`\n== Summary: ${totalIssues} total issue(s) across ${ids.length} document(s) ==`);
  if (totalIssues > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("audit-home-about-i18n failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
