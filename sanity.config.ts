"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { apiVersion, assertConfigured } from "@/sanity/env";
import { DRAFT_MODE_ENABLE_ROUTE, PREVIEW_ORIGIN } from "@/sanity/lib/presentation";
import { resolve as presentationResolve } from "@/sanity/presentation/resolve";
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
    // Presentation: opens the real Next.js site in a side-by-side preview and
    // lets an editor see UNPUBLISHED draft changes before publishing. Clicking
    // "Preview" triggers the secure Draft Mode handshake at
    // DRAFT_MODE_ENABLE_ROUTE (app/api/draft-mode/enable). `initial` is a
    // RELATIVE "/" by default — the Studio is embedded on the same origin as
    // the site, so this is identical on localhost and in production with no
    // env var. `PREVIEW_ORIGIN` overrides it only when the Studio is opened
    // from a different origin than the site it previews (see sanity/lib/presentation.ts).
    presentationTool({
      resolve: presentationResolve,
      previewUrl: {
        initial: PREVIEW_ORIGIN ?? "/",
        ...(PREVIEW_ORIGIN ? { allowOrigins: [PREVIEW_ORIGIN] } : {}),
        previewMode: { enable: DRAFT_MODE_ENABLE_ROUTE },
      },
    }),
    // Local development helper for testing GROQ queries — not linked from
    // the main navigation for editors, available at /studio/vision.
    visionTool({ defaultApiVersion: apiVersion }),
    internationalizedArray({
      // FIXED (regression found in live Studio testing): this MUST stay a
      // static, always-complete registry. It was briefly made
      // `visibleLocales`-dependent (a `languages` callback filtering by the
      // currently-open event's selected locales) to hide inactive-language
      // rows — but the plugin's OWN array validation (not just the row-
      // rendering logic) resolves its "is this a recognized language" check
      // from this exact same global config (`array_default()`'s
      // `options.languages`, read via `getLanguagesFieldOption`). Filtering
      // it meant that the moment a locale was deselected, the plugin itself
      // started treating every EXISTING stored entry for that locale as an
      // unrecognized language key ("Array item keys must be valid languages
      // registered to the field type") — turning every internationalized-
      // array field with stored data in that locale red (confirmed: this
      // broke `event.shareSettings[].label`, not just the fields
      // EventLocaleAwareInput wraps) and disabling Publish, even though the
      // data itself was never touched or lost.
      //
      // Row-level hiding for deselected-but-still-stored locales is instead
      // handled entirely by sanity/components/EventLocaleAwareInput.tsx,
      // which filters `members` (what renders) without touching this
      // registry or the plugin's own value/validation resolution at all —
      // the correct separation: "what's a valid language" (global, static,
      // always all 3) vs "what's currently visible for this event" (per-
      // field, per-document, additive-only).
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
    //
    // `galleryCollection` / `faqGroup` / `cateringMenuCategory` are superseded
    // document types — galleries, FAQ categories and menu categories are all
    // `pageSection`s on the relevant `page` document now (0 live docs of any
    // of these types, none referenced anywhere). They stay registered so any
    // stray legacy document still renders with a real schema, but a manager
    // should never be offered them as something new to create. The type
    // definitions themselves are a separate dead-code cleanup.
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type !== "global") return prev;
      const HIDDEN_FROM_CREATE = new Set(["legalPage", "page", "galleryCollection", "faqGroup", "cateringMenuCategory"]);
      return prev.filter(
        (template) => !SINGLETON_TYPES.has(template.templateId) && !HIDDEN_FROM_CREATE.has(template.templateId),
      );
    },
  },
});
