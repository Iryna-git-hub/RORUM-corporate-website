import { contactDetails } from "@/lib/siteConfig";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href: string | null;
  label: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { href: "/events", label: "Attend Events" },
  { href: "/host-at-rorum", label: "Host at RORUM" },
  {
    href: null,
    label: "Services",
    children: [
      { href: "/catering", label: "Catering" },
      { href: "/event-decoration", label: "Decoration" },
    ],
  },
  {
    href: null,
    label: "Community",
    children: [
      { href: "/community-membership", label: "WECODA membership" },
      { href: "/volunteer", label: "Volunteer with us" },
      { href: "/work-with-us", label: "Work with us" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export interface PageMeta {
  href: string;
  title: string;
  description: string;
}

export const pages: PageMeta[] = [
  {
    href: "/",
    title: "Home",
    description:
      "RORUM is a warm Copenhagen space for meaningful events, hosted gatherings and community experiences.",
  },
  {
    href: "/events",
    title: "Events",
    description:
      "Discover upcoming RORUM events, workshops and intimate community gatherings.",
  },
  {
    href: "/host-at-rorum",
    title: "Host at RORUM",
    description:
      "Host workshops, meetings and intimate gatherings at RORUM.",
  },
  {
    href: "/catering",
    title: "Catering",
    description:
      "Warm Scandinavian catering for workshops, meetings and intimate events.",
  },
  {
    href: "/event-decoration",
    title: "Space Decoration",
    description:
      "Thoughtful table settings, florals and atmosphere styling for RORUM events.",
  },
  {
    href: "/community-membership",
    title: "Community Membership",
    description:
      "Join the RORUM community for events, collaboration and practical creative support in Copenhagen.",
  },
  {
    href: "/volunteer",
    title: "Volunteer With Us",
    description:
      "Join the RORUM community as a volunteer for events and hospitality moments.",
  },
  {
    href: "/work-with-us",
    title: "Work With Us",
    description:
      "Collaborate with RORUM as a facilitator, chef, creative partner or event professional.",
  },
  {
    href: "/about",
    title: "About",
    description:
      "Learn about RORUM, a small curated ground-floor creative and event space in Copenhagen.",
  },
  {
    href: "/contact",
    title: "Contact",
    description:
      "Contact RORUM for event inquiries, space booking and collaborations in Copenhagen.",
  },
  {
    href: "/faq",
    title: "FAQ",
    description:
      "Answers about RORUM events, hosting, booking, services and volunteering.",
  },
  {
    href: "/terms",
    title: "Terms",
    description: "Terms for using the RORUM MVP website and booking inquiries.",
  },
  {
    href: "/privacy-policy",
    title: "Privacy Policy",
    description:
      "How RORUM handles inquiry and contact information for the MVP website.",
  },
  {
    href: "/cookie-policy",
    title: "Cookie Policy",
    description: "Plain-language cookie policy for the RORUM website.",
  },
];

export interface PracticalDetail {
  label: string;
  value: string;
}

// SINGLE IMAGE SOURCE OF TRUTH
// Every event has exactly one `image` field. This field is used by:
//   - EventCard (Events listing page, homepage scroll, related events)
//   - EventDetailPage hero <Image> and Open Graph metadata
//
// Do NOT add heroImage, detailImage, coverImage or any secondary image field.
// When images change, run `next build` to regenerate the static detail pages.
export interface RorumEvent {
  slug: string;
  title: string;
  date: string;
  time: string;
  category: string;
  price: string;
  language: string;
  host: string;
  shortDescription: string;
  longDescription: string;
  included: string[];
  whatToExpect: string[];
  practicalDetails: PracticalDetail[];
  ticketProvider: string;
  ticketUrl: string;
  calendarUrl: string;
  waitlistUrl: string;
  isSoldOut: boolean;
  relatedEventSlugs: string[];
  image: string;
  // Never populated by the data below, but read defensively by consumers
  // (app/events/[slug]/page.jsx, components/EventCard.jsx) as forward-compat
  // fallbacks in case a future/partial event omits ticketsLeft or supplies a
  // richer shape. Kept optional to reflect that reality rather than force
  // a stricter type the actual consumer code doesn't rely on.
  ticketsLeft?: number;
  spotsLeft?: number;
  duration?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  fullDescription?: string;
  description?: string;
}

const featuredEvents: RorumEvent[] = [
  {
    slug: "copenhagen-makers-dinner",
    title: "Copenhagen makers dinner",
    date: "2026-05-02",
    time: "18:30-21:30",
    category: "Community Dinner",
    price: "295 kr.",
    language: "English",
    host: "RORUM Community Table",
    shortDescription:
      "A slow evening of seasonal food, local stories and new creative connections around one long table.",
    longDescription:
      "An intimate dinner for Copenhagen makers, hosts and independent creatives who want to meet in a setting that feels calm, useful and generous. Expect a seasonal shared table, gentle prompts and enough space for real conversation.",
    included: [
      "Seasonal shared dinner",
      "Welcome drink",
      "Facilitated introductions",
      "Community table seating",
    ],
    whatToExpect: [
      "Small group format",
      "Seasonal shared dinner",
      "Warm RORUM atmosphere",
      "Facilitated introductions",
      "Time for conversation",
    ],
    practicalDetails: [
      { label: "Address", value: contactDetails.shortAddress },
      {
        label: "Arrival",
        value: "Please arrive 5-10 minutes before the event begins.",
      },
      { label: "Duration", value: "3 hours" },
      { label: "Language", value: "English" },
      { label: "Tickets", value: "Purchased externally via Billetto" },
    ],
    ticketProvider: "Billetto",
    ticketUrl: "https://billetto.dk/",
    calendarUrl: "https://calendar.google.com/",
    waitlistUrl: `mailto:${contactDetails.email}?subject=Copenhagen%20Makers%20Dinner%20waitlist`,
    isSoldOut: false,
    ticketsLeft: 10,
    relatedEventSlugs: [
      "botanical-table-styling-workshop",
      "freelance-morning-salon",
    ],
    image: "/images/events/banners/copenhagen-makers-dinner.png",
  },
  {
    slug: "botanical-table-styling-workshop",
    title: "Botanical table styling workshop",
    date: "2026-05-03",
    time: "17:00-19:30",
    category: "Workshop",
    price: "425 kr.",
    language: "English",
    host: "RORUM Styling Studio",
    shortDescription:
      "Learn approachable floral gestures, candle placement and calm table composition for intimate hosting.",
    longDescription:
      "A hands-on workshop for hosts, facilitators and visual thinkers who want to create welcoming tables without overcomplicating the room. We work with seasonal materials, scale, repetition and practical setup choices.",
    included: [
      "Materials for table styling exercises",
      "Coffee, tea and a sweet pause",
      "Practical setup checklist",
      "Small-group guidance",
    ],
    whatToExpect: [
      "Hands-on guidance",
      "Seasonal materials",
      "Coffee, tea and a sweet pause",
      "Small-group format",
      "Practical setup ideas",
    ],
    practicalDetails: [
      { label: "Address", value: contactDetails.shortAddress },
      {
        label: "Arrival",
        value: "Please arrive 5-10 minutes before the event begins.",
      },
      { label: "Duration", value: "2.5 hours" },
      { label: "Language", value: "English" },
      { label: "Tickets", value: "Purchased externally via Billetto" },
    ],
    ticketProvider: "Billetto",
    ticketUrl: "https://billetto.dk/",
    calendarUrl: "https://calendar.google.com/",
    waitlistUrl: `mailto:${contactDetails.email}?subject=Botanical%20Table%20Styling%20Workshop%20waitlist`,
    isSoldOut: false,
    ticketsLeft: 8,
    relatedEventSlugs: ["copenhagen-makers-dinner", "freelance-morning-salon"],
    image: "/images/events/banners/botanical-table-styling-workshop.png",
  },
  {
    slug: "freelance-morning-salon",
    title: "Freelance morning salon",
    date: "2026-05-04",
    time: "09:00-11:00",
    category: "Salon",
    price: "125 kr.",
    language: "English",
    host: "RORUM Work Circle",
    shortDescription:
      "Coffee, prompts and gentle accountability for independent creatives building work in Copenhagen.",
    longDescription:
      "A focused morning for freelancers and small creative businesses who want a calmer way to begin the day. Bring a current question, a practical task or a project that needs quiet momentum.",
    included: [
      "Coffee and tea",
      "Guided check-in",
      "Focused work prompts",
      "Small-group reflection",
    ],
    whatToExpect: [
      "Coffee and tea",
      "Guided check-in",
      "Focused work prompts",
      "Small-group reflection",
      "Calm morning rhythm",
    ],
    practicalDetails: [
      { label: "Address", value: contactDetails.shortAddress },
      {
        label: "Arrival",
        value: "Please arrive 5-10 minutes before the event begins.",
      },
      { label: "Duration", value: "2 hours" },
      { label: "Language", value: "English" },
      { label: "Tickets", value: "Join the waitlist for updates" },
    ],
    ticketProvider: "Billetto",
    ticketUrl: "https://billetto.dk/",
    calendarUrl: "https://calendar.google.com/",
    waitlistUrl: `mailto:${contactDetails.email}?subject=Freelance%20Morning%20Salon%20waitlist`,
    isSoldOut: true,
    relatedEventSlugs: [
      "copenhagen-makers-dinner",
      "botanical-table-styling-workshop",
    ],
    image: "/images/events/banners/freelance-morning-salon.png",
  },
];

interface EventAddition {
  slug: string;
  title: string;
  date: string;
  time: string;
  category: string;
  price: string;
  language?: string;
  ticketsLeft?: number;
  isSoldOut?: boolean;
  image: string;
}

const eventAdditions: EventAddition[] = [
  {
    slug: "soft-launch-breakfast",
    title: "Soft launch breakfast",
    date: "2026-05-05",
    time: "09:00-11:00",
    category: "Breakfast",
    price: "165 kr.",
    ticketsLeft: 6,
    image: "/images/events/banners/soft-launch-breakfast.png",
  },
  {
    slug: "candlelit-listening-room",
    title: "Candlelit listening room",
    date: "2026-05-07",
    time: "19:00-21:00",
    category: "Culture",
    price: "185 kr.",
    ticketsLeft: 4,
    image: "/images/events/banners/candlelit-listening-room.png",
  },
  {
    slug: "summer-table-lab",
    title: "Summer table lab",
    date: "2026-05-12",
    time: "17:30-20:00",
    category: "Workshop",
    price: "345 kr.",
    ticketsLeft: 9,
    image: "/images/events/banners/summer-table-lab.png",
  },
  {
    slug: "creative-hosts-circle",
    title: "Creative hosts circle",
    date: "2026-05-15",
    time: "18:00-20:00",
    category: "Community",
    price: "95 kr.",
    ticketsLeft: 12,
    image: "/images/events/banners/creative-hosts-circle.png",
  },
  {
    slug: "nordic-brunch-club",
    title: "Nordic brunch club",
    date: "2026-05-17",
    time: "10:00-12:30",
    category: "Food",
    price: "245 kr.",
    ticketsLeft: 5,
    image: "/images/events/banners/nordic-brunch-club.png",
  },
  {
    slug: "tiny-talks-evening",
    title: "Tiny talks evening",
    date: "2026-05-21",
    time: "18:30-21:00",
    category: "Talks",
    price: "145 kr.",
    ticketsLeft: 7,
    image: "/images/events/banners/tiny-talks-evening.png",
  },
  {
    slug: "floral-mood-workshop",
    title: "Floral mood workshop",
    date: "2026-05-24",
    time: "17:00-19:30",
    category: "Styling",
    price: "375 kr.",
    ticketsLeft: 3,
    image: "/images/events/banners/floral-mood-workshop.png",
  },
  {
    slug: "independent-work-morning",
    title: "Independent work morning",
    date: "2026-05-28",
    time: "09:00-11:30",
    category: "Salon",
    price: "115 kr.",
    ticketsLeft: 11,
    image: "/images/events/banners/independent-work-morning.png",
  },
  {
    slug: "seasonal-supper-preview",
    title: "Seasonal supper preview",
    date: "2026-05-31",
    time: "18:30-21:30",
    category: "Dinner",
    price: "325 kr.",
    ticketsLeft: 8,
    image: "/images/events/banners/seasonal-supper-preview.png",
  },
  {
    slug: "community-reset-night",
    title: "Community reset night",
    date: "2026-06-04",
    time: "18:00-20:30",
    category: "Community",
    price: "135 kr.",
    ticketsLeft: 12,
    image: "/images/events/banners/community-reset-night.png",
  },
  {
    slug: "business-breakfast-copenhagen",
    title: "Business breakfast Copenhagen",
    date: "2026-06-08",
    time: "08:30-10:30",
    category: "Business Breakfast",
    price: "185 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/business-breakfast-copenhagen.png",
  },
  {
    slug: "networking-for-international-founders",
    title: "Networking for international founders",
    date: "2026-06-10",
    time: "18:00-20:30",
    category: "Networking",
    price: "145 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/networking-for-international-founders.png",
  },
  {
    slug: "danish-for-ukrainians-intro",
    title: "Danish for Ukrainians: Everyday basics",
    date: "2026-06-12",
    time: "17:30-19:00",
    category: "Language",
    price: "Free",
    language: "Ukrainian",
    ticketsLeft: 12,
    image: "/images/events/banners/danish-for-ukrainians-intro.png",
  },
  {
    slug: "yoga-after-work-reset",
    title: "Yoga after work reset",
    date: "2026-06-14",
    time: "18:00-19:15",
    category: "Yoga",
    price: "125 kr.",
    language: "English",
    ticketsLeft: 10,
    image: "/images/events/banners/yoga-after-work-reset.png",
  },
  {
    slug: "present-yourself-with-confidence",
    title: "Present yourself with confidence",
    date: "2026-06-16",
    time: "18:00-20:00",
    category: "Self Improvement",
    price: "225 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/present-yourself-with-confidence.png",
  },
  {
    slug: "slow-art-evening",
    title: "Slow art evening",
    date: "2026-06-18",
    time: "18:30-20:30",
    category: "Art",
    price: "165 kr.",
    language: "English",
    ticketsLeft: 9,
    image: "/images/events/banners/slow-art-evening.png",
  },
  {
    slug: "danish-conversation-cafe",
    title: "Danish conversation cafe",
    date: "2026-06-20",
    time: "10:00-12:00",
    category: "Language",
    price: "75 kr.",
    language: "Danish",
    ticketsLeft: 12,
    image: "/images/events/banners/danish-conversation-cafe.png",
  },
  {
    slug: "creative-business-roundtable",
    title: "Creative business roundtable",
    date: "2026-06-23",
    time: "17:30-20:00",
    category: "Business",
    price: "195 kr.",
    language: "English",
    ticketsLeft: 11,
    image: "/images/events/banners/creative-business-roundtable.png",
  },
  {
    slug: "mindful-morning-yoga",
    title: "Mindful morning yoga",
    date: "2026-06-25",
    time: "08:00-09:15",
    category: "Yoga",
    price: "110 kr.",
    language: "English",
    ticketsLeft: 8,
    image: "/images/events/banners/mindful-morning-yoga.png",
  },
  {
    slug: "linkedin-profile-lab",
    title: "LinkedIn profile lab",
    date: "2026-06-27",
    time: "10:00-12:30",
    category: "Business",
    price: "245 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/linkedin-profile-lab.png",
  },
  {
    slug: "ukrainian-danish-community-night",
    title: "Ukrainian-Danish community night",
    date: "2026-06-30",
    time: "18:00-20:30",
    category: "Community",
    price: "95 kr.",
    language: "Ukrainian",
    ticketsLeft: 12,
    image: "/images/events/banners/ukrainian-danish-community-night.png",
  },
  {
    slug: "watercolor-and-wine",
    title: "Watercolor & wine",
    date: "2026-07-02",
    time: "19:00-21:00",
    category: "Art",
    price: "195 kr.",
    language: "English",
    ticketsLeft: 7,
    image: "/images/events/banners/watercolor-and-wine.png",
  },
  {
    slug: "danish-work-culture-breakfast",
    title: "Danish work culture breakfast",
    date: "2026-07-04",
    time: "09:00-11:00",
    category: "Business Breakfast",
    price: "175 kr.",
    language: "Danish",
    ticketsLeft: 12,
    image: "/images/events/banners/danish-work-culture-breakfast.png",
  },
  {
    slug: "calm-networking-for-newcomers",
    title: "Calm networking for newcomers",
    date: "2026-07-07",
    time: "18:00-20:00",
    category: "Networking",
    price: "135 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/calm-networking-for-newcomers.png",
  },
  {
    slug: "breathwork-and-tea",
    title: "Breathwork & tea",
    date: "2026-07-09",
    time: "18:30-20:00",
    category: "Relaxation",
    price: "115 kr.",
    language: "English",
    ticketsLeft: 10,
    image: "/images/events/banners/breathwork-and-tea.png",
  },
  {
    slug: "pitch-practice-evening",
    title: "Pitch practice evening",
    date: "2026-07-11",
    time: "17:30-20:00",
    category: "Presentation",
    price: "215 kr.",
    language: "English",
    ticketsLeft: 9,
    image: "/images/events/banners/pitch-practice-evening.png",
  },
  {
    slug: "clay-and-calm-hands",
    title: "Clay & calm hands",
    date: "2026-07-14",
    time: "18:00-20:30",
    category: "Art",
    price: "285 kr.",
    language: "English",
    isSoldOut: true,
    image: "/images/events/banners/clay-and-calm-hands.png",
  },
  {
    slug: "danish-for-ukrainians-workplace",
    title: "Danish for Ukrainians: Workplace words",
    date: "2026-07-16",
    time: "17:30-19:00",
    category: "Language",
    price: "Free",
    language: "Ukrainian",
    ticketsLeft: 12,
    image: "/images/events/banners/danish-for-ukrainians-workplace.png",
  },
  {
    slug: "international-supper-salon",
    title: "International supper salon",
    date: "2026-07-18",
    time: "18:30-21:30",
    category: "Community Dinner",
    price: "325 kr.",
    language: "English",
    ticketsLeft: 12,
    image: "/images/events/banners/international-supper-salon.png",
  },
];

const expandedEvents: RorumEvent[] = eventAdditions.map((event) => ({
  ...event,
  language: event.language ?? "English",
  host: "RORUM",
  shortDescription: `${event.title} is an intimate RORUM gathering shaped for a warm Copenhagen room.`,
  longDescription: `${event.title} brings people together around a simple hosted format with thoughtful pacing, a calm room setup and space for useful conversation.`,
  included: [
    "Hosted arrival",
    "Coffee, tea or seasonal drink",
    "Small-group format",
    "Room setup by RORUM",
  ],
  whatToExpect: [
    "Small group format",
    "Guided experience",
    "Warm RORUM atmosphere",
    "Tea & refreshments",
    "Time for conversation",
  ],
  practicalDetails: [
    { label: "Address", value: contactDetails.shortAddress },
    {
      label: "Arrival",
      value: "Please arrive 5-10 minutes before the event begins.",
    },
    { label: "Duration", value: event.time },
    { label: "Language", value: event.language ?? "English" },
    { label: "Tickets", value: "Purchased externally via Billetto" },
  ],
  ticketProvider: "Billetto",
  ticketUrl: "https://billetto.dk/",
  calendarUrl: "https://calendar.google.com/",
  waitlistUrl: `mailto:${contactDetails.email}?subject=${encodeURIComponent(`${event.title} waitlist`)}`,
  isSoldOut: event.isSoldOut ?? false,
  relatedEventSlugs: [
    "copenhagen-makers-dinner",
    "botanical-table-styling-workshop",
  ],
}));

export const events: RorumEvent[] = [...featuredEvents, ...expandedEvents];
export const homeEvents: RorumEvent[] = events;

export const membershipBenefits: string[] = [
  "Early invitations to selected community events",
  "A practical network of hosts, facilitators and independent creatives",
  "Opportunities to test formats, workshops and small gatherings",
  "Access to volunteer, collaboration and work-with-us pathways",
  "Warm introductions around shared interests and skills",
  "Clear updates about RORUM events, services and community moments",
];

export interface TitledText {
  title: string;
  text: string;
}

export const communityPillars: TitledText[] = [
  {
    title: "Connect",
    text: "Meet people through curated events, small groups and practical introductions that make Copenhagen feel easier to enter.",
  },
  {
    title: "Create",
    text: "Use the room, the network and the RORUM rhythm to shape workshops, dinners, salons or other thoughtful formats.",
  },
  {
    title: "Grow",
    text: "Build confidence, visibility and working relationships through events, volunteering, hosting and collaboration.",
  },
];

export const membershipAudiences: string[] = [
  "Independent creatives, freelancers and small business owners",
  "Hosts, facilitators, chefs, stylists and event makers",
  "People new to Copenhagen who want a practical creative network",
  "Community-minded guests who want to contribute, not only attend",
];

export const aboutValues: TitledText[] = [
  {
    title: "Warmth",
    text: "A room should help people arrive, settle and feel welcome without performance.",
  },
  {
    title: "Trust",
    text: "Clear agreements, thoughtful hosting and practical communication make collaboration easier.",
  },
  {
    title: "Creativity",
    text: "RORUM supports ideas that become real through workshops, dinners, meetings and intimate formats.",
  },
  {
    title: "Belonging",
    text: "The space is built for people who want connection to feel useful, grounded and human.",
  },
  {
    title: "Thoughtful hospitality",
    text: "Food, light, layout and timing matter because they shape how people meet.",
  },
];

export interface PackageTier {
  title: string;
  price: string;
  items: string[];
}

export const packages: { host: PackageTier[]; booking: PackageTier[] } = {
  host: [
    {
      title: "Single session",
      price: "From 1,800 kr.",
      items: [
        "2-3 hour event slot",
        "Basic room setup",
        "Welcome table and check-in support",
        "Event listing support",
      ],
    },
    {
      title: "Evening series",
      price: "Custom quote",
      items: [
        "Recurring evening format",
        "Shared promotion rhythm",
        "Storage for selected materials",
        "Host onboarding",
      ],
    },
    {
      title: "Weekend event",
      price: "Custom quote",
      items: [
        "Half or full weekend use",
        "Flexible floor plan",
        "Catering and styling add-ons",
        "Production planning call",
      ],
    },
  ],
  booking: [
    {
      title: "Morning session",
      price: "Price: 2000 kr. ex VAT",
      items: [
        "08:30 - 12:30",
        "Suitable for focused meetings, workshops, and small group sessions.",
        "Up to 12 guests",
        "Croissant & juice: 90 kr. / person",
      ],
    },
    {
      title: "Afternoon session",
      price: "Price: 2000 kr. ex VAT",
      items: [
        "13:00 - 17:00",
        "A flexible format for presentations, workshops, and team meetings.",
        "Up to 12 guests",
        "Fruit and snacks: 90 kr. / person",
      ],
    },
    {
      title: "Full day session",
      price: "Price: 3700 kr. ex VAT",
      items: [
        "09:00 - 17:00",
        "For longer sessions requiring time, structure, and continuity.",
        "Up to 12 guests",
        "Lunch and snacks: 280 kr. / person",
      ],
    },
  ],
};

export type FaqEntry = [question: string, answer: string];
export type FaqData = Record<string, FaqEntry[]>;

export const faqs: FaqData = {
  Events: [
    [
      "How do I book a ticket?",
      "Open the event you are interested in and follow the booking details listed there.",
    ],
    [
      "Are events in English?",
      "The MVP event list includes language on every card. Most community events can be hosted in English.",
    ],
  ],
  "Host at RORUM": [
    [
      "Can I host my own event at RORUM?",
      "Yes. Send the Host at RORUM inquiry form with your format, audience and preferred dates.",
    ],
    [
      "Do you help promote hosted events?",
      "For selected collaborations, RORUM can support with listing, visuals and community channels.",
    ],
    [
      "What is the cancellation policy?",
      "MVP policy copy is indicative. Final booking terms should be confirmed before launch.",
    ],
  ],
  Services: [
    [
      "Can catering be added to any booking?",
      "Most bookings can include coffee, light breakfast, lunch boards or evening bites depending on date and group size.",
    ],
    [
      "Do you style events outside RORUM?",
      "For the MVP, styling inquiries are focused on RORUM events, but collaboration requests can be submitted.",
    ],
  ],
  Volunteering: [
    [
      "What do volunteers do?",
      "Volunteers may help with guest welcome, room reset, light hosting and event support.",
    ],
    [
      "Is volunteering paid?",
      "Volunteer roles are community-based. Paid work and collaborations should use the Work With Us form.",
    ],
  ],
};

export interface ServiceCard {
  title: string;
  href: string;
  text: string;
  image: string;
}

export const serviceCards: ServiceCard[] = [
  {
    title: "Catering",
    href: "/catering",
    text: "Tailored upon request. Seasonal, unfussy food and drinks for workshops, meetings and long-table evenings.",
    image: "/images/catering/catering-1.png",
  },
  {
    title: "Space decoration",
    href: "/event-decoration",
    text: "Tailored upon request. Table settings, florals, candles and atmospheric details that make a room feel held.",
    image: "/images/decoration/decoration-1.png",
  },
];

export const siteUrl = "https://rorum.dk";
