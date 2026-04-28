import { pages, siteUrl } from "@/lib/data";
export default function sitemap() {
    return pages.map((page) => ({
        url: `${siteUrl}${page.href}`,
        lastModified: new Date(),
        changeFrequency: page.href === "/" ? "weekly" : "monthly",
        priority: page.href === "/" ? 1 : 0.7
    }));
}
