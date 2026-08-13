import { defineQuery } from "next-sanity";

export const cateringMenuCategoriesQuery = defineQuery(
  `*[_type == "cateringMenuCategory"] | order(order asc)`,
);
