import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { getClient } from "@/sanity/lib/client";
import { isSanityConfigured } from "@/sanity/env";

// Secure Draft Mode entry point, called by the Sanity Presentation Tool.
//
// `defineEnableDraftMode` handles the full official handshake: it reads the
// one-time `sanity-preview-secret` the Presentation Tool appended to the URL,
// validates it SERVER-SIDE against the dataset using the Viewer token below
// (`@sanity/preview-url-secret`), and only then calls `draftMode().enable()`
// and redirects to the requested path. An unsigned / forged / stale request
// gets a 401 — there is deliberately no "just pass ?preview=1" bypass.
//
// The token is a server-only Viewer (read-only) token. It is attached to a
// short-lived derived client here (`withConfig`) and never to the shared
// published client, is never `NEXT_PUBLIC_*`, and is never sent to the
// browser. The Editor-role write token is never imported into the Next.js
// runtime at all — only the read token below.
const token = process.env.SANITY_API_READ_TOKEN;

const enableDraftMode =
  isSanityConfigured && token
    ? defineEnableDraftMode({
        client: getClient().withConfig({ token, useCdn: false }),
      })
    : null;

export async function GET(request: Request): Promise<Response> {
  if (!enableDraftMode) {
    return new Response(
      "Draft Mode preview is unavailable: set SANITY_API_READ_TOKEN (a server-only " +
        "Sanity Viewer token) on the server. See .env.example.",
      { status: 501 },
    );
  }
  return enableDraftMode.GET(request);
}
