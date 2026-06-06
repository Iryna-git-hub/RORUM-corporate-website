import { LegalPage } from "@/components/LegalPage";
import { companyDetails, contactDetails } from "@/lib/siteConfig";

export const metadata = {
  title: "Cookie Policy | RORUM",
  description: "How RORUM may use cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie policy"
      subtitle="How RORUM may use cookies and similar technologies."
    >
      <h2>1. Company details</h2>
      <p>
        <strong>{companyDetails.name}</strong>
        <br />
        Address: {contactDetails.shortAddress}
        <br />
        CVR: {companyDetails.cvr}
        <br />
        Contact:{" "}
        <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
        <br />
        Website: {companyDetails.website}
      </p>

      <h2>2. What cookies are</h2>
      <p>
        Cookies are small files stored by your browser. Similar technologies may
        also be used to load website features or external services.
      </p>

      <h2>3. Necessary website cookies</h2>
      <p>
        The RORUM website may use necessary cookies or similar technologies
        required for basic website functionality, security or page behavior.
      </p>

      <h2>4. Forms</h2>
      <p>
        Forms on this website are email-only. Form submissions are not stored in
        Sanity, and no inquiry database is used in this simplified setup.
      </p>

      <h2>5. Analytics and marketing tracking</h2>
      <p>
        Google Analytics, Meta Pixel and marketing tracking cookies are not
        intentionally used by default on this simplified website.
      </p>

      <h2>6. Google Maps</h2>
      <p>
        The Contact page may include a Google Maps iframe. Google Maps may set
        cookies or process data when the map is loaded.
      </p>

      <h2>7. Billetto</h2>
      <p>
        Event ticket links may lead to Billetto, which is an external ticket
        provider. Billetto may use its own cookies or similar technologies.
      </p>

      <h2>8. Social media links</h2>
      <p>
        Social media links on this website are external links only. Social
        platforms may use their own cookies or tracking when you visit them.
      </p>

      <h2>9. Contact</h2>
      <p>
        For cookie questions, contact{" "}
        <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>.
      </p>
    </LegalPage>
  );
}
