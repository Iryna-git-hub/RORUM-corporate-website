import { Merriweather, Quicksand } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-heading", weight: ["300", "400", "700", "900"], display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"], display: "swap" });
export const metadata = {
    metadataBase: new URL("https://rorum.dk"),
    title: { default: "RORUM | Creative Event Space in Copenhagen", template: "%s" },
    description: "Warm Copenhagen event space for workshops, gatherings, catering and community-led hosting.",
    robots: { index: true, follow: true }
};
export default function RootLayout({ children }) {
    return (<html lang="en" data-scroll-behavior="smooth">
      <body className={`${merriweather.variable} ${quicksand.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>);
}
