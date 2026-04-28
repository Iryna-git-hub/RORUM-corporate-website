import { siteUrl } from "@/lib/data";
export default function robots() {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${siteUrl}/sitemap.xml`
    };
}
