import { LegalPage } from "@/components/LegalPage";

export const metadata = {
    title: "Privacy Policy | RORUM",
    description: "How RORUM handles personal information submitted through this website."
};

export default function PrivacyPage() {
    return (
      <LegalPage title="Privacy Policy" subtitle="How RORUM handles personal information submitted through this website.">
            <h2>1. Company details</h2>
            <p>RORUM is a Copenhagen-based business connected to events, private meetings, catering, event decoration and community experiences.</p>
            <p><strong>RORUM</strong><br/>Address: Buermistersgade 26, 1 th, Copenhagen<br/>CVR: 00000000<br/>Contact: <a href="mailto:hello@rorum.dk">hello@rorum.dk</a><br/>Website: ro-rum.dk</p>

            <h2>2. Information you submit</h2>
            <p>When you contact RORUM through a form or email, you may provide information such as your name, email address, phone number and message details.</p>

            <h2>3. How inquiries are handled</h2>
            <p>Forms on this website are email-only. Form submissions are sent by email to RORUM. Personal inquiries are not stored in Sanity, and no inquiry database is used in this simplified setup.</p>

            <h2>4. Why we use your information</h2>
            <p>RORUM uses the information you submit to respond to your request, discuss event ideas, private meetings, catering, event decoration, collaborations or general questions.</p>

            <h2>5. Sanity Free</h2>
            <p>Sanity Free is used only for public website content. Personal inquiries and form submissions are not stored in Sanity.</p>

            <h2>6. External providers</h2>
            <p>Billetto is used as an external ticket provider for selected event ticket links. If you use Billetto, their own privacy policy and terms apply.</p>
            <p>The Contact page may include a Google Maps iframe. Google may process data when the map is loaded.</p>

            <h2>7. Analytics and tracking</h2>
            <p>Google Analytics and Meta Pixel are not intentionally used by default on this simplified website. RORUM does not intentionally use marketing tracking by default.</p>

            <h2>8. How long information is kept</h2>
            <p>Email inquiries may be kept for as long as needed to respond to your request and manage the conversation. You can ask RORUM to delete your inquiry email where possible.</p>

            <h2>9. Contact</h2>
            <p>For privacy questions, contact <a href="mailto:hello@rorum.dk">hello@rorum.dk</a>.</p>
      </LegalPage>
    );
}
