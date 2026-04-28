import { Container, PageHero, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/privacy-policy");
export default function PrivacyPage() {
    return (<>
      <PageHero label="Privacy policy" title="How inquiry data is handled." text="MVP privacy copy for contact and inquiry submissions. Final compliance copy should be reviewed before launch."/>
      <Section><Container><div className="policy-content muted"><h2>Information collected</h2><p>Inquiry forms may collect name, email, phone, preferred date, focus area, portfolio links and free-text messages.</p><h2>Purpose</h2><p>Information is used to respond to requests about events, space booking, catering, styling, volunteering and collaborations.</p><h2>Storage</h2><p>The API route is prepared for optional Sanity submission storage when environment variables are configured. Without them, the MVP fails gracefully and does not persist submissions.</p><h2>Contact</h2><p>For privacy questions, contact hello@rorum.dk.</p></div></Container></Section>
    </>);
}
