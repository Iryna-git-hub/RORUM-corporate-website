/** READ-ONLY. Dumps every page's sections + which pageSection fields hold data. */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "published",
});

const has = (v: any): string => {
  if (v == null) return "";
  if (Array.isArray(v)) {
    if (v.length === 0) return "";
    // i18n array: [{language,value}]
    if (v[0] && typeof v[0] === "object" && "language" in v[0]) {
      const nonEmpty = v.filter((e: any) => (typeof e.value === "string" ? e.value.trim() : e.value));
      return nonEmpty.length ? `i18n[${nonEmpty.map((e: any) => e.language).join(",")}]` : "";
    }
    return `[${v.length}]`;
  }
  if (typeof v === "string") return v.trim() ? "str" : "";
  return "obj";
};

async function main() {
  const pages = await client.fetch<any[]>(`*[_type == "page"]{ _id, pageKey, sections }`);
  for (const page of pages.sort((a, b) => (a.pageKey || "").localeCompare(b.pageKey || ""))) {
    console.log(`\n######## ${page.pageKey}  (${page._id}) ########`);
    for (const [i, s] of (page.sections ?? []).entries()) {
      const fields = ["label", "title", "text", "media", "actions", "items", "settings"]
        .map((f) => `${f}:${has(s[f]) || "-"}`)
        .join("  ");
      console.log(`  [${i}] key=${s.sectionKey}  kind=${s.sectionKind}`);
      console.log(`      ${fields}`);
      if (Array.isArray(s.items) && s.items.length) {
        console.log(`      items itemKeys: ${s.items.map((it: any) => it.itemKey ?? "(none)").join(", ")}`);
      }
      if (Array.isArray(s.actions) && s.actions.length) {
        console.log(`      action keys: ${s.actions.map((a: any) => a.actionKey ?? "(none)").join(", ")}`);
      }
      if (Array.isArray(s.settings) && s.settings.length) {
        console.log(`      settings: ${s.settings.map((x: any) => `${x.key}=${x.value}`).join(", ")}`);
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
