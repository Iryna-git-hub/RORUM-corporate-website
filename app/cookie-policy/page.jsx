import { Container, PageHero, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/cookie-policy");

export default function CookiePolicyPage() {
    return (<>
      <PageHero label="Cookie policy" title="How cookies may be used." text="Plain-language cookie information for the RORUM website. A preference banner can be added in a later production phase."/>
      <Section>
        <Container>
          <div className="policy-content muted">
            <h2>What cookies are</h2>
            <p>Cookies are small files stored by your browser. They can help a website remember basic choices, understand how pages are used or support external tools.</p>
            <h2>Necessary cookies</h2>
            <p>Necessary cookies support core website functions such as security, forms and basic page behavior. These are usually required for the site to work.</p>
            <h2>Analytics cookies</h2>
            <p>Analytics cookies may help RORUM understand which pages are useful and where the website can be improved. Analytics should be configured with privacy in mind.</p>
            <h2>Marketing cookies</h2>
            <p>Marketing cookies may be used later to measure campaigns or improve communication. They should only be enabled with the correct consent setup.</p>
            <h2>External media</h2>
            <p>Some embedded media or external services may set their own cookies. RORUM should explain these clearly when those tools are added.</p>
            <h2>Changing preferences</h2>
            <p>When a cookie banner is implemented, visitors will be able to change their cookie preferences. This MVP does not include a cookie banner yet.</p>
          </div>
        </Container>
      </Section>
    </>);
}
