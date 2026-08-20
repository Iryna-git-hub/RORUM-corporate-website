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
      // `select` reads a field off whichever document is CURRENTLY OPEN in
      // the form (confirmed by reading the plugin's own source —
      // `InternationalizedArrayProvider` calls `getSelectedValue(select,
      // deferredDocument)`, where `deferredDocument` is that document's live
      // form state) and hands it to `languages` below as `selectedValue`.
      // Every non-`event` document (Home, About, every other page/singleton)
      // simply has no `visibleLocales` field, so `selectedValue.visibleLocales`
      // is always `undefined` for them and the callback falls through to the
      // unchanged, full 3-language default — this is a single global plugin
      // registration, but it provably changes nothing for any document type
      // other than `event`.
      select: { visibleLocales: "visibleLocales" },
      languages: (_client, selectedValue) => {
        const ALL = [
          { id: "en", title: "English" },
          { id: "da", title: "Danish" },
          { id: "uk", title: "Ukrainian" },
        ];
        const selected = selectedValue.visibleLocales;
        if (Array.isArray(selected) && selected.length > 0) {
          const filtered = ALL.filter((l) => selected.includes(l.id));
          if (filtered.length) return Promise.resolve(filtered);
        }
        return Promise.resolve(ALL);
      },
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
