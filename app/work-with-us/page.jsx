import { InquiryForm } from "@/components/InquiryForm";
import { EditorialCard } from "@/components/Cards";
import { Container, PageHero, Section, SectionHeader } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/work-with-us");
export default function WorkWithUsPage() {
    return (<>
      <PageHero label="Work with us" title="Collaborate with the RORUM ecosystem." text="For facilitators, chefs, photographers, stylists, producers and community partners interested in paid work or creative collaborations." image="/images/space/space-2.png"/>
      <Section><Container><SectionHeader label="Collaboration types" title="Bring a useful craft to the room."/><div className="grid-3">{["Facilitation", "Food and hospitality", "Creative production"].map((item) => <EditorialCard key={item} title={item} text="Share your experience, links and the kind of collaboration you imagine."/>)}</div></Container></Section>
      <section className="section-tight form-section"><Container><InquiryForm type="work" title="Work with us application"/></Container></section>
    </>);
}
