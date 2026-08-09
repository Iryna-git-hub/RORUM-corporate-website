import { defineQuery } from "next-sanity";

export const eventsPageQuery = defineQuery(`*[_type == "eventsPage"][0]`);

export const allEventsQuery = defineQuery(
  `*[_type == "event"] | order(date asc){ ..., "categoryTitle": category->title }`,
);

export const eventBySlugQuery = defineQuery(
  `*[_type == "event" && slug.current == $slug][0]{
    ...,
    "categoryTitle": category->title,
    relatedEvents[]->{ _id, title, slug, image, date }
  }`,
);

export const allEventSlugsQuery = defineQuery(`*[_type == "event"].slug.current`);
