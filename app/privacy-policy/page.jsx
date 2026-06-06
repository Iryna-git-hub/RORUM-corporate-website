import { LegalPage } from "@/components/LegalPage";
import { companyDetails, contactDetails } from "@/lib/siteConfig";

export const metadata = {
    title: "Privacy Policy | RORUM",
    description: "How RORUM handles personal information submitted through this website."
};

export default function PrivacyPage() {
    return (
      <LegalPage title="Privacy policy" subtitle="How RORUM handles personal information submitted through this website.">
            <h2>1. Company details</h2>
            <p>RORUM is a Copenhagen-based business connected to events, private meetings, catering, event decoration and community experiences.</p>
            <p><strong>{companyDetails.name}</strong><br/>Address: {contactDetails.shortAddress}<br/>CVR: {companyDetails.cvr}<br/>Contact: <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a><br/>Website: {companyDetails.website}</p>

            <h2>2. Information you submit</h2>
            <p>When you contact RORUM through a form or email, you may provide information such as your name, email address, phone number and message details.</p>

            <h2>3. How inquiries are handled</h2>
            <p>Forms on this website are email-only. Form submissions are sent by email to RORUM. Personal inquiries are not stored in Sanity, and no inquiry database is used in this simplified setup.</p>

            <h2>4. Why we use your information</h2>
            <p>RORUM uses the information you submit to respond to your request, discuss event ideas, private meetings, catering, event decoration, collaborations or general questions.</p>

            <h2>5. Legal basis</h2>
            <p>RORUM processes personal information to respond to inquiries, manage requests, discuss events, private meetings, catering, event decoration, collaborations and community-related communication.</p>
            <p>Depending on the request, the legal basis may be:</p>
            <ul>
                <li>taking steps before entering into an agreement</li>
                <li>RORUM&apos;s legitimate interest in responding to inquiries and managing communication</li>
                <li>consent, where you have given consent for a specific purpose</li>
            </ul>

            <h2>6. CV and collaboration inquiries</h2>
            <p>If you submit your CV, portfolio or other information through the Work with us page, RORUM uses this information to review possible collaborations, roles or future opportunities.</p>
            <p>CVs and related messages may be kept for up to 12 months, unless you ask RORUM to delete them earlier or unless a longer period is agreed.</p>

            <h2>7. Sanity Free</h2>
            <p>Sanity Free is used only for public website content. Personal inquiries and form submissions are not stored in Sanity.</p>

            <h2>8. External providers</h2>
            <p>Billetto is used as an external ticket provider for selected event ticket links. If you use Billetto, their own privacy policy and terms apply.</p>
            <p>The Contact page may include a Google Maps iframe. Google may process data when the map is loaded.</p>

            <h2>9. Analytics and tracking</h2>
            <p>Google Analytics and Meta Pixel are not intentionally used by default on this simplified website. RORUM does not intentionally use marketing tracking by default.</p>

            <h2>10. How long information is kept</h2>
            <p>Email inquiries may be kept for as long as needed to respond to your request and manage the conversation. You can ask RORUM to delete your inquiry email where possible.</p>

            <h2>11. Your rights</h2>
            <p>You may contact RORUM to request access to your personal data, correction, deletion, restriction of processing, or to object to processing where applicable.</p>
            <p>If processing is based on consent, you may withdraw your consent at any time.</p>
            <p>For privacy questions, contact <a href="mailto:rorum2025@gmail.com">rorum2025@gmail.com</a>.</p>

            <h2>12. Contact</h2>
            <p>For privacy questions, contact <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>.</p>
      </LegalPage>
    );
}
