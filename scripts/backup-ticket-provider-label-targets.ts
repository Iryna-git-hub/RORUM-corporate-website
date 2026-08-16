/**
 * Writes a timestamped JSON backup of the *complete* content of every event
 * document (published and draft) that `backfill-ticket-provider-label.ts`
 * would touch — i.e. every document missing at least one of EN/DA/UK in
 * `ticketProviderInfo.label`. Run before the live migration so its effect
 * is fully reversible from this file alone.
 *
 * Uses the exact same "which languages are missing" logic as the migration
 * script, so the backup set always matches what will actually be patched.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-ticket-provider-label-targets.ts
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const LANGUAGES = ["en", "da", "uk"] as const;

interface LabelEntry {
  language?: string;
  value?: string;
}

interface EventDoc {
  _id: string;
  ticketProviderInfo?: { label?: LabelEntry[] } | null;
  [key: string]: unknown;
}

async function main() {
  const docs = await client.fetch<EventDoc[]>(`*[_type == "event"]`);

  const targets = docs.filter((doc) => {
    const existing = doc.ticketProviderInfo?.label ?? [];
    const presentLanguages = new Set(
      existing.filter((e) => e.value?.trim()).map((e) => e.language).filter(Boolean),
    );
    return LANGUAGES.some((lang) => !presentLanguages.has(lang));
  });

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `ticket-provider-label-backfill-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: "Pre-migration backup for scripts/backfill-ticket-provider-label.ts (live run)",
        documentCount: targets.length,
        documentIds: targets.map((d) => d._id),
        documents: targets,
      },
      null,
      2,
    ),
  );

  console.log(`Backed up ${targets.length} document(s) to ${filepath}`);
  console.log("IDs:", targets.map((d) => d._id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
