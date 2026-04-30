export const navItems = [
    { href: "/events", label: "Events" },
    { href: "/host-an-event", label: "Host an event" },
    { href: "/book-the-space", label: "Book the space" },
    {
        href: "/services",
        label: "Services",
        children: [
            { href: "/catering", label: "Catering" },
            { href: "/space-decoration-event-styling", label: "Event Decoration" }
        ]
    },
    {
        href: "/volunteer",
        label: "Community",
        children: [
            { href: "/community-membership", label: "Membership" },
            { href: "/work-with-us", label: "Work with us" },
            { href: "/volunteer", label: "Volunteer with us" }
        ]
    },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
];
export const pages = [
    { href: "/", title: "Home", description: "RORUM is a warm creative event space in Copenhagen for intimate events, workshops and community gatherings." },
    { href: "/events", title: "Events", description: "Discover upcoming RORUM events, workshops and intimate community gatherings." },
    { href: "/host-an-event", title: "Host an Event", description: "Bring your workshop, supper club, talk or community concept to RORUM." },
    { href: "/book-the-space", title: "Book the Space", description: "Book RORUM for meetings, private sessions, creative production and intimate gatherings." },
    { href: "/services", title: "Services", description: "Explore RORUM catering, space decoration and event styling services." },
    { href: "/catering", title: "Catering", description: "Warm Scandinavian catering for workshops, meetings and intimate events." },
    { href: "/space-decoration-event-styling", title: "Space Decoration & Event Styling", description: "Thoughtful table settings, florals and atmosphere styling for RORUM events." },
    { href: "/community-membership", title: "Community Membership", description: "Join the RORUM community for events, collaboration and practical creative support in Copenhagen." },
    { href: "/volunteer", title: "Volunteer With Us", description: "Join the RORUM community as a volunteer for events and hospitality moments." },
    { href: "/work-with-us", title: "Work With Us", description: "Collaborate with RORUM as a facilitator, chef, creative partner or event professional." },
    { href: "/about", title: "About", description: "Learn about RORUM, a small curated ground-floor creative and event space in Copenhagen." },
    { href: "/contact", title: "Contact", description: "Contact RORUM for event inquiries, space booking and collaborations in Copenhagen." },
    { href: "/faq", title: "FAQ", description: "Answers about RORUM events, hosting, booking, services and volunteering." },
    { href: "/terms", title: "Terms", description: "Terms for using the RORUM MVP website and booking inquiries." },
    { href: "/privacy-policy", title: "Privacy Policy", description: "How RORUM handles inquiry and contact information for the MVP website." },
    { href: "/cookie-policy", title: "Cookie Policy", description: "Plain-language cookie policy for the RORUM website." }
];
export const events = [
    {
        slug: "copenhagen-makers-dinner",
        title: "Copenhagen Makers Dinner",
        date: "2026-05-14",
        time: "18:30-21:30",
        category: "Community Dinner",
        price: "DKK 295",
        language: "English",
        host: "RORUM Community Table",
        shortDescription: "A slow evening of seasonal food, local stories and new creative connections around one long table.",
        longDescription: "An intimate dinner for Copenhagen makers, hosts and independent creatives who want to meet in a setting that feels calm, useful and generous. Expect a seasonal shared table, gentle prompts and enough space for real conversation.",
        included: ["Seasonal shared dinner", "Welcome drink", "Facilitated introductions", "Community table seating"],
        ticketProvider: "Billetto",
        ticketUrl: "https://billetto.dk/",
        calendarUrl: "https://calendar.google.com/",
        waitlistUrl: "mailto:hello@rorum.dk?subject=Copenhagen%20Makers%20Dinner%20waitlist",
        isSoldOut: false,
        relatedEventSlugs: ["botanical-table-styling-workshop", "freelance-morning-salon"],
        image: "/images/events/meeting.png"
    },
    {
        slug: "botanical-table-styling-workshop",
        title: "Botanical Table Styling Workshop",
        date: "2026-05-21",
        time: "17:00-19:30",
        category: "Workshop",
        price: "DKK 425",
        language: "English",
        host: "RORUM Styling Studio",
        shortDescription: "Learn approachable floral gestures, candle placement and calm table composition for intimate hosting.",
        longDescription: "A hands-on workshop for hosts, facilitators and visual thinkers who want to create welcoming tables without overcomplicating the room. We work with seasonal materials, scale, repetition and practical setup choices.",
        included: ["Materials for table styling exercises", "Coffee, tea and a sweet pause", "Practical setup checklist", "Small-group guidance"],
        ticketProvider: "Billetto",
        ticketUrl: "https://billetto.dk/",
        calendarUrl: "https://calendar.google.com/",
        waitlistUrl: "mailto:hello@rorum.dk?subject=Botanical%20Table%20Styling%20Workshop%20waitlist",
        isSoldOut: false,
        relatedEventSlugs: ["copenhagen-makers-dinner", "freelance-morning-salon"],
        image: "/images/events/workshop.png"
    },
    {
        slug: "freelance-morning-salon",
        title: "Freelance Morning Salon",
        date: "2026-06-03",
        time: "09:00-11:00",
        category: "Salon",
        price: "DKK 125",
        language: "English",
        host: "RORUM Work Circle",
        shortDescription: "Coffee, prompts and gentle accountability for independent creatives building work in Copenhagen.",
        longDescription: "A focused morning for freelancers and small creative businesses who want a calmer way to begin the day. Bring a current question, a practical task or a project that needs quiet momentum.",
        included: ["Coffee and tea", "Guided check-in", "Focused work prompts", "Small-group reflection"],
        ticketProvider: "Billetto",
        ticketUrl: "https://billetto.dk/",
        calendarUrl: "https://calendar.google.com/",
        waitlistUrl: "mailto:hello@rorum.dk?subject=Freelance%20Morning%20Salon%20waitlist",
        isSoldOut: true,
        relatedEventSlugs: ["copenhagen-makers-dinner", "botanical-table-styling-workshop"],
        image: "/images/space/space-1.png"
    }
];
export const membershipBenefits = [
    "Early invitations to selected community events",
    "A practical network of hosts, facilitators and independent creatives",
    "Opportunities to test formats, workshops and small gatherings",
    "Access to volunteer, collaboration and work-with-us pathways",
    "Warm introductions around shared interests and skills",
    "Clear updates about RORUM events, services and community moments"
];
export const communityPillars = [
    { title: "Connect", text: "Meet people through curated events, small groups and practical introductions that make Copenhagen feel easier to enter." },
    { title: "Create", text: "Use the room, the network and the RORUM rhythm to shape workshops, dinners, salons or other thoughtful formats." },
    { title: "Grow", text: "Build confidence, visibility and working relationships through events, volunteering, hosting and collaboration." }
];
export const membershipAudiences = [
    "Independent creatives, freelancers and small business owners",
    "Hosts, facilitators, chefs, stylists and event makers",
    "People new to Copenhagen who want a practical creative network",
    "Community-minded guests who want to contribute, not only attend"
];
export const aboutValues = [
    { title: "Warmth", text: "A room should help people arrive, settle and feel welcome without performance." },
    { title: "Trust", text: "Clear agreements, thoughtful hosting and practical communication make collaboration easier." },
    { title: "Creativity", text: "RORUM supports ideas that become real through workshops, dinners, meetings and intimate formats." },
    { title: "Belonging", text: "The space is built for people who want connection to feel useful, grounded and human." },
    { title: "Thoughtful hospitality", text: "Food, light, layout and timing matter because they shape how people meet." }
];
export const packages = {
    host: [
        { title: "Single Session", price: "From DKK 1,800", items: ["2-3 hour event slot", "Basic room setup", "Welcome table and check-in support", "Event listing support"] },
        { title: "Evening Series", price: "Custom quote", items: ["Recurring evening format", "Shared promotion rhythm", "Storage for selected materials", "Host onboarding"] },
        { title: "Weekend Event", price: "Custom quote", items: ["Half or full weekend use", "Flexible floor plan", "Catering and styling add-ons", "Production planning call"] }
    ],
    booking: [
        { title: "Morning Session", price: "From DKK 1,200", items: ["08:00-12:00", "Coffee and tea station", "Meeting setup", "Quiet arrival window"] },
        { title: "Afternoon Session", price: "From DKK 1,400", items: ["13:00-17:00", "Workshop tables", "Projector-ready wall", "Optional snack board"] },
        { title: "Full Day", price: "From DKK 2,600", items: ["08:00-17:00", "Flexible room layout", "Breakout corners", "Food and drinks add-ons"] }
    ]
};
export const faqs = {
    Events: [
        ["How do I book a ticket?", "Open the event you are interested in and follow the booking details listed there."],
        ["Are events in English?", "The MVP event list includes language on every card. Most community events can be hosted in English."]
    ],
    Hosting: [
        ["Can I host my own event at RORUM?", "Yes. Send the Host an Event inquiry form with your format, audience and preferred dates."],
        ["Do you help promote hosted events?", "For selected collaborations, RORUM can support with listing, visuals and community channels."]
    ],
    "Book the Space": [
        ["Can I book the space for a private meeting?", "Yes. The space works well for small team sessions, creative planning, content production and intimate gatherings."],
        ["What is the cancellation policy?", "MVP policy copy is indicative. Final booking terms should be confirmed before launch."]
    ],
    Services: [
        ["Can catering be added to any booking?", "Most bookings can include coffee, light breakfast, lunch boards or evening bites depending on date and group size."],
        ["Do you style events outside RORUM?", "For the MVP, styling inquiries are focused on RORUM events, but collaboration requests can be submitted."]
    ],
    Volunteering: [
        ["What do volunteers do?", "Volunteers may help with guest welcome, room reset, light hosting and event support."],
        ["Is volunteering paid?", "Volunteer roles are community-based. Paid work and collaborations should use the Work With Us form."]
    ]
};
export const serviceCards = [
    {
        title: "Catering",
        href: "/catering",
        text: "Seasonal, unfussy food and drinks for workshops, meetings and long-table evenings.",
        image: "/images/catering/catering-1.png"
    },
    {
        title: "Space Decoration & Event Styling",
        href: "/space-decoration-event-styling",
        text: "Table settings, florals, candles and small atmospheric details that make a room feel held.",
        image: "/images/decoration/decoration-1.png"
    }
];
export const siteUrl = "https://rorum.dk";
