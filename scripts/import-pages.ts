/**
 * Idempotent import of every page-level Sanity document that
 * `scripts/import-content.ts` didn't cover (that script only ever handled
 * `event`/`eventCategory`/`faqGroup`/`cateringMenuCategory` and the
 * `packages` field of `hostAtRorumPage`). This script transcribes the
 * English copy that's currently hardcoded inline in each `app/(site)/*`
 * page component into the matching Sanity singleton, so every page has a
 * real Sanity document to translate (see `scripts/import-translations.ts`)
 * and later read from (see the locale-routing work in MIGRATION_REPORT.md).
 *
 * Scope, deliberately: only fields that exist in the already-built schema.
 * A few small pieces of real page copy have no matching schema field yet
 * (the homepage's `ServicesTeaserSection`/`CommunityTeaserSection` content,
 * and a couple of form-internal default strings) — these are left as
 * static/English-only in the frontend for this pass and are called out in
 * MIGRATION_REPORT.md, not silently dropped. No image assets are uploaded
 * here: `imageWithAlt` fields are left unset everywhere, so every image
 * keeps rendering from its existing static `/public` path (see the
 * localization report for the reasoning).
 *
 * Usage:
 *   npm run sanity:import-pages:dry-run
 *   npm run sanity:import-pages
 *
 * Idempotency: fixed, deterministic ids (matching `sanity/structure.ts`'s
 * singleton ids and `legalPage-{pageKey}` convention) + `createIfNotExists`
 * for the page singletons that don't exist yet, and a scoped `.patch().set()`
 * for `hostAtRorumPage` (which already exists from `import-content.ts` with
 * only its `packages` field set) — never overwrites an existing document or
 * field an editor may have since changed.
 */
import { createClient } from "@sanity/client";
import {
  bullet,
  bulletBlock,
  bulletParagraph,
  block,
  en,
  enBody,
  enText,
} from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

type Doc = Record<string, unknown> & { _id: string; _type: string };

function cta(label: string, href: string) {
  return { label: en(label), href };
}

function iconCard(icon: string, title: string, text?: string) {
  return { _type: "iconCard", icon, title: en(title), ...(text ? { text: enText(text) } : {}) };
}

function titledText(key: string, title: string, text: string) {
  return { _key: key, _type: "titledText", title: en(title), text: enText(text) };
}

// ---------------------------------------------------------------------------
// homePage
// ---------------------------------------------------------------------------

const homePage: Doc = {
  _id: "homePage",
  _type: "homePage",
  heroLabel: en("Copenhagen event space"),
  heroTitle: en("A Copenhagen space for meaningful gatherings"),
  heroText: enText(
    "Attend events or host your own gathering in a calm, thoughtfully prepared space with support from the RORUM team.",
  ),
  heroTrustItems: [
    bullet("t0", "Up to 12 guests"),
    bullet("t1", "Central Copenhagen"),
    bullet("t2", "On-site support"),
    bullet("t3", "Catering & decoration available"),
  ],
  heroVideoUrl: "/videos/home-hero.mp4",
  heroPrimaryCta: cta("Host at RORUM", "/host-at-rorum"),
  heroSecondaryCta: cta("Attend Events", "/events"),
  quickPaths: [
    {
      _key: "qp0",
      title: en("Attend Events"),
      text: enText(
        "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
      ),
      href: "/events",
    },
    {
      _key: "qp1",
      title: en("Host at RORUM"),
      text: enText(
        "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
      ),
      href: "/host-at-rorum",
    },
    {
      _key: "qp2",
      title: en("Catering"),
      text: enText(
        "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
      ),
      href: "/catering",
    },
    {
      _key: "qp3",
      title: en("Event Decoration"),
      text: enText(
        "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
      ),
      href: "/event-decoration",
    },
  ],
  eventsLabel: en("What's on"),
  eventsTitle: en("Upcoming events at RORUM"),
  attendEventsFeature: {
    eyebrow: en("Meaningful Gatherings"),
    title: en("Attend Events"),
    intro: enText("Join meaningful gatherings at RORUM."),
    description: enText(
      "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
    ),
    features: [
      bullet("f0", "Small-group experiences"),
      bullet("f1", "Up to 12 participants"),
      bullet("f2", "Central Copenhagen"),
      bullet("f3", "Community-focused"),
    ],
    cta: cta("Attend Events", "/events"),
    reversed: false,
  },
  hostAtRorumFeature: {
    eyebrow: en("Your Gathering"),
    title: en("Host at RORUM"),
    intro: enText("Host your gathering at RORUM."),
    description: enText(
      "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
    ),
    features: [
      bullet("f0", "Up to 12 guests"),
      bullet("f1", "Flexible room setup"),
      bullet("f2", "Central Copenhagen"),
      bullet("f3", "On-site support"),
    ],
    cta: cta("Host at RORUM", "/host-at-rorum"),
    reversed: true,
  },
  closingSection: {
    eyebrow: en("Not sure where to start?"),
    title: en("Let's shape your idea together"),
    text: enText(
      "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
    ),
    cta: cta("Let's talk", "/contact"),
    faqQuestion: en("Have questions?"),
    faqLabel: en("Read our FAQs"),
    links: [
      { _key: "l0", href: "/events", label: en("Attend Events") },
      { _key: "l1", href: "/host-at-rorum", label: en("Host at RORUM") },
      { _key: "l2", href: "/catering", label: en("Catering") },
      { _key: "l3", href: "/event-decoration", label: en("Event decoration") },
    ],
  },
  seo: {
    title: en("RORUM | Creative Event Space in Copenhagen"),
    description: enText(
      "RORUM is a warm Copenhagen space for meaningful events, hosted gatherings and community experiences.",
    ),
  },
};

// ---------------------------------------------------------------------------
// aboutPage
// ---------------------------------------------------------------------------

const aboutPage: Doc = {
  _id: "aboutPage",
  _type: "aboutPage",
  heroLabel: en("About"),
  heroTitle: en("About RORUM"),
  heroLead: enText(
    "RORUM is a curated creative and event space in central Copenhagen, designed for small teams, founders, facilitators, hosts and community-minded guests who want gatherings to feel warm, clear and easy to be present in.",
  ),
  statementTitle: en("Services"),
  statementText: enText(
    "Our catering and decoration services are available off-site and can be brought to your chosen location.",
  ),
  values: [
    titledText(
      "v0",
      "Community",
      "RORUM is also shaped by members, collaborators and people who want to support thoughtful local gatherings.",
    ),
  ],
  pillarsLabel: en("Experience principles"),
  pillars: [
    titledText(
      "p0",
      "Calm first",
      "The space should help guests arrive, settle and understand where they are.",
    ),
    titledText(
      "p1",
      "Useful hospitality",
      "Coffee, water, food, layout and timing are treated as part of the experience.",
    ),
    titledText(
      "p2",
      "Flexible but not blank",
      "Tables, seating, screen, Wi-Fi and styling options give hosts a clear starting point.",
    ),
    titledText(
      "p3",
      "Personal without noise",
      "The space has character, but leaves enough space for each format to feel like its own.",
    ),
  ],
  locationTitle: en("Thoughtful and practical"),
  locationText: enText(
    "These principles shape the way RORUM approaches meetings, hosted events, catering, decoration and community collaborations.",
  ),
  seo: {
    title: en("About"),
    description: enText(
      "Learn about RORUM, a small curated ground-floor creative and event space in Copenhagen.",
    ),
  },
};

// ---------------------------------------------------------------------------
// cateringPage
// ---------------------------------------------------------------------------

const cateringPage: Doc = {
  _id: "cateringPage",
  _type: "cateringPage",
  hero: {
    label: en("Catering"),
    title: en("Catering"),
    text: enText(
      "Traditional Ukrainian cuisine in harmonious combination with modern European gastronomy. We create not just dishes, but an atmosphere where taste, aesthetics, and service work together.",
    ),
    primaryCta: cta("Request catering", "#catering-inquiry"),
  },
  menuFormatsTitle: en("Menu Formats"),
  menuFormats: [
    {
      _key: "mf0",
      title: en("Private dinner menu"),
      description: enText(
        "A seated dinner with seasonal starters, main courses, sides, and desserts.",
      ),
    },
    {
      _key: "mf1",
      title: en("Reception-style menu"),
      description: enText("Elegant light dishes, small bites, and shareable plates."),
    },
    {
      _key: "mf2",
      title: en("Business meeting menu"),
      description: enText(
        "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
      ),
    },
  ],
  formats: [
    iconCard(
      "ChefHat",
      "Ukrainian cuisine",
      "Traditional Ukrainian cuisine in harmony with modern European gastronomy, created with attention to taste, presentation and detail.",
    ),
    iconCard(
      "HandPlatter",
      "Finger food & buffet",
      "Elegant small bites, light buffet solutions and beautifully served dishes for receptions, celebrations and business events.",
    ),
    iconCard(
      "ClipboardList",
      "Individual menu",
      "Each menu is tailored to your event format, number of guests, preferences and desired atmosphere.",
    ),
    iconCard(
      "CookingPot",
      "On-site cooking",
      "If needed, we can organize cooking directly at your location for a fresh, seamless and memorable experience.",
    ),
    iconCard(
      "ConciergeBell",
      "Full event support",
      "Our professional team can support the event with preparation, serving and attentive service throughout the occasion.",
    ),
    iconCard(
      "Flame",
      "Grill parties",
      "Lively grill experiences for warm, informal gatherings where food, conversation and atmosphere come together.",
    ),
  ],
  suitableForLabel: en("Suitable for:"),
  suitableFor: [
    iconCard("CalendarCheck", "Host at RORUM"),
    iconCard("Presentation", "Workshops"),
    iconCard("Handshake", "Community events"),
    iconCard("Lightbulb", "Creative sessions"),
    iconCard("BriefcaseBusiness", "Founder sessions"),
    iconCard("Cake", "Birthdays"),
    iconCard("Gem", "Weddings"),
    iconCard("Landmark", "Diplomatic meetings"),
    iconCard("Building2", "Business meetings"),
    iconCard("Users", "Conferences"),
    iconCard("PartyPopper", "External events"),
    iconCard("CircleEllipsis", "And more"),
  ],
  philosophyTitle: en("What we offer"),
  philosophyText: enText(
    "We create catering for different types of events - from elegant finger food and light buffet solutions to full menus for family celebrations, corporate events and official occasions. Each menu is developed individually, combining authentic Ukrainian recipes with a modern European approach, thoughtful presentation and attentive service.",
  ),
  tailoredNote: titledText(
    "tn",
    "Tailored upon request",
    "Every catering concept is created individually based on your event, location, guest count and wishes.",
  ),
  stepsTitle: en("3-step setup"),
  steps: [
    titledText("s0", "Tell us about your event", "Share the date, location, guest count and format."),
    titledText(
      "s1",
      "We suggest the right setup",
      "We help match the catering format to the rhythm and atmosphere of your event.",
    ),
    titledText(
      "s2",
      "We prepare the experience",
      "Food and presentation are arranged with care so your guests feel welcomed.",
    ),
  ],
  inquiryIntro: enText(
    "Tell us about your event and we will help you find the right catering format.",
  ),
  seo: {
    title: en("Catering"),
    description: enText(
      "Warm Scandinavian catering for workshops, meetings and intimate events.",
    ),
  },
};

// ---------------------------------------------------------------------------
// eventDecorationPage
// ---------------------------------------------------------------------------

const eventDecorationPage: Doc = {
  _id: "eventDecorationPage",
  _type: "eventDecorationPage",
  hero: {
    label: en("Event decoration"),
    title: en("Event decoration"),
    text: enText(
      "Flowers, table styling, candles, balloon decor and visual details for warm, memorable events at RORUM or selected external locations.",
    ),
    primaryCta: cta("Request decoration", "#decoration-inquiry"),
  },
  stylingLabel: en("Decoration"),
  stylingTitle: en("What we style"),
  stylingIntro: [
    bulletParagraph(
      "si0",
      "We create decoration concepts that bring warmth, beauty and personality to your event.",
    ),
    bulletParagraph(
      "si1",
      "Our styling can include table settings, seasonal flowers, candles, balloon accents, textiles, decorative objects, photo moments and personal details. Each element is selected to work together as one cohesive atmosphere.",
    ),
  ],
  formats: [
    iconCard(
      "UtensilsCrossed",
      "Table styling",
      "Elegant table setups with flowers, candles, place details and carefully selected visual accents.",
    ),
    iconCard(
      "Flower",
      "Florals",
      "Seasonal floral arrangements designed around your event mood, space and color palette.",
    ),
    iconCard(
      "Balloon",
      "Balloon accents",
      "Soft and elegant balloon decor for entrances, celebration corners, photo zones and backdrops.",
    ),
    iconCard(
      "Flame",
      "Atmosphere details",
      "Candles, textures, fabrics, signs and decorative objects that make the space feel warm and complete.",
    ),
    iconCard(
      "BadgeCheck",
      "Personal touches",
      "Custom details for birthdays, weddings, dinners, workshops, private celebrations and meaningful moments.",
    ),
  ],
  suitableForLabel: en("Suitable for:"),
  suitableFor: [
    iconCard("CalendarCheck", "Private events"),
    iconCard("Gem", "Weddings"),
    iconCard("PartyPopper", "Birthdays"),
    iconCard("Lightbulb", "Workshops"),
    iconCard("UtensilsCrossed", "Dinner tables"),
    iconCard("Sparkles", "Photo corners"),
    iconCard("Flower2", "Seasonal moments"),
    iconCard("CircleEllipsis", "And more"),
  ],
  tailoredNote: titledText(
    "tn",
    "Tailored upon request",
    "We create each setup individually according to your event format, location and wishes.",
  ),
  stepsTitle: en("3-step setup"),
  steps: [
    titledText(
      "s0",
      "Share the occasion",
      "Tell us about the event format, date, guests and atmosphere you want.",
    ),
    titledText(
      "s1",
      "We suggest the visual direction",
      "We match decoration details to the room, table and rhythm of the event.",
    ),
    titledText(
      "s2",
      "We prepare the setup",
      "The decorative layer is arranged with care before guests arrive.",
    ),
  ],
  inquiryIntro: enText(
    "Tell us what you are planning and we will suggest the right visual setup for your event.",
  ),
  seo: {
    title: en("Space Decoration"),
    description: enText(
      "Thoughtful table settings, florals and atmosphere styling for RORUM events.",
    ),
  },
};

// ---------------------------------------------------------------------------
// hostAtRorumPage — PATCH only (packages already exists from import-content.ts)
// ---------------------------------------------------------------------------

const hostAtRorumPageFields: Record<string, unknown> = {
  hero: {
    label: en("Host at RORUM"),
    title: en("Host Your Gathering at RORUM"),
    text: enText(
      "RORUM is a small, curated space in central Copenhagen, designed for meetings, workshops, and private events for up to 12 guests. Ideal for small teams, founders, and curated gatherings. We offer a calm and well-organized setting, with support before and during your event.",
    ),
    primaryCta: cta("Apply to Host", "#request-private-meeting"),
    secondaryCta: cta("View Packages & Pricing", "#meeting-packages"),
  },
  sessionLabel: en("Session details"),
  sessionTitle: en("Each session includes:"),
  includedItems: [
    bullet("i0", "Use of the space"),
    bullet("i1", "Coffee, tea and water"),
    bullet("i2", "On-site support"),
    bullet("i3", "Simple and thoughtful interior setup"),
    bullet("i4", "Screen"),
    bullet("i5", "Wi-Fi"),
    bullet("i6", "Tables and chairs"),
  ],
  optionalLabel: en("Optional"),
  optionalItems: [bullet("o0", "Catering"), bullet("o1", "Customized food options")],
  packagesLabel: en("Packages"),
  packagesTitle: en("Hosting Packages"),
  packagesIntro: enText(
    "Every event has its own atmosphere and unique requirements, which is why the packages below are simply examples of our most popular formats. Looking for something different? We would be happy to tailor the space and arrangements to your needs.",
  ),
  cancellationTitle: en("Cancellation policy:"),
  cancellationItems: [
    bullet("c0", "Free cancellation up to 5 working days before"),
    bullet("c1", "50% charge if cancelled within 24 hours before the event"),
    bullet("c2", "100% charge if cancelled less than 24 hours before"),
  ],
  stepsTitle: en("3-step setup"),
  steps: [
    titledText(
      "s0",
      "Tell us about your gathering",
      "Tell us the format, guest count, timing and what kind of atmosphere you need.",
    ),
    titledText(
      "s1",
      "We prepare the room",
      "We align tables, chairs, screen, Wi-Fi and simple hosting details before you arrive.",
    ),
    titledText(
      "s2",
      "Arrive and focus",
      "The space is ready for your workshop, gathering, or private session, with on-site support.",
    ),
  ],
  inquiryIntro: enText(
    "Tell us the format, guest count, timing and what kind of atmosphere you need, and we will help you find the right package.",
  ),
  seo: {
    title: en("Host at RORUM"),
    description: enText("Host workshops, meetings and intimate gatherings at RORUM."),
  },
};

// ---------------------------------------------------------------------------
// communityMembershipPage
// ---------------------------------------------------------------------------

const communityMembershipPage: Doc = {
  _id: "communityMembershipPage",
  _type: "communityMembershipPage",
  heroLabel: en("WECODA Community"),
  heroTitle: en("Join a Community That Helps Women Move Forward"),
  heroIntro: [
    bulletParagraph(
      "hi0",
      "WECODA: Women Entrepreneurs Commerce & Development Association.",
    ),
    bulletParagraph(
      "hi1",
      "Connect with women entrepreneurs, professionals, and changemakers. Exchange experience, discover new opportunities, and grow with the support of an international community.",
    ),
  ],
  supportCta: cta("Support WECODA", "#support-wecoda"),
  externalSiteCta: cta("WECODA website", "https://wecoda.org"),
  priceStripText: en("Annual membership price: 250 DKK"),
  introColumns: [
    {
      _key: "ic0",
      _type: "titledText",
      text: enText(
        "WECODA is an international community where ambitious women entrepreneurs, professionals, and leaders connect to exchange knowledge, build meaningful partnerships, and grow together. What makes WECODA unique is our signature concept of Diplomatic Gastronomy—a distinctive approach that brings together business, culture, and international dialogue. We believe that genuine relationships are built through shared experiences, creating an environment where conversations become collaborations and ideas evolve into lasting partnerships.",
      ),
    },
    {
      _key: "ic1",
      _type: "titledText",
      text: enText(
        "Through curated networking events, business breakfasts, international forums, educational programs, and cultural initiatives, we create opportunities that extend far beyond traditional networking. Become part of a community where business meets purpose, relationships inspire growth, and every connection opens the door to new possibilities.",
      ),
    },
  ],
  benefitsTitle: en("What You Gain as a Member"),
  benefits: [
    bullet("b0", "Event Access — Free or discounted participation in WECODA events."),
    bullet(
      "b1",
      "Training and Learning — Access to training sessions, educational programmes, and masterclasses.",
    ),
    bullet(
      "b2",
      "International Networking — International business networking and new partnerships.",
    ),
    bullet(
      "b3",
      "International Opportunities — Participation in international projects, forums, and business missions.",
    ),
    bullet(
      "b4",
      "Funding Information — Information about grants, accelerator programmes, and funding opportunities.",
    ),
    bullet("b5", "Mentoring and Expert Advice — Mentoring support and consultations with experts."),
    bullet(
      "b6",
      "Visibility for Your Work — Opportunities to present your business, projects, and professional experience.",
    ),
    bullet(
      "b7",
      "Diplomatic and Cultural Events — Participation in unique WECODA events focused on diplomatic gastronomy and cultural diplomacy.",
    ),
    bullet(
      "b8",
      "A Supportive Community — A community of active women who support one another, exchange experience, and create new opportunities.",
    ),
  ],
  applicationTitle: en("Application Process"),
  applicationSteps: [
    titledText("as0", "Submit your application", "Complete the WECODA membership application form."),
    titledText("as1", "Pay the annual membership fee", "The annual membership fee is 250 DKK."),
    titledText("as2", "Board review", "The WECODA Board reviews your application and payment."),
    titledText(
      "as3",
      "Membership confirmation",
      "You will receive confirmation after your membership has been approved.",
    ),
  ],
  applicationCta: cta("Become a Member", "https://forms.gle/MpadaPTyL8YCHtAa9"),
  seo: {
    title: en("Community Membership"),
    description: enText(
      "Join the RORUM community for events, collaboration and practical creative support in Copenhagen.",
    ),
  },
};

// ---------------------------------------------------------------------------
// contactPage
// ---------------------------------------------------------------------------

const contactPage: Doc = {
  _id: "contactPage",
  _type: "contactPage",
  heroLabel: en("Contact"),
  introTitle: en("We are here for you"),
  introText: enText(
    "For more information about events, hosting a gathering at RORUM, collaborations, catering, event decoration, or practical details, please feel free to get in touch with us.",
  ),
  followUsTitle: en("Follow us"),
  formTitle: en("We want to hear from you"),
  successMessage: enText("Thank you. Your message is ready for the RORUM team."),
  seo: {
    title: en("Contact"),
    description: enText(
      "Contact RORUM for event inquiries, space booking and collaborations in Copenhagen.",
    ),
  },
};

// ---------------------------------------------------------------------------
// eventsPage
// ---------------------------------------------------------------------------

const eventsPage: Doc = {
  _id: "eventsPage",
  _type: "eventsPage",
  title: en("Upcoming events at RORUM"),
  closingSection: {
    eyebrow: en("Host at RORUM"),
    title: en("Would you like to host at RORUM?"),
    text: enText(
      "Explore our space for workshops, meetings, and community gatherings of up to 12 guests.",
    ),
    cta: cta("Host at RORUM", "/host-at-rorum"),
    faqQuestion: en("Have questions?"),
    faqLabel: en("Read our FAQs"),
  },
  seo: {
    title: en("Events"),
    description: enText(
      "Discover upcoming RORUM events, workshops and intimate community gatherings.",
    ),
  },
};

// ---------------------------------------------------------------------------
// faqPage
// ---------------------------------------------------------------------------

const faqPage: Doc = {
  _id: "faqPage",
  _type: "faqPage",
  heroLabel: en("FAQ"),
  heroTitle: en("Frequently asked questions"),
  seo: {
    title: en("FAQ"),
    description: enText(
      "Answers about RORUM events, hosting, booking, services and volunteering.",
    ),
  },
};

// ---------------------------------------------------------------------------
// volunteerPage
// ---------------------------------------------------------------------------

const volunteerPage: Doc = {
  _id: "volunteerPage",
  _type: "volunteerPage",
  heroLabel: en("Volunteer with us"),
  heroTitle: en("Volunteer at RORUM"),
  heroParagraphs: [
    bulletParagraph(
      "hp0",
      "It often starts with something simple — a conversation, a shared idea, a moment that brings people together.",
    ),
    bulletParagraph(
      "hp1",
      "At RORUM, these moments turn into experiences. And experiences turn into community.",
    ),
    bulletParagraph(
      "hp2",
      "Volunteering here is more than helping at events. It's becoming part of a space where people create, connect, and grow side by side.",
    ),
    bulletParagraph(
      "hp3",
      "You might be welcoming guests, supporting a workshop, or simply helping shape the atmosphere — but along the way, you become part of something real.",
    ),
  ],
  highlights: [
    iconCard("Users", "A place where people know each other."),
    iconCard("HandHeart", "Support each other."),
    iconCard("Rocket", "Build something together."),
  ],
  closingParagraphs: [
    bulletParagraph(
      "cp0",
      "In return, you gain experience, meet inspiring people, and become part of an international creative community in the heart of Copenhagen.",
    ),
    bulletParagraph(
      "cp1",
      "If you feel a spark reading this — it probably means you belong here.",
    ),
    bulletParagraph("cp2", "Apply to volunteer and join RORUM."),
  ],
  applyCta: cta("Apply to volunteer", "#apply"),
  seo: {
    title: en("Volunteer With Us"),
    description: enText(
      "Join the RORUM community as a volunteer for events and hospitality moments.",
    ),
  },
};

// ---------------------------------------------------------------------------
// workWithUsPage
// ---------------------------------------------------------------------------

const workWithUsPage: Doc = {
  _id: "workWithUsPage",
  _type: "workWithUsPage",
  heroLabel: en("Work with us"),
  heroTitle: en("Work with us"),
  heroParagraphs: [
    bulletParagraph(
      "hp0",
      "If our work resonates with you, we would be happy to get to know you.",
    ),
    bulletParagraph(
      "hp1",
      "Please feel free to send us your CV, and if any opportunities arise within our projects or activities that match your experience and interests, we will be sure to get in touch.",
    ),
    bulletParagraph(
      "hp2",
      "We believe that opportunities grow through people — and sometimes the right environment can open doors you didn't even know existed.",
    ),
    bulletParagraph(
      "hp3",
      "Maybe it leads to a collaboration. Maybe to a role. Or maybe to a connection that brings something unexpected.",
    ),
    bulletParagraph("hp4", "Either way — it starts here."),
  ],
  cvUploadCta: en("Send your CV"),
  seo: {
    title: en("Work With Us"),
    description: enText(
      "Collaborate with RORUM as a facilitator, chef, creative partner or event professional.",
    ),
  },
};

// ---------------------------------------------------------------------------
// legalPage-terms / legalPage-privacy-policy / legalPage-cookie-policy
// ---------------------------------------------------------------------------

const legalPageTerms: Doc = {
  _id: "legalPage-terms",
  _type: "legalPage",
  pageKey: "terms",
  title: en("Terms and conditions"),
  subtitle: enText(
    "Terms for using the RORUM website, submitting inquiries and following external ticket links.",
  ),
  body: enBody([
    block("2. Use of this website", "h2"),
    block(
      "This website provides information about RORUM, events, hosted gatherings, catering, event decoration and related community experiences. The website is intended for general information and inquiries.",
    ),
    block("3. Inquiries and forms", "h2"),
    block(
      "Forms on this website are email-only. Submitting a form sends your inquiry to RORUM by email. Form submissions are not stored in Sanity, and no inquiry database is used in this simplified setup.",
    ),
    block("4. Bookings and tickets", "h2"),
    block(
      "Submitting an inquiry does not create a confirmed booking. Details such as availability, pricing and final arrangements are confirmed separately. Event ticket purchases may be handled through Billetto, which is an external ticket provider.",
    ),
    block("5. External links and services", "h2"),
    block(
      "This website may link to external services, including Billetto, Google Maps and social media platforms. RORUM is not responsible for the content, policies or technical behavior of external websites.",
    ),
    block("6. Website content", "h2"),
    block(
      "All text, images, design elements and website content belong to RORUM or are used with permission. You may not copy, reuse or distribute website content without permission from RORUM.",
    ),
    block("7. Website availability", "h2"),
    block(
      "RORUM aims to keep the website available and accurate, but the website may change, be unavailable or contain errors from time to time.",
    ),
    block("8. Contact", "h2"),
    block("For questions about these terms, contact hello@rorum.dk."),
  ]),
  seo: { title: en("Terms"), description: enText("Terms for using the RORUM MVP website and booking inquiries.") },
};

const legalPagePrivacy: Doc = {
  _id: "legalPage-privacy-policy",
  _type: "legalPage",
  pageKey: "privacy-policy",
  title: en("Privacy policy"),
  subtitle: enText("How RORUM handles personal information submitted through this website."),
  body: enBody([
    block("2. Information you submit", "h2"),
    block(
      "When you contact RORUM through a form or email, you may provide information such as your name, email address, phone number and message details.",
    ),
    block("3. Why we use your information", "h2"),
    block(
      "RORUM uses the information you submit to respond to your request, discuss event ideas, hosted gatherings, catering, event decoration, collaborations or general questions.",
    ),
    block("4. Legal basis", "h2"),
    block(
      "RORUM processes personal information to respond to inquiries, manage requests, discuss events, hosted gatherings, catering, event decoration, collaborations and community-related communication. Depending on the request, the legal basis may be:",
    ),
    bulletBlock("taking steps before entering into an agreement"),
    bulletBlock("RORUM's legitimate interest in responding to inquiries and managing communication"),
    bulletBlock("consent, where you have given consent for a specific purpose"),
    block("5. CV and collaboration inquiries", "h2"),
    block(
      "If you submit your CV, portfolio or other information through the Work with us page, RORUM uses this information to review possible collaborations, roles or future opportunities.",
    ),
    block(
      "CVs and related messages may be kept for up to 12 months, unless you ask RORUM to delete them earlier or unless a longer period is agreed.",
    ),
    block("6. External providers", "h2"),
    block(
      "Billetto is used as an external ticket provider for selected event ticket links. If you use Billetto, their own privacy policy and terms apply.",
    ),
    block(
      "The Contact page may include a Google Maps iframe. Google may process data when the map is loaded.",
    ),
    block("7. Analytics and tracking", "h2"),
    block(
      "Google Analytics and Meta Pixel are not intentionally used by default on this simplified website. RORUM does not intentionally use marketing tracking by default.",
    ),
    block("8. How long information is kept", "h2"),
    block(
      "Email inquiries may be kept for as long as needed to respond to your request and manage the conversation. You can ask RORUM to delete your inquiry email where possible.",
    ),
    block("9. Your rights", "h2"),
    block(
      "You may contact RORUM to request access to your personal data, correction, deletion, restriction of processing, or to object to processing where applicable. If processing is based on consent, you may withdraw your consent at any time.",
    ),
    block("10. Contact", "h2"),
    block("For privacy questions, contact hello@rorum.dk."),
  ]),
  seo: {
    title: en("Privacy Policy"),
    description: enText("How RORUM handles inquiry and contact information for the MVP website."),
  },
};

const legalPageCookie: Doc = {
  _id: "legalPage-cookie-policy",
  _type: "legalPage",
  pageKey: "cookie-policy",
  title: en("Cookie policy"),
  subtitle: enText("How RORUM may use cookies and similar technologies."),
  body: enBody([
    block("2. What cookies are", "h2"),
    block(
      "Cookies are small files stored by your browser. Similar technologies may also be used to load website features or external services.",
    ),
    block("3. Necessary website cookies", "h2"),
    block(
      "The RORUM website may use necessary cookies or similar technologies required for basic website functionality, security or page behavior.",
    ),
    block("4. Forms", "h2"),
    block(
      "Forms on this website are email-only. Form submissions are not stored in Sanity, and no inquiry database is used in this simplified setup.",
    ),
    block("5. Analytics and marketing tracking", "h2"),
    block(
      "Google Analytics, Meta Pixel and marketing tracking cookies are not intentionally used by default on this simplified website.",
    ),
    block("6. Google Maps", "h2"),
    block(
      "The Contact page may include a Google Maps iframe. Google Maps may set cookies or process data when the map is loaded.",
    ),
    block("7. Billetto", "h2"),
    block(
      "Event ticket links may lead to Billetto, which is an external ticket provider. Billetto may use its own cookies or similar technologies.",
    ),
    block("8. Social media links", "h2"),
    block(
      "Social media links on this website are external links only. Social platforms may use their own cookies or tracking when you visit them.",
    ),
    block("9. Contact", "h2"),
    block("For cookie questions, contact hello@rorum.dk."),
  ]),
  seo: {
    title: en("Cookie Policy"),
    description: enText("Plain-language cookie policy for the RORUM website."),
  },
};

// ---------------------------------------------------------------------------
// navigation / footer / formMessages
// ---------------------------------------------------------------------------

const navigation: Doc = {
  _id: "navigation",
  _type: "navigation",
  items: [
    { _key: "n0", href: "/events", label: en("Attend Events") },
    { _key: "n1", href: "/host-at-rorum", label: en("Host at RORUM") },
    {
      _key: "n2",
      label: en("Services"),
      children: [
        { _key: "c0", href: "/catering", label: en("Catering") },
        { _key: "c1", href: "/event-decoration", label: en("Decoration") },
      ],
    },
    {
      _key: "n3",
      label: en("Community"),
      children: [
        { _key: "c0", href: "/community-membership", label: en("WECODA membership") },
        { _key: "c1", href: "/volunteer", label: en("Volunteer with us") },
        { _key: "c2", href: "/work-with-us", label: en("Work with us") },
      ],
    },
    { _key: "n4", href: "/about", label: en("About") },
    { _key: "n5", href: "/contact", label: en("Contact") },
  ],
  languageSwitcherLabel: en("Language"),
};

function footerColumn(key: string, title: string, links: [string, string][]) {
  return {
    _key: key,
    title: en(title),
    links: links.map(([href, label], i) => ({ _key: `l${i}`, href, label: en(label) })),
  };
}

const footer: Doc = {
  _id: "footer",
  _type: "footer",
  columns: [
    footerColumn("visit", "Visit & host", [
      ["/events", "Attend Events"],
      ["/host-at-rorum", "Host at RORUM"],
    ]),
    footerColumn("services", "Services", [
      ["/catering", "Catering"],
      ["/event-decoration", "Decoration"],
    ]),
    footerColumn("community", "Community", [
      ["/community-membership", "WECODA membership"],
      ["/volunteer", "Volunteer with us"],
      ["/work-with-us", "Work with us"],
    ]),
    footerColumn("company", "Company", [
      ["/about", "About"],
      ["/contact", "Contact"],
      ["/faq", "FAQ"],
    ]),
  ],
  legalLinks: [
    { _key: "l0", href: "/terms", label: en("Terms and conditions") },
    { _key: "l1", href: "/privacy-policy", label: en("Privacy policy") },
    { _key: "l2", href: "/cookie-policy", label: en("Cookie policy") },
  ],
  copyrightText: en("© 2026 RORUM. All rights reserved."),
};

const formMessages: Doc = {
  _id: "formMessages",
  _type: "formMessages",
  requiredFieldTemplate: en("{field} is required."),
  invalidEmailMessage: en("Please enter a valid email address."),
  privacyConsentRequiredMessage: en("Please agree to the Privacy policy before submitting."),
  privacyConsentPrefixText: en("I have read and agree to the"),
  faqQuestion: en("Questions?"),
  faqLabel: en("Read our FAQs"),
  fullNameLabel: en("Full Name"),
  phoneLabel: en("Phone number"),
  emailLabel: en("Email"),
  messageLabel: en("Message"),
  eventDateLabel: en("Event date"),
  agreeButtonLabel: en("I Have Read and Agree"),
  closeLabel: en("Close"),
  copyLabel: en("Copy"),
  copiedLabel: en("Copied"),
  packageLabel: en("Package"),
  selectPackagePlaceholder: en("Select package"),
  eventTimeLabel: en("Event time"),
  numberOfPeopleLabel: en("Number of people"),
  guestsPlaceholder: en("Approx. number"),
  additionalServicesLabel: en("Additional services"),
  commentLabel: en("Comment"),
  guestsRangeMessage: en("Please enter a whole number between 1 and 30."),
};

// ---------------------------------------------------------------------------
// Follow-up pass — new fields on documents that already exist from the
// original localization run (createIfNotExists below is a no-op for these,
// so they need their own .patch().set() the same way hostAtRorumPageFields
// does for `packages`). See MIGRATION_REPORT.md's follow-up section for the
// user-reported gaps this closes.
// ---------------------------------------------------------------------------

const homePagePatchFields: Record<string, unknown> = {
  servicesLabel: en("Services"),
  servicesTitle: en("Services for thoughtful gatherings"),
  services: [
    {
      _key: "svc0",
      _type: "serviceTeaser",
      title: en("Catering"),
      text: enText(
        "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
      ),
      cta: en("Explore catering"),
      href: "/catering",
    },
    {
      _key: "svc1",
      _type: "serviceTeaser",
      title: en("Event decoration"),
      text: enText(
        "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
      ),
      cta: en("Explore decoration"),
      href: "/event-decoration",
    },
  ],
  communityLabel: en("Community"),
  communityTitle: en("More than a space"),
  communityText: enText(
    "RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.",
  ),
  communityLinks: [
    { _key: "cl0", _type: "communityLink", label: en("WECODA membership"), href: "/community-membership" },
    { _key: "cl1", _type: "communityLink", label: en("Work with us"), href: "/work-with-us" },
    { _key: "cl2", _type: "communityLink", label: en("Volunteer with us"), href: "/volunteer" },
  ],
};

const aboutPagePatchFields: Record<string, unknown> = {
  closingSection: {
    eyebrow: en("Not sure where to start?"),
    title: en("Let's shape your idea together"),
    text: enText(
      "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
    ),
    cta: cta("Let's talk", "/contact"),
    faqQuestion: en("Have questions?"),
    faqLabel: en("Read our FAQs"),
    links: [
      { _key: "l0", href: "/events", label: en("Attend Events") },
      { _key: "l1", href: "/host-at-rorum", label: en("Host at RORUM") },
      { _key: "l2", href: "/catering", label: en("Catering") },
      { _key: "l3", href: "/event-decoration", label: en("Event decoration") },
    ],
  },
};

const communityMembershipPagePatchFields: Record<string, unknown> = {
  introSectionLabel: en("WECODA community"),
  introSectionTitle: en("Connecting Women Who Inspire, Build and Lead."),
  galleryLabel: en("Gallery"),
  galleryTitle: en("WECODA Community Meetings"),
  donation: {
    label: en("Donation"),
    title: en("Support the WECODA Community"),
    text: enText(
      "Your support helps WECODA organise educational programmes, community events, international collaborations, and new opportunities for women.",
    ),
    scanText: en("Scan to donate"),
    scanSubtext: en("Fast, secure and easy."),
    orText: en("OR"),
    bankTransferText: en("Prefer bank transfer? See our bank details on the right."),
    bankDetailsTitle: en("Bank Details"),
    supportText: enText(
      "RORUM proudly supports WECODA by providing a welcoming space for community events, learning, and collaboration.",
    ),
  },
};

const eventsPagePatchFields: Record<string, unknown> = {
  filters: {
    dateLabel: en("Date"),
    languageLabel: en("Languages"),
    priceLabel: en("Price"),
    availabilityLabel: en("Availability"),
    soonestLabel: en("Soonest first"),
    weekLabel: en("This week"),
    monthLabel: en("This month"),
    priceAscLabel: en("From low to high"),
    priceDescLabel: en("From high to low"),
    availableLabel: en("Available"),
    soldOutLabel: en("Sold out"),
    clearFiltersLabel: en("Clear filters"),
  },
};

const hostAtRorumPagePatchFields: Record<string, unknown> = {
  inquiryTitle: en("Apply to Host at RORUM"),
  inquirySubmitLabel: en("Submit Hosting Request"),
  messagePlaceholder: en("Tell us about your meeting format, timing and preferences."),
  successMessage: enText("Thank you. Your Host at RORUM request is ready for the RORUM team."),
};

const eventDecorationPagePatchFields: Record<string, unknown> = {
  inquiryTitle: en("Decoration request"),
  inquirySubmitLabel: en("Send request"),
  messagePlaceholder: en("Describe your event, location and desired visual setup."),
  successMessage: enText("Thank you. Your request is ready for the RORUM team."),
};

const cateringPagePatchFields: Record<string, unknown> = {
  inquiryTitle: en("Request catering"),
  inquirySubmitLabel: en("Request Catering"),
  messagePlaceholder: en("Describe your event, timing and catering wishes."),
  successMessage: enText("Thank you. We've received your catering request and will contact you soon."),
  footerNote: en("We'll only use your details to respond to your catering request."),
  menuOverlay: {
    triggerLabel: en("Menu examples"),
    title: en("Catering menu"),
    intro: [
      bulletParagraph(
        "mo0",
        "Traditional Ukrainian hospitality, Danish classics, and European-style service for hosted meetings, celebrations, and special gatherings.",
      ),
      bulletParagraph(
        "mo1",
        "Each menu is created individually based on your event format, number of guests, season, and dietary preferences.",
      ),
    ],
    requestCta: en("Request custom menu"),
    featuredDishesLabel: en("Featured Dishes"),
    disclaimerNote: enText(
      "The dishes shown are examples of what we can offer. We'll be happy to create a menu tailored to your event, preferences, and guests.",
    ),
    customMenuTitle: en("Create your custom menu"),
    customMenuText: enText(
      "Tell us about your event, number of guests, preferred cuisine, and dietary needs. We will help create a menu that fits your occasion and makes your guests feel welcome.",
    ),
    backToCateringCta: en("Back to Catering"),
  },
};

const contactPagePatchFields: Record<string, unknown> = {
  submitLabel: en("Send message"),
};

const navigationPatchFields: Record<string, unknown> = {
  contactCtaLabel: en("Let's Talk"),
};

const footerPatchFields: Record<string, unknown> = {
  contactDetailsLabel: en("Contact details"),
};

const followUpPatches: [id: string, fields: Record<string, unknown>][] = [
  ["homePage", homePagePatchFields],
  ["aboutPage", aboutPagePatchFields],
  ["communityMembershipPage", communityMembershipPagePatchFields],
  ["eventsPage", eventsPagePatchFields],
  ["hostAtRorumPage", hostAtRorumPagePatchFields],
  ["eventDecorationPage", eventDecorationPagePatchFields],
  ["cateringPage", cateringPagePatchFields],
  ["contactPage", contactPagePatchFields],
  ["navigation", navigationPatchFields],
  ["footer", footerPatchFields],
  ["formMessages", Object.fromEntries(Object.entries(formMessages).filter(([k]) => !k.startsWith("_")))],
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function buildDocuments(): Doc[] {
  return [
    homePage,
    aboutPage,
    cateringPage,
    eventDecorationPage,
    communityMembershipPage,
    contactPage,
    eventsPage,
    faqPage,
    volunteerPage,
    workWithUsPage,
    legalPageTerms,
    legalPagePrivacy,
    legalPageCookie,
    navigation,
    footer,
    formMessages,
  ];
}

async function main() {
  const docs = buildDocuments();

  console.log(`Import summary (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log(`  ${docs.length} documents to createIfNotExists:`);
  for (const doc of docs) console.log(`    ${doc._type} (${doc._id})`);
  console.log(`  1 document to patch (hostAtRorumPage): ${Object.keys(hostAtRorumPageFields).join(", ")}`);
  console.log(`  ${followUpPatches.length} documents to patch with follow-up-pass fields:`);
  for (const [id, fields] of followUpPatches) console.log(`    ${id}: ${Object.keys(fields).join(", ")}`);

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset || !token) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN are all required for a live run.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
  });

  for (const doc of docs) {
    await client.createIfNotExists(doc as never);
  }
  console.log(`\nProcessed ${docs.length} documents (existing ones were left untouched).`);

  await client.patch("hostAtRorumPage").set(hostAtRorumPageFields).commit({ autoGenerateArrayKeys: false });
  console.log("Patched hostAtRorumPage with its remaining fields (packages untouched).");

  for (const [id, fields] of followUpPatches) {
    await client.patch(id).set(fields).commit({ autoGenerateArrayKeys: false });
  }
  console.log(`Patched ${followUpPatches.length} documents with follow-up-pass fields.`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
