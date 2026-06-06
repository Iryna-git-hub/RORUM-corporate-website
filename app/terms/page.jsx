import { LegalPage } from "@/components/LegalPage";
import { companyDetails, contactDetails } from "@/lib/siteConfig";

export const metadata = {
  title: "Terms | RORUM",
  description:
    "Terms for using the RORUM website, submitting inquiries and following external ticket links.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and conditions"
      subtitle="Terms for using the RORUM website, submitting inquiries and following external ticket links."
    >
      <h2>1. Company details</h2>
      <p>
        RORUM is a Copenhagen-based business connected to events, private
        meetings, catering, event decoration and community experiences.
      </p>
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

      <h2>2. Use of this website</h2>
      <p>
        This website provides information about RORUM, events, private meetings,
        catering, event decoration and related community experiences. The
        website is intended for general information and inquiries.
      </p>

      <h2>3. Inquiries and forms</h2>
      <p>
        Forms on this website are email-only. Submitting a form sends your
        inquiry to RORUM by email. Form submissions are not stored in Sanity,
        and no inquiry database is used in this simplified setup.
      </p>

      <h2>4. Bookings and tickets</h2>
      <p>
        Submitting an inquiry does not create a confirmed booking. Details such
        as availability, pricing and final arrangements are confirmed
        separately. Event ticket purchases may be handled through Billetto,
        which is an external ticket provider.
      </p>

      <h2>5. External links and services</h2>
      <p>
        This website may link to external services, including Billetto, Google
        Maps and social media platforms. RORUM is not responsible for the
        content, policies or technical behavior of external websites.
      </p>

      <h2>6. Website content</h2>
      <p>
        All text, images, design elements and website content belong to RORUM or
        are used with permission. You may not copy, reuse or distribute website
        content without permission from RORUM.
      </p>

      <h2>7. Website availability</h2>
      <p>
        RORUM aims to keep the website available and accurate, but the website
        may change, be unavailable or contain errors from time to time.
      </p>

      <h2>8. Contact</h2>
      <p>
        For questions about these terms, contact{" "}
        <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>.
      </p>
    </LegalPage>
  );
}
