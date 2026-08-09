import { defineCliConfig } from "sanity/cli";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export default defineCliConfig({
  api: { projectId, dataset },
  // `sanity schema extract` / `sanity typegen generate` (see package.json's
  // sanity:typegen script) read schema definitions statically — they work
  // without a live project connection, which is why schema/TypeGen tooling
  // could be fully authored and validated in this session despite no
  // project being provisioned yet (see MIGRATION_REPORT.md's Sanity
  // section).
  autoUpdates: false,
  typegen: {
    path: ["sanity/queries/**/*.ts", "sanity/lib/**/*.ts"],
    schema: "schema.json",
    generates: "sanity.types.ts",
  },
});
