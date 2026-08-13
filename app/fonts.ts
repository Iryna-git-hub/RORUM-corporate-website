import { Merriweather, Quicksand } from "next/font/google";

// Shared between app/studio/layout.tsx and app/[locale]/layout.tsx — the
// two independent root layouts this app now has (see app/[locale]/layout.tsx
// for why the root layout was split in two).
export const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
