import { defineQuery } from "next-sanity";

export const eventsPageQuery = defineQuery(`*[_type == "eventsPage"][0]`);

export const allEventsQuery = defineQuery(`*[_type == "event"] | order(date asc)`);

export const eventBySlugQuery = defineQuery(`*[_type == "event" && slug.current == $slug][0]`);

export const allEventSlugsQuery = defineQuery(`*[_type == "event"].slug.current`);
