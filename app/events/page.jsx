import { Suspense } from "react";
import { EventsClientPage } from "@/components/EventsClientPage";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/events");

// STATIC EXPORT CONSTRAINT
// This page must remain a static Server Component (○ in `next build` output)
// so it is compatible with `output: "export"` deployment to static hosting.
//
// Do NOT:
//   - add `async` to this component
//   - read `searchParams` here (that makes the route dynamic / ƒ)
//   - import `useSearchParams` or any other client hook here
//
// All URL reading (filters, pagination) happens in EventsClientPage via
// `useSearchParams()`. The full events array is passed as a prop so the
// server component never depends on the request URL.
export default function EventsPage() {
  return (
    <>
      <section className="section events-page-section">
        <Container>
          <SectionHeader title="Upcoming events at RORUM." level={1} />
          <Suspense fallback={null}>
            <EventsClientPage events={events} />
          </Suspense>
        </Container>
      </section>
      <CTASection
        variant="host"
        className="events-next-step-section"
        eyebrow="Host an event"
        title="Would like to host an event?"
        text="Send a hosting inquiry and we will explore timing and setup together."
        href="/host-an-event"
        label="Host an event"
        faqQuestion="Questions before joining or hosting an event?"
        faqLabel="Read FAQ"
      />
    </>
  );
}
