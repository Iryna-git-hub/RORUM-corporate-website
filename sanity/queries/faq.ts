import { defineQuery } from "next-sanity";

export const faqPageQuery = defineQuery(`*[_type == "faqPage"][0]`);

export const faqGroupsQuery = defineQuery(
  `*[_type == "faqGroup"] | order(order asc){ _id, title, order, items }`,
);
