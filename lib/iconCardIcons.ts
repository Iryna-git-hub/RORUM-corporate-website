import { icons, CircleEllipsis, type LucideIcon } from "lucide-react";

// `name` is whatever PascalCase Lucide component name the editor picked via
// sanity/components/IconPickerInput.tsx (the full Lucide set, not a fixed
// curated list) — resolve it from Lucide's own icon map and fall back to a
// neutral placeholder if the stored name doesn't match any current icon
// (e.g. renamed/removed in a future lucide-react upgrade).
export function getIconCardIcon(name: string | undefined | null): LucideIcon {
  return (name && (icons as Record<string, LucideIcon>)[name]) || CircleEllipsis;
}
