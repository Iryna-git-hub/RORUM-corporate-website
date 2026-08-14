// Typed GROQ queries for every page singleton that isn't already covered by
// events.ts/faq.ts/globals.ts. Each is a plain `*[_type == "..."][0]`
// unprojected spread — locale resolution happens in application code via
// `lib/sanity-i18n.ts`'s `pickLocalized()`, not in GROQ, so these queries
// stay identical (and cacheable) regardless of which locale is rendering.
import { defineQuery } from "next-sanity";

export const homePageQuery = defineQuery(`*[_type == "homePage"][0]`);
export const aboutPageQuery = defineQuery(`*[_type == "aboutPage"][0]`);
export const cateringPageQuery = defineQuery(`*[_type == "cateringPage"][0]`);
export const cateringMenuExamplesPageQuery = defineQuery(`*[_type == "cateringMenuExamplesPage"][0]`);
export const eventDecorationPageQuery = defineQuery(`*[_type == "eventDecorationPage"][0]`);
export const hostAtRorumPageQuery = defineQuery(`*[_type == "hostAtRorumPage"][0]`);
export const communityMembershipPageQuery = defineQuery(`*[_type == "communityMembershipPage"][0]`);
export const contactPageQuery = defineQuery(`*[_type == "contactPage"][0]`);
export const volunteerPageQuery = defineQuery(`*[_type == "volunteerPage"][0]`);
export const workWithUsPageQuery = defineQuery(`*[_type == "workWithUsPage"][0]`);

/** `pageKey` is one of `"terms" | "privacy-policy" | "cookie-policy"` — matches `legalPage-{pageKey}` document ids (see sanity/structure.ts). */
export const legalPageQuery = defineQuery(`*[_type == "legalPage" && pageKey == $pageKey][0]`);
