import { defineArrayMember, defineField, defineType } from "sanity";

// Singleton. The UI microcopy shared by every `event` document's card and
// detail-page template (not per-event content — every event shows the same
// "Sold Out"/"Buy Ticket"/"Date"/"Time" wording, just applied to different
// data). Mirrors why `formMessages` exists as a separate global document:
// strings reused across many documents, not authored per-document.
//
// Modeled as ONE array of {key, value} pairs (see objects/keyedString.ts)
// instead of one named field per string: Sanity's Content Lake caps the
// total number of distinct attribute paths a project's schema can register,
// and this project is close to that cap — a named field per label here
// would each count separately, while every array row reuses the same two
// shared paths regardless of how many labels exist.
export default defineType({
  name: "eventMessages",
  title: "Shared event labels",
  type: "document",
  description:
    "Text shared across every event's card and detail page (info labels, ticket button states, share messages). Each event's own title/description/etc. lives on its own document instead. / Текст, спільний для картки та сторінки кожної події (написи інформації, стани кнопки квитків, повідомлення поширення). Власні назва/опис тощо кожної події зберігаються в її документі.",
  fields: [
    defineField({
      name: "labels",
      title: "Labels",
      type: "array",
      of: [defineArrayMember({ type: "keyedString" })],
      description:
        "Each row is one shared piece of text, identified by its key. Do not rename keys or reorder rows into new keys. / Кожен рядок — один спільний напис, визначений своїм ключем. Не перейменовуйте ключі та не додавайте нові рядки з іншими ключами.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Shared event labels" };
    },
  },
});
