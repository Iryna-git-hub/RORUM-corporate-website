import { pages, siteUrl } from "@/lib/data";
export function pageMetadata(path) {
    const page = pages.find((item) => item.href === path) ?? pages[0];
    const title = page.href === "/" ? "RORUM | Creative Event Space in Copenhagen" : `${page.title} | RORUM`;
    return {
        title,
        description: page.description,
        alternates: { canonical: `${siteUrl}${page.href}` },
        openGraph: {
            title,
            description: page.description,
            url: `${siteUrl}${page.href}`,
            siteName: "RORUM",
            images: [{ url: `${siteUrl}/images/hero.jpg`, width: 1200, height: 630, alt: "RORUM creative event space" }],
            locale: "en_US",
            type: "website"
        }
    };
}
