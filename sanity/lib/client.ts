import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, assertConfigured } from "@/sanity/env";

let cached: SanityClient | undefined;

/**
 * The shared, token-less Sanity client for PUBLISHED content. Every frontend
 * read goes through `sanityFetch` (sanity/lib/live.ts), which wraps this
 * client and layers Draft Mode on top per-request — draft reads attach a
 * server-only Viewer token to a short-lived derived client, they never mutate
 * this singleton, and no token is ever stored here.
 *
 * Never import this into a Client Component. Throws via `assertConfigured()`
 * if called without project config — callers on the public frontend should
 * check `isSanityConfigured` first and render a fallback instead.
 */
export function getClient(): SanityClient {
  if (cached) return cached;
  const { projectId, dataset } = assertConfigured();
  cached = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    perspective: "published",
  });
  return cached;
}
