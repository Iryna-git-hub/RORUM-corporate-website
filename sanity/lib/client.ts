import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, assertConfigured } from "@/sanity/env";

let cached: SanityClient | undefined;

/**
 * Server-side Sanity client for published content. Never import this into a
 * Client Component — `SANITY_API_READ_TOKEN` (when set, for private
 * datasets/draft access) must stay server-only.
 *
 * Throws via `assertConfigured()` if called without project config — callers
 * on the public frontend should check `isSanityConfigured` first and render
 * a fallback instead of calling this.
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

/**
 * Draft-aware client, for use only behind Next.js Draft Mode. Requires
 * `SANITY_API_READ_TOKEN` (server-only env var, never `NEXT_PUBLIC_*`).
 */
export function getDraftClient(): SanityClient {
  const { projectId, dataset } = assertConfigured();
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!token) {
    throw new Error(
      "SANITY_API_READ_TOKEN is required to read draft content. Set it in " +
        ".env.local (server-only — never NEXT_PUBLIC_*).",
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    perspective: "drafts",
    token,
  });
}
