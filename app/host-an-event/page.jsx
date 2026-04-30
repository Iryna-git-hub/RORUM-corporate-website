import { InquiryForm } from "@/components/InquiryForm";
import { EditorialCard, PackageGrid } from "@/components/Cards";
import { Button, Card, Container, PageHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/host-an-event");
export default function HostPage() {
    return (<>
      <PageHero label="Host an event" title="Bring your gathering to RORUM." text="A supportive Copenhagen setting for facilitators, makers, chefs and community builders who want a room with warmth." image="/images/space/space-2.png" actions={<Button href="#inquiry">Send inquiry</Button>}/>
      <Section><Container><SectionHeader label="Formats" title="Suitable for small, intentional events."/><div className="grid-3">{["Workshops and masterclasses", "Supper clubs and tastings", "Talks, salons and circles"].map((item) => <EditorialCard key={item} title={item} text="Designed for intimacy, easy flow and a polished guest experience."/>)}</div></Container></Section>
      <Section tight><Container><SectionHeader label="Packages" title="Simple starting points."/><PackageGrid items={packages.host}/></Container></Section>
      <Section><Container><div className="split"><Card className="card-pad"><SectionLabel>Included</SectionLabel><ul className="clean-list"><li>Room setup guidance</li><li>Basic furniture and hosting flow</li><li>Event listing support</li><li>Optional catering and decoration add-ons</li></ul></Card><div id="inquiry"><InquiryForm type="host" title="Host an event inquiry"/></div></div></Container></Section>
    </>);
}
