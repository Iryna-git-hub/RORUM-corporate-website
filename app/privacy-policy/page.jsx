import { Container, PageHero, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/privacy-policy");
export default function PrivacyPage() {
    return (<>
      <PageHero label="Privacy policy" title="How inquiry data is handled." text="MVP privacy copy for contact and inquiry submissions. Final compliance copy should be reviewed before launch."/>
      <Section><Container><div className="policy-content"><h2>Information collected</h2><p>Inquiry forms in this MVP collect name, email, phone number, inquiry focus and free-text messages in the browser only.</p><h2>Purpose</h2><p>Forms currently show validation and a visual success state only. They do not send emails, store submissions or connect to Sanity yet.</p><h2>Storage</h2><p>No form submission is persisted by the MVP website. Final data handling will be confirmed before backend submission is enabled.</p><h2>Contact</h2><p>For privacy questions, contact hello@rorum.dk.</p></div></Container></Section>
    </>);
}
