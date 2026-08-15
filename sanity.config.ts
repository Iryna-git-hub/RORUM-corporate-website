"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { structureTool } from "sanity/structure";
import { apiVersion, assertConfigured } from "@/sanity/env";
import { schemaTypes, SINGLETON_TYPES } from "@/sanity/schemaTypes";
import { structure } from "@/sanity/structure";

// Studio only ever runs where real project config is required — unlike the
// frontend's soft `isSanityConfigured` check, this throws immediately if
// misconfigured (there is no sensible "Studio, but disabled" state).
const { projectId, dataset } = assertConfigured();

export default defineConfig({
  name: "rorum",
  title: "RORUM",
  projectId,
  dataset,
  basePath: "/studio",

  plugins: [
    structureTool({ structure }),
    // Local development helper for testing GROQ queries — not linked from
    // the main navigation for editors, available at /studio/vision.
    visionTool({ defaultApiVersion: apiVersion }),
    internationalizedArray({
      languages: [
        { id: "en", title: "English" },
        { id: "da", title: "Danish" },
        { id: "uk", title: "Ukrainian" },
      ],
      defaultLanguages: ["en"],
      fieldTypes: ["string", "text", "bodyPortableText"],
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Singletons: no "duplicate" (would create a second, ambiguous
    // instance) and no "delete" (the frontend assumes these always exist).
    // `legalPage`/`page` are singleton *types* with several fixed-id
    // instances instead of exactly one, so the same restriction applies.
    actions: (input, context) =>
      SINGLETON_TYPES.has(context.schemaType) ||
      context.schemaType === "legalPage" ||
      context.schemaType === "page"
        ? input.filter(({ action }) => action && !["duplicate", "delete"].includes(action))
        : input,
    // New documents of a singleton type can only be created through the
    // structure tool's fixed-id items (see sanity/structure.ts) — hides
    // singleton types from the generic "+ Create" menu so an editor can't
    // accidentally create a second, orphaned instance.
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type !== "global") return prev;
      return prev.filter(
        (template) =>
          !SINGLETON_TYPES.has(template.templateId) &&
          template.templateId !== "legalPage" &&
          template.templateId !== "page",
      );
    },
  },
});
