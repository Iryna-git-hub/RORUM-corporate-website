import { defineQuery } from "next-sanity";

export const galleryCollectionQuery = defineQuery(
  `*[_type == "galleryCollection" && key.current == $key][0]`,
);
