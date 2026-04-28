import { Cormorant_Garamond, Quicksand } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "500", "600"], display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-body", display: "swap" });
export const metadata = {
    metadataBase: new URL("https://rorum.dk"),
    title: { default: "RORUM | Creative Event Space in Copenhagen", template: "%s" },
    description: "Warm Copenhagen event space for workshops, gatherings, catering and community-led hosting.",
    robots: { index: true, follow: true }
};
export default function RootLayout({ children }) {
    return (<html lang="en">
      <body className={`${cormorant.variable} ${quicksand.variable}`}>
        <div className="site-shell">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>);
}
