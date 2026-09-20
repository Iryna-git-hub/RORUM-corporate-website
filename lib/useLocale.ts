"use client";

import { usePathname } from "next/navigation";
import { splitLocaleFromPath } from "@/lib/i18n";

/**
 * Current locale + locale-neutral path, derived from the browser URL.
 * Middleware's unprefixed->/en rewrite is invisible to the client, so
 * `usePathname()` always reflects what the user actually sees (unprefixed
 * for English, `/da/...`/`/uk/...` otherwise) — this is why no Context
 * provider or prop-drilling is needed for client components to know the
 * current locale.
 */
export function useLocale() {
  return splitLocaleFromPath(usePathname());
}
