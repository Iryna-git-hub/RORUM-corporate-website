import { Container, PageHero, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/terms");
export default function TermsPage() {
    return (<>
      <PageHero label="Terms" title="Website and inquiry terms." text="MVP terms for a demonstration website. Final legal copy should be reviewed before production launch."/>
      <Section><Container><div className="policy-content"><h2>Scope</h2><p>This website presents RORUM events, services and inquiry flows. It does not process payments or confirm bookings automatically.</p><h2>Inquiries</h2><p>Submitting a form starts a conversation only. Availability, pricing, cancellation terms and final booking details are confirmed separately.</p></div></Container></Section>
    </>);
}
