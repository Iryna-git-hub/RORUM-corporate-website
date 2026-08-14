import { defineQuery } from "next-sanity";

export const faqPageQuery = defineQuery(`*[_type == "faqPage"][0]`);
