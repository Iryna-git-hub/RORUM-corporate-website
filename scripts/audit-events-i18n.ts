/**
 * READ-ONLY. Recursive validation-completeness audit for the Events system:
 * every `event` document (published + draft), `page-events` (published +
 * draft, if any), `eventMessages` (published + draft, if any), and the
 * legacy `eventsPage` singleton (informational only — no longer read by the
 * frontend, kept here for completeness while it's still backed up rather
 * than deleted). `perspective: "raw"` to see drafts; never mutates anything.
 *
 * Unlike audit-home-about-i18n.ts (which only ever walks the generic
 * `pageSection`/`contentItem` shape), `event`/`eventsPage`/`eventMessages`
 * use bespoke, named fields (see sanity/schemaTypes/documents/event.ts) —
 * this script has its own bespoke walker for those, and reuses the generic
 * pageSection walker only for `page-events` (which genuinely is a `page`
 * document with `sections[]`, same as Home/About).
 *
 * Distinguishes "field entirely unset" (fine — optional content) from
 * "partially populated" (a real problem: some languages present, others
 * missing, or a present language holding an empty string), same rule as
 * checkI18nField in audit-home-about-i18n.ts, so it doesn't cry wolf on
 * legitimately-empty optional fields (e.g. seo.title/description, arrival,
 * ticketButtonLabel — all optional, all fine when fully empty).
 *
 * Exact-path output format:
 *   event-abc.whatToExpect -> missing: da, uk
 *   event-abc.ticketProviderInfo.label -> missing: da
 *   page-events.sections[filters].items[dateLabel].title -> duplicate: en
 *   eventMessages.labels[dateLabel].value -> empty: uk
 *
 * Usage: npm run sanity:audit-events
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

/** Same rule as audit-home-about-i18n.ts's checkI18nField: fully unset = fine, partially populated = a real problem. */
function checkI18nField(entries: I18nEntry[] | undefined | null, pathLabel: string, out: string[]) {
  const list = (entries ?? []).filter((e) => e.language);
  if (list.length === 0) return;

  const seen = new Map<string, number>();
  for (const e of list) seen.set(e.language!, (seen.get(e.language!) ?? 0) + 1);
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  const missing = REQUIRED_LANGUAGES.filter((l) => !seen.has(l));
  const empty = list.filter((e) => REQUIRED_LANGUAGES.includes(e.language!) && !e.value?.trim()).map((e) => e.language!);

  if (duplicates.length) out.push(`${pathLabel} -> duplicate: ${duplicates.join(", ")}`);
  if (missing.length) out.push(`${pathLabel} -> missing: ${missing.join(", ")}`);
  if (empty.length) out.push(`${pathLabel} -> empty: ${empty.join(", ")}`);
}

// ---------------------------------------------------------------- event ---
interface RawShareAction {
  _key?: string;
  type?: string;
  label?: I18nEntry[];
}
interface RawEvent {
  _id: string;
  title?: I18nEntry[];
  image?: { alt?: I18nEntry[]; asset?: { _ref?: string } };
  longDescription?: I18nEntry[];
  whatToExpect?: I18nEntry[];
  arrival?: I18nEntry[];
  ticketProviderInfo?: { label?: I18nEntry[]; value?: I18nEntry[] };
  ticketButtonLabel?: I18nEntry[];
  shareSettings?: RawShareAction[];
  seo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: { alt?: I18nEntry[] } };
}

function auditEvent(doc: RawEvent): string[] {
  const out: string[] = [];

  checkI18nField(doc.title, "title", out);
  const enTitle = doc.title?.find((t) => t.language === "en" && t.value?.trim());
  if (!enTitle) out.push("title -> missing: en (required — event has no English title)");

  if (doc.image) checkI18nField(doc.image.alt, "image.alt", out);
  if (doc.image && !doc.image.asset?._ref) out.push("image -> missing asset reference");

  checkI18nField(doc.longDescription, "longDescription", out);
  checkI18nField(doc.whatToExpect, "whatToExpect", out);
  checkI18nField(doc.arrival, "arrival", out);
  checkI18nField(doc.ticketProviderInfo?.label, "ticketProviderInfo.label", out);
  checkI18nField(doc.ticketProviderInfo?.value, "ticketProviderInfo.value", out);
  checkI18nField(doc.ticketButtonLabel, "ticketButtonLabel", out);

  (doc.shareSettings ?? []).forEach((a, i) => {
    checkI18nField(a.label, `shareSettings[${a.type ?? a._key ?? `#${i}`}].label`, out);
  });

  if (doc.seo) {
    checkI18nField(doc.seo.title, "seo.title", out);
    checkI18nField(doc.seo.description, "seo.description", out);
    checkI18nField(doc.seo.ogImage?.alt, "seo.ogImage.alt", out);
  }

  return out;
}

// --------------------------------------------------------- eventMessages --
interface RawKeyedString {
  _key?: string;
  key?: string;
  value?: I18nEntry[];
}
interface RawEventMessages {
  _id: string;
  labels?: RawKeyedString[];
}

function auditEventMessages(doc: RawEventMessages): string[] {
  const out: string[] = [];
  const keys = (doc.labels ?? []).map((l) => l.key).filter((k): k is string => !!k);
  const seen = new Map<string, number>();
  for (const k of keys) seen.set(k, (seen.get(k) ?? 0) + 1);
  for (const [k, count] of seen.entries()) {
    if (count > 1) out.push(`labels[key=="${k}"] -> duplicate key (appears ${count} times)`);
  }
  for (const label of doc.labels ?? []) {
    checkI18nField(label.value, `labels[key=="${label.key ?? label._key}"].value`, out);
  }
  return out;
}

// ------------------------------------------------------------ eventsPage --
interface RawEventsPage {
  _id: string;
  title?: I18nEntry[];
  filters?: Record<string, I18nEntry[] | undefined>;
  labels?: RawKeyedString[];
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
}

function auditEventsPage(doc: RawEventsPage): string[] {
  const out: string[] = [];
  checkI18nField(doc.title, "title", out);
  for (const [key, value] of Object.entries(doc.filters ?? {})) {
    checkI18nField(value, `filters.${key}`, out);
  }
  for (const label of doc.labels ?? []) {
    checkI18nField(label.value, `labels[key=="${label.key ?? label._key}"].value`, out);
  }
  if (doc.seo) {
    checkI18nField(doc.seo.title, "seo.title", out);
    checkI18nField(doc.seo.description, "seo.description", out);
  }
  return out;
}

// ------------------------------------------------------------ page-events -
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
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: RawMedia[];
  actions?: RawAction[];
  items?: RawItem[];
}
interface RawPage {
  _id: string;
  sections?: RawSection[];
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
}

function auditPage(doc: RawPage): string[] {
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
  if (doc.seo) {
    checkI18nField(doc.seo.title, "seo.title", out);
    checkI18nField(doc.seo.description, "seo.description", out);
  }
  return out;
}

async function main() {
  let totalIssues = 0;
  let totalDocs = 0;

  const events = await client.fetch<RawEvent[]>(
    `*[_type == "event"] | order(_id asc){
      _id, title, "image": image{alt, asset}, longDescription, whatToExpect, arrival,
      ticketProviderInfo, ticketButtonLabel, shareSettings[]{_key, type, label},
      "seo": seo{title, description, "ogImage": ogImage{alt}}
    }`,
  );
  console.log(`\n===== event documents (${events.length} total, published + draft) =====`);
  for (const doc of events) {
    totalDocs++;
    const issues = auditEvent(doc);
    totalIssues += issues.length;
    if (issues.length) {
      console.log(`\n--- ${doc._id} (${issues.length} issue${issues.length === 1 ? "" : "s"}) ---`);
      for (const line of issues) console.log(`  ${doc._id}.${line}`);
    }
  }
  console.log(`\n${events.length} event document(s) checked.`);

  const pageIds = ["page-events", "drafts.page-events"];
  console.log(`\n===== page-events =====`);
  for (const id of pageIds) {
    const doc = await client.fetch<RawPage | null>(
      `*[_id == $id][0]{
        _id, "seo": seo{title, description},
        "sections": sections[]{
          _key, sectionKey, label, title, text,
          "media": media[]{_key, kind, alt, image{asset}, videoFile{asset}},
          "actions": actions[]{_key, actionKey, label, href, enabled},
          "items": items[]{_key, itemKey, icon, title, text, label, href, "image": image{alt, asset}}
        }
      }`,
      { id },
    );
    if (!doc) {
      console.log(`  ${id}: document does not exist.`);
      continue;
    }
    totalDocs++;
    const issues = auditPage(doc);
    totalIssues += issues.length;
    console.log(`  ${id} (${issues.length} issue${issues.length === 1 ? "" : "s"}):`);
    for (const line of issues) console.log(`    ${id}.${line}`);
    if (!issues.length) console.log("    No validation-relevant issues found.");
  }

  const messagesIds = ["eventMessages", "drafts.eventMessages"];
  console.log(`\n===== eventMessages =====`);
  for (const id of messagesIds) {
    const doc = await client.fetch<RawEventMessages | null>(`*[_id == $id][0]{_id, labels}`, { id });
    if (!doc) {
      console.log(`  ${id}: document does not exist.`);
      continue;
    }
    totalDocs++;
    const issues = auditEventMessages(doc);
    totalIssues += issues.length;
    console.log(`  ${id} (${issues.length} issue${issues.length === 1 ? "" : "s"}):`);
    for (const line of issues) console.log(`    ${id}.${line}`);
    if (!issues.length) console.log("    No validation-relevant issues found.");
  }

  const legacyIds = ["eventsPage", "drafts.eventsPage"];
  console.log(`\n===== eventsPage (legacy, informational only — no longer read by the frontend) =====`);
  for (const id of legacyIds) {
    const doc = await client.fetch<RawEventsPage | null>(
      `*[_id == $id][0]{_id, title, filters, labels, "seo": seo{title, description}}`,
      { id },
    );
    if (!doc) {
      console.log(`  ${id}: document does not exist.`);
      continue;
    }
    const issues = auditEventsPage(doc);
    console.log(`  ${id} (${issues.length} issue${issues.length === 1 ? "" : "s"}, NOT counted toward the blocking total — legacy/unread):`);
    for (const line of issues) console.log(`    ${id}.${line}`);
    if (!issues.length) console.log("    No validation-relevant issues found.");
  }

  console.log(`\n== Summary: ${totalIssues} total issue(s) across ${totalDocs} document(s) (event + page-events + eventMessages) ==`);
  if (totalIssues > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("audit-events-i18n failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
