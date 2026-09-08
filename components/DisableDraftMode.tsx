"use client";

import { useIsPresentationTool } from "next-sanity/hooks";
import { DRAFT_MODE_DISABLE_ROUTE } from "@/sanity/lib/presentation";

// Small fixed badge shown on the site ONLY while Next.js Draft Mode is active
// (the layout renders it only in that branch) AND only when the page is NOT
// inside the Presentation Tool iframe — there the Studio already provides a
// perspective toggle, and a second "exit" control would be redundant/confusing.
//
// `useIsPresentationTool()` returns `null` until it has decided, then `true`
// inside Presentation or `false` in a standalone tab; render only for `false`.
export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();

  if (isPresentationTool !== false) return null;

  return (
    <a
      href={DRAFT_MODE_DISABLE_ROUTE}
      className="fixed bottom-4 left-4 z-[9999] inline-flex items-center gap-2 rounded-full bg-dark-green px-4 py-2 text-[12px] font-black uppercase tracking-[0.06em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] no-underline hover:bg-red"
      data-testid="disable-draft-mode"
    >
      Previewing drafts — exit preview
    </a>
  );
}
