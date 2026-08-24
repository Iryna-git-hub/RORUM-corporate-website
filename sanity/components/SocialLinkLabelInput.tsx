"use client";

import type { ArrayOfObjectsInputProps } from "sanity";
import { AllLanguagesRows } from "@/sanity/components/AllLanguagesRows";

/**
 * Always shows EN/DA/UK for a social link's accessible label — no role/
 * document scoping needed here (unlike RoleAwareAllLanguagesInput), since
 * `socialLink.ts`'s own comment confirms this object type is used ONLY by
 * the `socialLinks` singleton; every mount of this field is already the
 * right one. Required in all 3 languages (see `label`'s
 * `requireAllLanguages()`), so a manager should never have to notice and use
 * the plugin's own "+ Add language" affordance before Publish is possible.
 */
export function SocialLinkLabelInput(props: ArrayOfObjectsInputProps) {
  return <AllLanguagesRows {...props} />;
}
