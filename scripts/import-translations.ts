/**
 * Idempotent Danish + Ukrainian translation import. PATCHes `da`/`uk`
 * entries onto every internationalized field this project's English-content
 * scripts (`import-content.ts`, `import-pages.ts`) already created —
 * reconstructing each field's COMPLETE trilingual value (via the `tri*()`
 * helpers) and `.set()`-ing it, rather than trying to append to an
 * unknown existing array. This is safe specifically because this script is
 * the single source of truth for da/uk content and always regenerates the
 * exact same en value alongside it, so a re-run never drifts or duplicates.
 *
 * IMPORTANT — translation provenance: every da/uk string in this file was
 * machine-translated by Claude, not reviewed by a native Danish or
 * Ukrainian speaker. It is safe to publish (the schema's English fallback
 * means nothing breaks if a string is wrong) but should be treated as a
 * first draft — see MIGRATION_REPORT.md's localization section.
 *
 * Usage:
 *   npm run sanity:import-translations:dry-run
 *   npm run sanity:import-translations
 */
import { createClient } from "@sanity/client";
import { events, faqs } from "../lib/data";
import { menuCategories } from "../lib/cateringMenu";
import { socialLinks as socialLinksData } from "../lib/siteConfig";
import {
  block,
  bulletBlock,
  deterministicId,
  localizedBody,
  mergeLocales,
  slugify,
  tri,
  triBullet,
  triBulletParagraph,
  triText,
} from "./lib/sanityImportUtils";

function triBody(
  enBlocks: ReturnType<typeof block>[],
  daBlocks: ReturnType<typeof block>[],
  ukBlocks: ReturnType<typeof block>[],
) {
  return mergeLocales(localizedBody("en", enBlocks), localizedBody("da", daBlocks), localizedBody("uk", ukBlocks));
}

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

function cta(en: string, da: string, uk: string, href: string) {
  return { label: tri(en, da, uk), href };
}

type Tri = readonly [string, string, string];

function iconCard(icon: string, en: string, da: string, uk: string, text?: Tri) {
  return {
    _type: "iconCard",
    icon,
    title: tri(en, da, uk),
    ...(text ? { text: triText(...text) } : {}),
  };
}

function titledText(key: string, title: Tri | null, text: Tri) {
  return {
    _key: key,
    _type: "titledText",
    ...(title ? { title: tri(...title) } : {}),
    text: triText(...text),
  };
}

// ---------------------------------------------------------------------------
// Common recurring phrases (kept consistent everywhere they repeat)
// ---------------------------------------------------------------------------

const T = {
  centralCopenhagen: ["Central Copenhagen", "Centralt i København", "У центрі Копенгагена"] as const,
  upTo12Guests: ["Up to 12 guests", "Op til 12 gæster", "До 12 гостей"] as const,
  onSiteSupport: ["On-site support", "Support på stedet", "Підтримка на місці"] as const,
  hostAtRorum: ["Host at RORUM", "Vær vært hos RORUM", "Проведіть подію в RORUM"] as const,
  attendEvents: ["Attend Events", "Deltag i events", "Відвідати події"] as const,
  catering: ["Catering", "Catering", "Кейтеринг"] as const,
  eventDecoration: ["Event Decoration", "Eventdekoration", "Декор подій"] as const,
  eventDecorationLower: ["Event decoration", "Eventdekoration", "Декор подій"] as const,
  haveQuestions: ["Have questions?", "Har du spørgsmål?", "Маєте запитання?"] as const,
  readFaqs: ["Read our FAQs", "Læs vores FAQ", "Переглянути поширені запитання"] as const,
  about: ["About", "Om os", "Про нас"] as const,
  contact: ["Contact", "Kontakt", "Контакти"] as const,
  community: ["Community", "Fællesskab", "Спільнота"] as const,
  services: ["Services", "Services", "Послуги"] as const,
  faq: ["FAQ", "FAQ", "Поширені запитання"] as const,
  workWithUs: ["Work with us", "Arbejd med os", "Працюйте з нами"] as const,
  volunteerWithUs: ["Volunteer with us", "Bliv frivillig hos os", "Станьте волонтером"] as const,
  wecodaMembership: ["WECODA membership", "WECODA-medlemskab", "Членство i WECODA"] as const,
  address: ["Address", "Adresse", "Адреса"] as const,
  arrival: ["Arrival", "Ankomst", "Прибуття"] as const,
  duration: ["Duration", "Varighed", "Тривалість"] as const,
  language: ["Language", "Sprog", "Мова"] as const,
  tickets: ["Tickets", "Billetter", "Квитки"] as const,
  arrivalNote: [
    "Please arrive 5-10 minutes before the event begins.",
    "Ankom venligst 5-10 minutter, før arrangementet begynder.",
    "Будь ласка, прийдіть за 5-10 хвилин до початку події.",
  ] as const,
  ticketsExternal: [
    "Purchased externally via Billetto",
    "Købes eksternt via Billetto",
    "Придбання через зовнішній сервіс Billetto",
  ] as const,
  english: ["English", "Engelsk", "Англійська"] as const,
  danish: ["Danish", "Dansk", "Данська"] as const,
  ukrainian: ["Ukrainian", "Ukrainsk", "Українська"] as const,
};

// ---------------------------------------------------------------------------
// homePage
// ---------------------------------------------------------------------------

const homePageFields = {
  heroLabel: tri("Copenhagen event space", "Begivenhedslokale i København", "Простір для подій у Копенгагені"),
  heroTitle: tri(
    "A Copenhagen space for meaningful gatherings",
    "Et rum i København til meningsfulde sammenkomster",
    "Простір у Копенгагені для змістовних зустрічей",
  ),
  heroText: triText(
    "Attend events or host your own gathering in a calm, thoughtfully prepared space with support from the RORUM team.",
    "Deltag i events eller vær vært for din egen sammenkomst i et roligt, gennemtænkt indrettet rum med støtte fra RORUM-teamet.",
    "Відвідуйте події або організуйте власну зустріч у спокійному, продумано облаштованому просторі за підтримки команди RORUM.",
  ),
  heroTrustItems: [
    triBullet("t0", ...T.upTo12Guests),
    triBullet("t1", ...T.centralCopenhagen),
    triBullet("t2", ...T.onSiteSupport),
    triBullet(
      "t3",
      "Catering & decoration available",
      "Catering & dekoration tilgængeligt",
      "Доступні кейтеринг і декор",
    ),
  ],
  heroPrimaryCta: cta(...T.hostAtRorum, "/host-at-rorum"),
  heroSecondaryCta: cta(...T.attendEvents, "/events"),
  quickPaths: [
    {
      _key: "qp0",
      title: tri(...T.attendEvents),
      text: triText(
        "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
        "Oplev workshops, samtaler og fællesskabsoplevelser i hjertet af København.",
        "Відкрийте для себе воркшопи, розмови та спільнотні події в самому серці Копенгагена.",
      ),
    },
    {
      _key: "qp1",
      title: tri(...T.hostAtRorum),
      text: triText(
        "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
        "Et varmt og fleksibelt lokale i København til workshops, møder og fællesskabsarrangementer for op til 12 gæster.",
        "Теплий і гнучкий простір у Копенгагені для воркшопів, зустрічей та спільнотних зібрань до 12 гостей.",
      ),
    },
    {
      _key: "qp2",
      title: tri(...T.catering),
      text: triText(
        "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
        "Frisk, enkel og elegant catering til møder, private sammenkomster, workshops og særlige øjeblikke.",
        "Свіжий, простий та елегантний кейтеринг для зустрічей, приватних заходів, воркшопів та особливих моментів.",
      ),
    },
    {
      _key: "qp3",
      title: tri(...T.eventDecoration),
      text: triText(
        "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
        "Blomster, bordstyling, lys og visuelle detaljer designet til at skabe en varm og mindeværdig atmosfære.",
        "Квіти, сервірування столу, свічки та візуальні деталі, створені для теплої й незабутньої атмосфери.",
      ),
    },
  ],
  eventsLabel: tri("What's on", "Hvad sker der", "Що відбувається"),
  eventsTitle: tri(
    "Upcoming events at RORUM",
    "Kommende events hos RORUM",
    "Найближчі події в RORUM",
  ),
  attendEventsFeature: {
    eyebrow: tri("Meaningful Gatherings", "Meningsfulde sammenkomster", "Змістовні зустрічі"),
    title: tri(...T.attendEvents),
    intro: triText(
      "Join meaningful gatherings at RORUM.",
      "Vær med til meningsfulde sammenkomster hos RORUM.",
      "Приєднуйтесь до змістовних зустрічей у RORUM.",
    ),
    description: triText(
      "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
      "Oplev workshops, samtaler og fællesskabsoplevelser i hjertet af København.",
      "Відкрийте для себе воркшопи, розмови та спільнотні події в самому серці Копенгагена.",
    ),
    features: [
      triBullet("f0", "Small-group experiences", "Oplevelser i mindre grupper", "Досвід у невеликих групах"),
      triBullet("f1", "Up to 12 participants", "Op til 12 deltagere", "До 12 учасників"),
      triBullet("f2", ...T.centralCopenhagen),
      triBullet("f3", "Community-focused", "Fællesskabsfokuseret", "Орієнтовано на спільноту"),
    ],
    cta: cta(...T.attendEvents, "/events"),
    reversed: false,
  },
  hostAtRorumFeature: {
    eyebrow: tri("Your Gathering", "Din sammenkomst", "Ваша подія"),
    title: tri(...T.hostAtRorum),
    intro: triText(
      "Host your gathering at RORUM.",
      "Vær vært for din sammenkomst hos RORUM.",
      "Проведіть вашу подію в RORUM.",
    ),
    description: triText(
      "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
      "Et varmt og fleksibelt lokale i København til workshops, møder og fællesskabsarrangementer for op til 12 gæster.",
      "Теплий і гнучкий простір у Копенгагені для воркшопів, зустрічей та спільнотних зібрань до 12 гостей.",
    ),
    features: [
      triBullet("f0", ...T.upTo12Guests),
      triBullet("f1", "Flexible room setup", "Fleksibel rumindretning", "Гнучке облаштування простору"),
      triBullet("f2", ...T.centralCopenhagen),
      triBullet("f3", ...T.onSiteSupport),
    ],
    cta: cta(...T.hostAtRorum, "/host-at-rorum"),
    reversed: true,
  },
  closingSection: {
    eyebrow: tri(
      "Not sure where to start?",
      "Ikke sikker på, hvor du skal starte?",
      "Не знаєте, з чого почати?",
    ),
    title: tri(
      "Let's shape your idea together",
      "Lad os forme din idé sammen",
      "Разом втілимо вашу ідею",
    ),
    text: triText(
      "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
      "Uanset om du planlægger en workshop, en privat session, et fællesskabsarrangement, en cateringforespørgsel eller en idé til eventstyling — fortæl os, hvad du har i tankerne, så hjælper vi dig med at finde det rette format.",
      "Незалежно від того, чи плануєте ви воркшоп, приватну зустріч, спільнотний захід, запит на кейтеринг чи ідею оформлення події — розкажіть нам, що ви маєте на увазі, і ми допоможемо знайти правильний формат.",
    ),
    cta: cta("Let's talk", "Lad os tale sammen", "Поговорімо", "/contact"),
    faqQuestion: tri(...T.haveQuestions),
    faqLabel: tri(...T.readFaqs),
    links: [
      { _key: "l0", href: "/events", label: tri(...T.attendEvents) },
      { _key: "l1", href: "/host-at-rorum", label: tri(...T.hostAtRorum) },
      { _key: "l2", href: "/catering", label: tri(...T.catering) },
      { _key: "l3", href: "/event-decoration", label: tri(...T.eventDecorationLower) },
    ],
  },
  seo: {
    title: tri(
      "RORUM | Creative Event Space in Copenhagen",
      "RORUM | Kreativt eventlokale i København",
      "RORUM | Творчий простір для подій у Копенгагені",
    ),
    description: triText(
      "RORUM is a warm Copenhagen space for meaningful events, hosted gatherings and community experiences.",
      "RORUM er et varmt lokale i København til meningsfulde events, værtsskabsarrangementer og fællesskabsoplevelser.",
      "RORUM — це теплий простір у Копенгагені для змістовних подій, зустрічей і спільнотних заходів.",
    ),
  },
  servicesLabel: tri(...T.services),
  servicesTitle: tri(
    "Services for thoughtful gatherings",
    "Services til gennemtænkte sammenkomster",
    "Послуги для продуманих подій",
  ),
  services: [
    {
      _key: "svc0",
      _type: "serviceTeaser",
      title: tri(...T.catering),
      text: triText(
        "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
        "Frisk, enkel og elegant catering til møder, private sammenkomster, workshops og særlige øjeblikke.",
        "Свіжий, простий та елегантний кейтеринг для зустрічей, приватних заходів, воркшопів та особливих моментів.",
      ),
      cta: tri("Explore catering", "Udforsk catering", "Дізнатися про кейтеринг"),
      href: "/catering",
    },
    {
      _key: "svc1",
      _type: "serviceTeaser",
      title: tri(...T.eventDecorationLower),
      text: triText(
        "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
        "Blomster, bordstyling, lys og visuelle detaljer designet til at skabe en varm og mindeværdig atmosfære.",
        "Квіти, сервірування столу, свічки та візуальні деталі, створені для теплої й незабутньої атмосфери.",
      ),
      cta: tri("Explore decoration", "Udforsk dekoration", "Дізнатися про декор"),
      href: "/event-decoration",
    },
  ],
  communityLabel: tri(...T.community),
  communityTitle: tri("More than a space", "Mere end et lokale", "Більше, ніж простір"),
  communityText: triText(
    "RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.",
    "RORUM er et sted for events, idéer og meningsfulde forbindelser. Bliv en del af vores fællesskab, samarbejd med os, eller bliv en del af teamet bag oplevelserne.",
    "RORUM — це місце для подій, ідей і значущих зв'язків. Приєднуйтесь до нашої спільноти, співпрацюйте з нами або станьте частиною команди, що створює ці події.",
  ),
  communityLinks: [
    { _key: "cl0", _type: "communityLink", label: tri(...T.wecodaMembership), href: "/community-membership" },
    { _key: "cl1", _type: "communityLink", label: tri(...T.workWithUs), href: "/work-with-us" },
    { _key: "cl2", _type: "communityLink", label: tri(...T.volunteerWithUs), href: "/volunteer" },
  ],
};

// ---------------------------------------------------------------------------
// aboutPage
// ---------------------------------------------------------------------------

const aboutPageFields = {
  heroLabel: tri(...T.about),
  heroTitle: tri("About RORUM", "Om RORUM", "Про RORUM"),
  heroLead: triText(
    "RORUM is a curated creative and event space in central Copenhagen, designed for small teams, founders, facilitators, hosts and community-minded guests who want gatherings to feel warm, clear and easy to be present in.",
    "RORUM er et kurateret kreativt eventlokale centralt i København, designet til mindre teams, iværksættere, facilitatorer, værter og fællesskabsorienterede gæster, der ønsker, at sammenkomster skal føles varme, klare og nemme at være til stede i.",
    "RORUM — це кураторський творчий та подієвий простір у центрі Копенгагена, створений для невеликих команд, засновників, фасилітаторів, ведучих і гостей, орієнтованих на спільноту, які хочуть, щоб зустрічі відчувалися теплими, зрозумілими та комфортними.",
  ),
  statementTitle: tri(...T.services),
  statementText: triText(
    "Our catering and decoration services are available off-site and can be brought to your chosen location.",
    "Vores catering- og dekorationsservices er tilgængelige uden for stedet og kan bringes til din valgte lokation.",
    "Наші послуги кейтерингу та декору доступні поза приміщенням RORUM і можуть бути надані у вибраному вами місці.",
  ),
  values: [
    titledText("v0", null, [
      "RORUM is also shaped by members, collaborators and people who want to support thoughtful local gatherings.",
      "RORUM formes også af medlemmer, samarbejdspartnere og mennesker, der ønsker at støtte gennemtænkte lokale sammenkomster.",
      "RORUM також формують учасники, партнери та люди, які хочуть підтримувати продумані локальні зустрічі.",
    ]),
  ],
  pillarsLabel: tri("Experience principles", "Erfaringsprincipper", "Принципи досвіду"),
  pillars: [
    titledText(
      "p0",
      ["Calm first", "Ro først", "Спокій понад усе"],
      [
        "The space should help guests arrive, settle and understand where they are.",
        "Rummet skal hjælpe gæsterne med at ankomme, falde til ro og forstå, hvor de er.",
        "Простір має допомогти гостям прибути, влаштуватися та зрозуміти, де вони перебувають.",
      ],
    ),
    titledText(
      "p1",
      ["Useful hospitality", "Nyttig gæstfrihed", "Практична гостинність"],
      [
        "Coffee, water, food, layout and timing are treated as part of the experience.",
        "Kaffe, vand, mad, indretning og timing betragtes som en del af oplevelsen.",
        "Кава, вода, їжа, планування простору та тайминг є частиною досвіду.",
      ],
    ),
    titledText(
      "p2",
      ["Flexible but not blank", "Fleksibel, men ikke tom", "Гнучкість без порожнечі"],
      [
        "Tables, seating, screen, Wi-Fi and styling options give hosts a clear starting point.",
        "Borde, siddepladser, skærm, Wi-Fi og stylingmuligheder giver værter et klart udgangspunkt.",
        "Столи, місця, екран, Wi-Fi та варіанти оформлення дають організаторам чітку відправну точку.",
      ],
    ),
    titledText(
      "p3",
      ["Personal without noise", "Personlig uden støj", "Особисте без зайвого шуму"],
      [
        "The space has character, but leaves enough space for each format to feel like its own.",
        "Rummet har karakter, men efterlader plads nok til, at hvert format kan føles som sit eget.",
        "Простір має характер, але залишає достатньо місця, щоб кожен формат відчувався по-своєму.",
      ],
    ),
  ],
  locationTitle: tri("Thoughtful and practical", "Gennemtænkt og praktisk", "Продумано та практично"),
  locationText: triText(
    "These principles shape the way RORUM approaches meetings, hosted events, catering, decoration and community collaborations.",
    "Disse principper former den måde, RORUM tilgår møder, værtsskabsarrangementer, catering, dekoration og fællesskabssamarbejder på.",
    "Ці принципи визначають підхід RORUM до зустрічей, організованих подій, кейтерингу, декору та спільнотних співпраць.",
  ),
  seo: {
    title: tri(...T.about),
    description: triText(
      "Learn about RORUM, a small curated ground-floor creative and event space in Copenhagen.",
      "Lær mere om RORUM, et lille kurateret kreativt eventlokale i stueetagen i København.",
      "Дізнайтеся більше про RORUM — невеликий кураторський творчий та подієвий простір на першому поверсі в Копенгагені.",
    ),
  },
  closingSection: {
    eyebrow: tri(
      "Not sure where to start?",
      "Ikke sikker på, hvor du skal starte?",
      "Не знаєте, з чого почати?",
    ),
    title: tri(
      "Let's shape your idea together",
      "Lad os forme din idé sammen",
      "Разом втілимо вашу ідею",
    ),
    text: triText(
      "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
      "Uanset om du planlægger en workshop, en privat session, et fællesskabsarrangement, en cateringforespørgsel eller en idé til eventstyling — fortæl os, hvad du har i tankerne, så hjælper vi dig med at finde det rette format.",
      "Незалежно від того, чи плануєте ви воркшоп, приватну зустріч, спільнотний захід, запит на кейтеринг чи ідею оформлення події — розкажіть нам, що ви маєте на увазі, і ми допоможемо знайти правильний формат.",
    ),
    cta: cta("Let's talk", "Lad os tale sammen", "Поговорімо", "/contact"),
    faqQuestion: tri(...T.haveQuestions),
    faqLabel: tri(...T.readFaqs),
    links: [
      { _key: "l0", href: "/events", label: tri(...T.attendEvents) },
      { _key: "l1", href: "/host-at-rorum", label: tri(...T.hostAtRorum) },
      { _key: "l2", href: "/catering", label: tri(...T.catering) },
      { _key: "l3", href: "/event-decoration", label: tri(...T.eventDecorationLower) },
    ],
  },
};

// ---------------------------------------------------------------------------
// cateringPage
// ---------------------------------------------------------------------------

const cateringPageFields = {
  hero: {
    label: tri(...T.catering),
    title: tri(...T.catering),
    text: triText(
      "Traditional Ukrainian cuisine in harmonious combination with modern European gastronomy. We create not just dishes, but an atmosphere where taste, aesthetics, and service work together.",
      "Traditionelt ukrainsk køkken i harmonisk kombination med moderne europæisk gastronomi. Vi skaber ikke bare retter, men en stemning, hvor smag, æstetik og service går op i en højere enhed.",
      "Традиційна українська кухня в гармонійному поєднанні з сучасною європейською гастрономією. Ми створюємо не просто страви, а атмосферу, де смак, естетика та сервіс працюють разом.",
    ),
    primaryCta: cta(
      "Request catering",
      "Anmod om catering",
      "Замовити кейтеринг",
      "#catering-inquiry",
    ),
  },
  menuFormatsTitle: tri("Menu Formats", "Menuformater", "Формати меню"),
  menuFormats: [
    {
      _key: "mf0",
      title: tri("Private dinner menu", "Privat middagsmenu", "Меню для приватної вечері"),
      description: triText(
        "A seated dinner with seasonal starters, main courses, sides, and desserts.",
        "En siddende middag med sæsonbaserede forretter, hovedretter, tilbehør og desserter.",
        "Вечеря за столом із сезонними закусками, основними стравами, гарнірами та десертами.",
      ),
    },
    {
      _key: "mf1",
      title: tri("Reception-style menu", "Reception-menu", "Меню в стилі фуршету"),
      description: triText(
        "Elegant light dishes, small bites, and shareable plates.",
        "Elegante, lette retter, små snacks og fælles serveringsfade.",
        "Елегантні легкі страви, невеликі закуски та тарілки для спільного частування.",
      ),
    },
    {
      _key: "mf2",
      title: tri("Business meeting menu", "Menu til forretningsmøder", "Меню для бізнес-зустрічей"),
      description: triText(
        "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
        "Afbalancerede retter, der er nemme at servere, og som passer til workshops, præsentationer og længere møder.",
        "Збалансовані страви, які легко подавати — підходять для воркшопів, презентацій і довших зустрічей.",
      ),
    },
  ],
  formats: [
    iconCard(
      "ChefHat",
      "Ukrainian cuisine",
      "Ukrainsk køkken",
      "Українська кухня",
      [
        "Traditional Ukrainian cuisine in harmony with modern European gastronomy, created with attention to taste, presentation and detail.",
        "Traditionelt ukrainsk køkken i harmoni med moderne europæisk gastronomi, skabt med opmærksomhed på smag, præsentation og detaljer.",
        "Традиційна українська кухня в гармонії з сучасною європейською гастрономією, створена з увагою до смаку, подачі та деталей.",
      ],
    ),
    iconCard(
      "HandPlatter",
      "Finger food & buffet",
      "Fingermad & buffet",
      "Закуски та фуршет",
      [
        "Elegant small bites, light buffet solutions and beautifully served dishes for receptions, celebrations and business events.",
        "Elegante små snacks, lette buffetløsninger og smukt anrettede retter til receptioner, fejringer og erhvervsarrangementer.",
        "Елегантні невеликі закуски, легкі варіанти фуршету та гарно подані страви для прийомів, свят і бізнес-заходів.",
      ],
    ),
    iconCard(
      "ClipboardList",
      "Individual menu",
      "Individuel menu",
      "Індивідуальне меню",
      [
        "Each menu is tailored to your event format, number of guests, preferences and desired atmosphere.",
        "Hver menu er tilpasset dit eventformat, antal gæster, præferencer og den ønskede stemning.",
        "Кожне меню створюється з урахуванням формату вашої події, кількості гостей, уподобань та бажаної атмосфери.",
      ],
    ),
    iconCard(
      "CookingPot",
      "On-site cooking",
      "Madlavning på stedet",
      "Приготування на місці",
      [
        "If needed, we can organize cooking directly at your location for a fresh, seamless and memorable experience.",
        "Om nødvendigt kan vi arrangere madlavning direkte på din lokation for en frisk, sømløs og mindeværdig oplevelse.",
        "За потреби ми можемо організувати приготування страв безпосередньо на вашій локації для свіжого й незабутнього досвіду.",
      ],
    ),
    iconCard(
      "ConciergeBell",
      "Full event support",
      "Fuld eventsupport",
      "Повна подієва підтримка",
      [
        "Our professional team can support the event with preparation, serving and attentive service throughout the occasion.",
        "Vores professionelle team kan understøtte arrangementet med forberedelse, servering og opmærksom service under hele forløbet.",
        "Наша професійна команда підтримує подію на всіх етапах — від підготовки до подачі та уважного обслуговування.",
      ],
    ),
    iconCard(
      "Flame",
      "Grill parties",
      "Grillfester",
      "Гриль-вечірки",
      [
        "Lively grill experiences for warm, informal gatherings where food, conversation and atmosphere come together.",
        "Livlige grilloplevelser til varme, uformelle sammenkomster, hvor mad, samtale og stemning går op i en højere enhed.",
        "Жваві гриль-заходи для теплих, невимушених зустрічей, де їжа, спілкування та атмосфера поєднуються.",
      ],
    ),
  ],
  suitableForLabel: tri("Suitable for:", "Velegnet til:", "Підходить для:"),
  suitableFor: [
    iconCard("CalendarCheck", ...T.hostAtRorum),
    iconCard("Presentation", "Workshops", "Workshops", "Воркшопи"),
    iconCard("Handshake", "Community events", "Fællesskabsarrangementer", "Спільнотні заходи"),
    iconCard("Lightbulb", "Creative sessions", "Kreative sessioner", "Творчі сесії"),
    iconCard("BriefcaseBusiness", "Founder sessions", "Sessioner for iværksættere", "Зустрічі для засновників"),
    iconCard("Cake", "Birthdays", "Fødselsdage", "Дні народження"),
    iconCard("Gem", "Weddings", "Bryllupper", "Весілля"),
    iconCard("Landmark", "Diplomatic meetings", "Diplomatiske møder", "Дипломатичні зустрічі"),
    iconCard("Building2", "Business meetings", "Forretningsmøder", "Бізнес-зустрічі"),
    iconCard("Users", "Conferences", "Konferencer", "Конференції"),
    iconCard("PartyPopper", "External events", "Eksterne arrangementer", "Зовнішні заходи"),
    iconCard("CircleEllipsis", "And more", "Og mere", "І багато іншого"),
  ],
  philosophyTitle: tri(
    "What we offer",
    "Hvad vi tilbyder",
    "Що ми пропонуємо",
  ),
  philosophyText: triText(
    "We create catering for different types of events - from elegant finger food and light buffet solutions to full menus for family celebrations, corporate events and official occasions. Each menu is developed individually, combining authentic Ukrainian recipes with a modern European approach, thoughtful presentation and attentive service.",
    "Vi skaber catering til forskellige typer arrangementer - fra elegant fingermad og lette buffetløsninger til fulde menuer til familiefester, virksomhedsarrangementer og officielle lejligheder. Hver menu udvikles individuelt og kombinerer autentiske ukrainske opskrifter med en moderne europæisk tilgang, gennemtænkt præsentation og opmærksom service.",
    "Ми створюємо кейтеринг для різних типів подій — від елегантних закусок і легких варіантів фуршету до повних меню для сімейних свят, корпоративних заходів та офіційних подій. Кожне меню розробляється індивідуально, поєднуючи автентичні українські рецепти з сучасним європейським підходом, продуманою подачею та уважним сервісом.",
  ),
  tailoredNote: titledText(
    "tn",
    ["Tailored upon request", "Skræddersyet efter ønske", "Індивідуально за запитом"],
    [
      "Every catering concept is created individually based on your event, location, guest count and wishes.",
      "Hvert cateringkoncept skabes individuelt baseret på dit event, lokation, antal gæster og ønsker.",
      "Кожна концепція кейтерингу створюється індивідуально з урахуванням вашої події, локації, кількості гостей і побажань.",
    ],
  ),
  stepsTitle: tri("3-step setup", "3-trins forløb", "Налаштування у 3 кроки"),
  steps: [
    titledText(
      "s0",
      ["Tell us about your event", "Fortæl os om dit event", "Розкажіть нам про вашу подію"],
      [
        "Share the date, location, guest count and format.",
        "Del dato, lokation, antal gæster og format.",
        "Поділіться датою, місцем проведення, кількістю гостей і форматом.",
      ],
    ),
    titledText(
      "s1",
      [
        "We suggest the right setup",
        "Vi foreslår den rette løsning",
        "Ми запропонуємо правильний варіант",
      ],
      [
        "We help match the catering format to the rhythm and atmosphere of your event.",
        "Vi hjælper med at matche cateringformatet til rytmen og stemningen i dit event.",
        "Ми допоможемо підібрати формат кейтерингу відповідно до ритму й атмосфери вашої події.",
      ],
    ),
    titledText(
      "s2",
      [
        "We prepare the experience",
        "Vi forbereder oplevelsen",
        "Ми готуємо досвід",
      ],
      [
        "Food and presentation are arranged with care so your guests feel welcomed.",
        "Mad og præsentation arrangeres med omhu, så dine gæster føler sig velkomne.",
        "Їжа та подача організовуються з увагою, щоб ваші гості почувалися бажаними.",
      ],
    ),
  ],
  inquiryIntro: triText(
    "Tell us about your event and we will help you find the right catering format.",
    "Fortæl os om dit event, så hjælper vi dig med at finde det rette cateringformat.",
    "Розкажіть нам про вашу подію, і ми допоможемо підібрати правильний формат кейтерингу.",
  ),
  seo: {
    title: tri(...T.catering),
    description: triText(
      "Warm Scandinavian catering for workshops, meetings and intimate events.",
      "Varm skandinavisk catering til workshops, møder og intime arrangementer.",
      "Тепла скандинавська кухня для воркшопів, зустрічей та камерних подій.",
    ),
  },
  inquiryTitle: tri("Request catering", "Anmod om catering", "Замовити кейтеринг"),
  inquirySubmitLabel: tri("Request Catering", "Anmod om catering", "Замовити кейтеринг"),
  messagePlaceholder: triText(
    "Describe your event, timing and catering wishes.",
    "Beskriv dit event, tidspunkt og cateringønsker.",
    "Опишіть вашу подію, час і побажання щодо кейтерингу.",
  ),
  successMessage: triText(
    "Thank you. We've received your catering request and will contact you soon.",
    "Tak. Vi har modtaget din cateringforespørgsel og kontakter dig snart.",
    "Дякуємо. Ми отримали ваш запит на кейтеринг і незабаром зв'яжемося з вами.",
  ),
  footerNote: tri(
    "We'll only use your details to respond to your catering request.",
    "Vi bruger kun dine oplysninger til at besvare din cateringforespørgsel.",
    "Ми використаємо ваші дані лише для відповіді на запит щодо кейтерингу.",
  ),
  menuOverlay: {
    triggerLabel: tri("Menu examples", "Menu-eksempler", "Приклади меню"),
    title: tri("Catering menu", "Cateringmenu", "Меню кейтерингу"),
    intro: [
      triBulletParagraph(
        "mo0",
        "Traditional Ukrainian hospitality, Danish classics, and European-style service for hosted meetings, celebrations, and special gatherings.",
        "Traditionel ukrainsk gæstfrihed, danske klassikere og europæisk stil service til værtsskabsmøder, fejringer og særlige sammenkomster.",
        "Традиційна українська гостинність, данська класика та європейський стиль обслуговування для зустрічей, свят та особливих подій.",
      ),
      triBulletParagraph(
        "mo1",
        "Each menu is created individually based on your event format, number of guests, season, and dietary preferences.",
        "Hver menu udarbejdes individuelt baseret på dit eventformat, antal gæster, sæson og kostpræferencer.",
        "Кожне меню створюється індивідуально з урахуванням формату вашої події, кількості гостей, сезону та харчових уподобань.",
      ),
    ],
    requestCta: tri("Request custom menu", "Anmod om skræddersyet menu", "Замовити індивідуальне меню"),
    featuredDishesLabel: tri("Featured Dishes", "Udvalgte retter", "Обрані страви"),
    disclaimerNote: triText(
      "The dishes shown are examples of what we can offer. We'll be happy to create a menu tailored to your event, preferences, and guests.",
      "Retterne vist er eksempler på, hvad vi kan tilbyde. Vi skaber gerne en menu, der er skræddersyet til dit event, dine præferencer og dine gæster.",
      "Показані страви є прикладами того, що ми можемо запропонувати. Ми з радістю створимо меню, адаптоване до вашої події, уподобань та гостей.",
    ),
    customMenuTitle: tri("Create your custom menu", "Skab din skræddersyede menu", "Створіть своє індивідуальне меню"),
    customMenuText: triText(
      "Tell us about your event, number of guests, preferred cuisine, and dietary needs. We will help create a menu that fits your occasion and makes your guests feel welcome.",
      "Fortæl os om dit event, antal gæster, foretrukne køkken og kostbehov. Vi hjælper med at skabe en menu, der passer til lejligheden og får dine gæster til at føle sig velkomne.",
      "Розкажіть нам про вашу подію, кількість гостей, бажану кухню та харчові потреби. Ми допоможемо створити меню, яке підходить для вашої події та порадує гостей.",
    ),
    backToCateringCta: tri("Back to Catering", "Tilbage til catering", "Назад до кейтерингу"),
  },
};

// ---------------------------------------------------------------------------
// eventDecorationPage
// ---------------------------------------------------------------------------

const eventDecorationPageFields = {
  hero: {
    label: tri(...T.eventDecoration),
    title: tri(...T.eventDecoration),
    text: triText(
      "Flowers, table styling, candles, balloon decor and visual details for warm, memorable events at RORUM or selected external locations.",
      "Blomster, bordstyling, lys, balloner og visuelle detaljer til varme, mindeværdige events hos RORUM eller udvalgte eksterne lokationer.",
      "Квіти, сервірування столу, свічки, кульковий декор і візуальні деталі для теплих, незабутніх подій у RORUM або на обраних локаціях.",
    ),
    primaryCta: cta(
      "Request decoration",
      "Anmod om dekoration",
      "Замовити декор",
      "#decoration-inquiry",
    ),
  },
  stylingLabel: tri("Decoration", "Dekoration", "Декор"),
  stylingTitle: tri("What we style", "Hvad vi styler", "Що ми оформлюємо"),
  stylingIntro: [
    triBulletParagraph(
      "si0",
      "We create decoration concepts that bring warmth, beauty and personality to your event.",
      "Vi skaber dekorationskoncepter, der bringer varme, skønhed og personlighed til dit event.",
      "Ми створюємо концепції декору, що додають вашій події теплоти, краси та індивідуальності.",
    ),
    triBulletParagraph(
      "si1",
      "Our styling can include table settings, seasonal flowers, candles, balloon accents, textiles, decorative objects, photo moments and personal details. Each element is selected to work together as one cohesive atmosphere.",
      "Vores styling kan omfatte borddækning, sæsonblomster, lys, ballonaccenter, tekstiler, dekorative genstande, fotomomenter og personlige detaljer. Hvert element vælges, så det tilsammen skaber én sammenhængende stemning.",
      "Наше оформлення може включати сервірування столу, сезонні квіти, свічки, кулькові акценти, текстиль, декоративні елементи, фотозони та особисті деталі. Кожен елемент підбирається так, щоб створити цілісну атмосферу.",
    ),
  ],
  formats: [
    iconCard(
      "UtensilsCrossed",
      "Table styling",
      "Bordstyling",
      "Сервірування столу",
      [
        "Elegant table setups with flowers, candles, place details and carefully selected visual accents.",
        "Elegante borddækninger med blomster, lys, kuvertdetaljer og omhyggeligt udvalgte visuelle accenter.",
        "Елегантне сервірування столу з квітами, свічками, деталями сервіровки та ретельно підібраними візуальними акцентами.",
      ],
    ),
    iconCard(
      "Flower",
      "Florals",
      "Blomster",
      "Флористика",
      [
        "Seasonal floral arrangements designed around your event mood, space and color palette.",
        "Sæsonbaserede blomsterarrangementer designet ud fra dit events stemning, rum og farvepalette.",
        "Сезонні флористичні композиції, розроблені відповідно до настрою вашої події, простору та кольорової палітри.",
      ],
    ),
    iconCard(
      "Balloon",
      "Balloon accents",
      "Ballonaccenter",
      "Кулькові акценти",
      [
        "Soft and elegant balloon decor for entrances, celebration corners, photo zones and backdrops.",
        "Blødt og elegant ballondekor til indgange, festhjørner, fotozoner og baggrunde.",
        "М'який та елегантний кульковий декор для входів, святкових зон, фотозон і фонів.",
      ],
    ),
    iconCard(
      "Flame",
      "Atmosphere details",
      "Atmosfæredetaljer",
      "Атмосферні деталі",
      [
        "Candles, textures, fabrics, signs and decorative objects that make the space feel warm and complete.",
        "Lys, teksturer, stoffer, skilte og dekorative genstande, der får rummet til at føles varmt og fuldendt.",
        "Свічки, текстури, тканини, таблички та декоративні предмети, що роблять простір теплим і завершеним.",
      ],
    ),
    iconCard(
      "BadgeCheck",
      "Personal touches",
      "Personlige detaljer",
      "Особисті штрихи",
      [
        "Custom details for birthdays, weddings, dinners, workshops, private celebrations and meaningful moments.",
        "Skræddersyede detaljer til fødselsdage, bryllupper, middage, workshops, private fejringer og betydningsfulde øjeblikke.",
        "Індивідуальні деталі для днів народження, весіль, вечерь, воркшопів, приватних свят та особливих моментів.",
      ],
    ),
  ],
  suitableForLabel: tri("Suitable for:", "Velegnet til:", "Підходить для:"),
  suitableFor: [
    iconCard("CalendarCheck", "Private events", "Private arrangementer", "Приватні події"),
    iconCard("Gem", "Weddings", "Bryllupper", "Весілля"),
    iconCard("PartyPopper", "Birthdays", "Fødselsdage", "Дні народження"),
    iconCard("Lightbulb", "Workshops", "Workshops", "Воркшопи"),
    iconCard("UtensilsCrossed", "Dinner tables", "Middagsborde", "Святкові столи"),
    iconCard("Sparkles", "Photo corners", "Fotohjørner", "Фотозони"),
    iconCard("Flower2", "Seasonal moments", "Sæsonmomenter", "Сезонні моменти"),
    iconCard("CircleEllipsis", "And more", "Og mere", "І багато іншого"),
  ],
  tailoredNote: titledText(
    "tn",
    ["Tailored upon request", "Skræddersyet efter ønske", "Індивідуально за запитом"],
    [
      "We create each setup individually according to your event format, location and wishes.",
      "Vi skaber hver opsætning individuelt ud fra dit eventformat, lokation og ønsker.",
      "Ми створюємо кожне оформлення індивідуально відповідно до формату події, локації та побажань.",
    ],
  ),
  stepsTitle: tri("3-step setup", "3-trins forløb", "Налаштування у 3 кроки"),
  steps: [
    titledText(
      "s0",
      ["Share the occasion", "Del anledningen", "Розкажіть про подію"],
      [
        "Tell us about the event format, date, guests and atmosphere you want.",
        "Fortæl os om eventformatet, dato, gæster og den stemning, du ønsker.",
        "Розкажіть про формат події, дату, гостей та бажану атмосферу.",
      ],
    ),
    titledText(
      "s1",
      [
        "We suggest the visual direction",
        "Vi foreslår den visuelle retning",
        "Ми запропонуємо візуальний напрямок",
      ],
      [
        "We match decoration details to the room, table and rhythm of the event.",
        "Vi matcher dekorationsdetaljer til rummet, bordet og eventets rytme.",
        "Ми підбираємо деталі декору відповідно до приміщення, столу та ритму події.",
      ],
    ),
    titledText(
      "s2",
      ["We prepare the setup", "Vi forbereder opsætningen", "Ми готуємо оформлення"],
      [
        "The decorative layer is arranged with care before guests arrive.",
        "Det dekorative lag arrangeres med omhu, før gæsterne ankommer.",
        "Декоративне оформлення готується з увагою до прибуття гостей.",
      ],
    ),
  ],
  inquiryIntro: triText(
    "Tell us what you are planning and we will suggest the right visual setup for your event.",
    "Fortæl os, hvad du planlægger, så foreslår vi den rette visuelle opsætning til dit event.",
    "Розкажіть, що ви плануєте, і ми запропонуємо правильне візуальне оформлення для вашої події.",
  ),
  seo: {
    title: tri("Space Decoration", "Rumdekoration", "Оформлення простору"),
    description: triText(
      "Thoughtful table settings, florals and atmosphere styling for RORUM events.",
      "Gennemtænkt borddækning, blomster og atmosfærestyling til RORUM-events.",
      "Продумане сервірування столу, флористика та оформлення атмосфери для подій RORUM.",
    ),
  },
  inquiryTitle: tri("Decoration request", "Dekorationsforespørgsel", "Запит на декор"),
  inquirySubmitLabel: tri("Send request", "Send forespørgsel", "Надіслати запит"),
  messagePlaceholder: triText(
    "Describe your event, location and desired visual setup.",
    "Beskriv dit event, sted og ønsket visuelt setup.",
    "Опишіть вашу подію, локацію та бажане візуальне оформлення.",
  ),
  successMessage: triText(
    "Thank you. Your request is ready for the RORUM team.",
    "Tak. Din forespørgsel er klar til RORUM-teamet.",
    "Дякуємо. Ваш запит передано команді RORUM.",
  ),
};

// ---------------------------------------------------------------------------
// hostAtRorumPage — non-package fields
// ---------------------------------------------------------------------------

const hostAtRorumPageFields = {
  hero: {
    label: tri(...T.hostAtRorum),
    title: tri(
      "Host Your Gathering at RORUM",
      "Vær vært for din sammenkomst hos RORUM",
      "Проведіть вашу подію в RORUM",
    ),
    text: triText(
      "RORUM is a small, curated space in central Copenhagen, designed for meetings, workshops, and private events for up to 12 guests. Ideal for small teams, founders, and curated gatherings. We offer a calm and well-organized setting, with support before and during your event.",
      "RORUM er et lille, kurateret lokale centralt i København, designet til møder, workshops og private arrangementer for op til 12 gæster. Ideelt til mindre teams, iværksættere og kuraterede sammenkomster. Vi tilbyder rolige og velorganiserede rammer med support før og under dit event.",
      "RORUM — це невеликий кураторський простір у центрі Копенгагена, створений для зустрічей, воркшопів і приватних подій до 12 гостей. Ідеально підходить для невеликих команд, засновників і кураторських зібрань. Ми пропонуємо спокійну, добре організовану обстановку з підтримкою до та під час вашої події.",
    ),
    primaryCta: cta("Apply to Host", "Ansøg om at være vært", "Подати заявку", "#request-private-meeting"),
    secondaryCta: cta(
      "View Packages & Pricing",
      "Se pakker & priser",
      "Переглянути пакети та ціни",
      "#meeting-packages",
    ),
  },
  sessionLabel: tri("Session details", "Sessionsdetaljer", "Деталі сесії"),
  sessionTitle: tri(
    "Each session includes:",
    "Hver session inkluderer:",
    "Кожна сесія включає:",
  ),
  includedItems: [
    triBullet("i0", "Use of the space", "Brug af lokalet", "Використання простору"),
    triBullet("i1", "Coffee, tea and water", "Kaffe, te og vand", "Кава, чай і вода"),
    triBullet("i2", ...T.onSiteSupport),
    triBullet(
      "i3",
      "Simple and thoughtful interior setup",
      "Enkel og gennemtænkt indretning",
      "Просте й продумане облаштування інтер'єру",
    ),
    triBullet("i4", "Screen", "Skærm", "Екран"),
    triBullet("i5", "Wi-Fi", "Wi-Fi", "Wi-Fi"),
    triBullet("i6", "Tables and chairs", "Borde og stole", "Столи та стільці"),
  ],
  optionalLabel: tri("Optional", "Valgfrit", "Додатково"),
  optionalItems: [
    triBullet("o0", ...T.catering),
    triBullet("o1", "Customized food options", "Skræddersyede madvalg", "Індивідуальні варіанти харчування"),
  ],
  packagesLabel: tri("Packages", "Pakker", "Пакети"),
  packagesTitle: tri("Hosting Packages", "Værtspakker", "Пакети для проведення подій"),
  packagesIntro: triText(
    "Every event has its own atmosphere and unique requirements, which is why the packages below are simply examples of our most popular formats. Looking for something different? We would be happy to tailor the space and arrangements to your needs.",
    "Hvert event har sin egen stemning og unikke krav, hvorfor pakkerne nedenfor blot er eksempler på vores mest populære formater. Leder du efter noget andet? Vi hjælper gerne med at tilpasse lokalet og arrangementerne til dine behov.",
    "Кожна подія має власну атмосферу та унікальні вимоги, тому пакети нижче — лише приклади наших найпопулярніших форматів. Шукаєте щось інше? Ми з радістю адаптуємо простір і організацію під ваші потреби.",
  ),
  cancellationTitle: tri("Cancellation policy:", "Afbestillingspolitik:", "Політика скасування:"),
  cancellationItems: [
    triBullet(
      "c0",
      "Free cancellation up to 5 working days before",
      "Gratis afbestilling op til 5 hverdage før",
      "Безкоштовне скасування за 5 робочих днів",
    ),
    triBullet(
      "c1",
      "50% charge if cancelled within 24 hours before the event",
      "50% gebyr ved afbestilling inden for 24 timer før eventet",
      "Стягнення 50% при скасуванні протягом 24 годин до події",
    ),
    triBullet(
      "c2",
      "100% charge if cancelled less than 24 hours before",
      "100% gebyr ved afbestilling mindre end 24 timer før",
      "Стягнення 100% при скасуванні менш ніж за 24 години",
    ),
  ],
  stepsTitle: tri("3-step setup", "3-trins forløb", "Налаштування у 3 кроки"),
  steps: [
    titledText(
      "s0",
      [
        "Tell us about your gathering",
        "Fortæl os om din sammenkomst",
        "Розкажіть про вашу подію",
      ],
      [
        "Tell us the format, guest count, timing and what kind of atmosphere you need.",
        "Fortæl os om format, antal gæster, timing og hvilken stemning du ønsker.",
        "Розкажіть про формат, кількість гостей, час і бажану атмосферу.",
      ],
    ),
    titledText(
      "s1",
      ["We prepare the room", "Vi forbereder rummet", "Ми готуємо приміщення"],
      [
        "We align tables, chairs, screen, Wi-Fi and simple hosting details before you arrive.",
        "Vi klargør borde, stole, skærm, Wi-Fi og enkle værtsdetaljer, inden du ankommer.",
        "Ми готуємо столи, стільці, екран, Wi-Fi та інші деталі до вашого прибуття.",
      ],
    ),
    titledText(
      "s2",
      ["Arrive and focus", "Ankom og fokuser", "Прибувайте та зосереджуйтесь"],
      [
        "The space is ready for your workshop, gathering, or private session, with on-site support.",
        "Rummet er klar til din workshop, sammenkomst eller private session, med support på stedet.",
        "Простір готовий до вашого воркшопу, зустрічі чи приватної сесії з підтримкою на місці.",
      ],
    ),
  ],
  inquiryIntro: triText(
    "Tell us the format, guest count, timing and what kind of atmosphere you need, and we will help you find the right package.",
    "Fortæl os om format, antal gæster, timing og hvilken stemning du ønsker, så hjælper vi dig med at finde den rette pakke.",
    "Розкажіть про формат, кількість гостей, час і бажану атмосферу, і ми допоможемо підібрати правильний пакет.",
  ),
  seo: {
    title: tri(...T.hostAtRorum),
    description: triText(
      "Host workshops, meetings and intimate gatherings at RORUM.",
      "Vær vært for workshops, møder og intime sammenkomster hos RORUM.",
      "Проводьте воркшопи, зустрічі та камерні заходи в RORUM.",
    ),
  },
  inquiryTitle: tri("Apply to Host at RORUM", "Ansøg om at være vært hos RORUM", "Подати заявку на проведення в RORUM"),
  inquirySubmitLabel: tri("Submit Hosting Request", "Send værtsanmodning", "Надіслати запит на проведення"),
  messagePlaceholder: triText(
    "Tell us about your meeting format, timing and preferences.",
    "Fortæl os om dit mødeformat, tidspunkt og præferencer.",
    "Розкажіть про формат вашої зустрічі, час і побажання.",
  ),
  successMessage: triText(
    "Thank you. Your Host at RORUM request is ready for the RORUM team.",
    "Tak. Din Vær vært hos RORUM-anmodning er klar til RORUM-teamet.",
    "Дякуємо. Ваш запит на проведення в RORUM передано команді RORUM.",
  ),
};

const hostAtRorumPackages = [
  {
    _key: "p0",
    _type: "packageTier",
    title: tri("Morning session", "Formiddagssession", "Ранкова сесія"),
    price: tri(
      "Price: 2000 kr. ex VAT",
      "Pris: 2000 kr. ekskl. moms",
      "Ціна: 2000 крон без ПДВ",
    ),
    items: [
      triBullet("i0", "08:30 - 12:30", "08:30 - 12:30", "08:30 - 12:30"),
      triBullet(
        "i1",
        "Suitable for focused meetings, workshops, and small group sessions.",
        "Velegnet til fokuserede møder, workshops og sessioner for mindre grupper.",
        "Підходить для зосереджених зустрічей, воркшопів і сесій у невеликих групах.",
      ),
      triBullet("i2", ...T.upTo12Guests),
      triBullet(
        "i3",
        "Croissant & juice: 90 kr. / person",
        "Croissant & juice: 90 kr. / person",
        "Круасан і сік: 90 крон / особу",
      ),
    ],
  },
  {
    _key: "p1",
    _type: "packageTier",
    title: tri("Afternoon session", "Eftermiddagssession", "Денна сесія"),
    price: tri(
      "Price: 2000 kr. ex VAT",
      "Pris: 2000 kr. ekskl. moms",
      "Ціна: 2000 крон без ПДВ",
    ),
    items: [
      triBullet("i0", "13:00 - 17:00", "13:00 - 17:00", "13:00 - 17:00"),
      triBullet(
        "i1",
        "A flexible format for presentations, workshops, and team meetings.",
        "Et fleksibelt format til præsentationer, workshops og teammøder.",
        "Гнучкий формат для презентацій, воркшопів і командних зустрічей.",
      ),
      triBullet("i2", ...T.upTo12Guests),
      triBullet(
        "i3",
        "Fruit and snacks: 90 kr. / person",
        "Frugt og snacks: 90 kr. / person",
        "Фрукти та снеки: 90 крон / особу",
      ),
    ],
  },
  {
    _key: "p2",
    _type: "packageTier",
    title: tri("Full day session", "Heldagssession", "Повноденна сесія"),
    price: tri(
      "Price: 3700 kr. ex VAT",
      "Pris: 3700 kr. ekskl. moms",
      "Ціна: 3700 крон без ПДВ",
    ),
    items: [
      triBullet("i0", "09:00 - 17:00", "09:00 - 17:00", "09:00 - 17:00"),
      triBullet(
        "i1",
        "For longer sessions requiring time, structure, and continuity.",
        "Til længere sessioner, der kræver tid, struktur og kontinuitet.",
        "Для довших сесій, що потребують часу, структури та безперервності.",
      ),
      triBullet("i2", ...T.upTo12Guests),
      triBullet(
        "i3",
        "Lunch and snacks: 280 kr. / person",
        "Frokost og snacks: 280 kr. / person",
        "Обід і снеки: 280 крон / особу",
      ),
    ],
  },
];

// ---------------------------------------------------------------------------
// communityMembershipPage
// ---------------------------------------------------------------------------

const communityMembershipPageFields = {
  heroLabel: tri("WECODA Community", "WECODA-fællesskab", "Спільнота WECODA"),
  heroTitle: tri(
    "Join a Community That Helps Women Move Forward",
    "Bliv en del af et fællesskab, der hjælper kvinder fremad",
    "Приєднуйтесь до спільноти, що допомагає жінкам рухатися вперед",
  ),
  heroIntro: [
    triBulletParagraph(
      "hi0",
      "WECODA: Women Entrepreneurs Commerce & Development Association.",
      "WECODA: Women Entrepreneurs Commerce & Development Association.",
      "WECODA: Асоціація жінок-підприємниць у сфері торгівлі та розвитку.",
    ),
    triBulletParagraph(
      "hi1",
      "Connect with women entrepreneurs, professionals, and changemakers. Exchange experience, discover new opportunities, and grow with the support of an international community.",
      "Skab forbindelser med kvindelige iværksættere, fagfolk og forandringsagenter. Udveksl erfaringer, opdag nye muligheder, og voks med støtte fra et internationalt fællesskab.",
      "Знайомтеся з жінками-підприємницями, професіоналками та лідерками змін. Обмінюйтесь досвідом, відкривайте нові можливості та розвивайтеся за підтримки міжнародної спільноти.",
    ),
  ],
  supportCta: cta("Support WECODA", "Støt WECODA", "Підтримати WECODA", "#support-wecoda"),
  externalSiteCta: cta("WECODA website", "WECODA hjemmeside", "Сайт WECODA", "https://wecoda.org"),
  priceStripText: tri(
    "Annual membership price: 250 DKK",
    "Årlig medlemspris: 250 DKK",
    "Річна вартість членства: 250 DKK",
  ),
  introColumns: [
    {
      _key: "ic0",
      _type: "titledText",
      text: triText(
        "WECODA is an international community where ambitious women entrepreneurs, professionals, and leaders connect to exchange knowledge, build meaningful partnerships, and grow together. What makes WECODA unique is our signature concept of Diplomatic Gastronomy—a distinctive approach that brings together business, culture, and international dialogue. We believe that genuine relationships are built through shared experiences, creating an environment where conversations become collaborations and ideas evolve into lasting partnerships.",
        "WECODA er et internationalt fællesskab, hvor ambitiøse kvindelige iværksættere, fagfolk og ledere mødes for at udveksle viden, opbygge meningsfulde partnerskaber og vokse sammen. Det, der gør WECODA unikt, er vores signaturkoncept Diplomatisk Gastronomi—en særegen tilgang, der forener forretning, kultur og international dialog. Vi tror på, at ægte relationer opbygges gennem fælles oplevelser, og skaber et miljø, hvor samtaler bliver til samarbejder, og idéer udvikler sig til varige partnerskaber.",
        "WECODA — це міжнародна спільнота, де амбітні жінки-підприємниці, професіоналки та лідерки об'єднуються для обміну знаннями, побудови значущих партнерств і спільного розвитку. Унікальність WECODA — у концепції Дипломатичної Гастрономії — особливому підході, що поєднує бізнес, культуру та міжнародний діалог. Ми віримо, що справжні стосунки будуються через спільний досвід, створюючи середовище, де розмови перетворюються на співпрацю, а ідеї — на тривалі партнерства.",
      ),
    },
    {
      _key: "ic1",
      _type: "titledText",
      text: triText(
        "Through curated networking events, business breakfasts, international forums, educational programs, and cultural initiatives, we create opportunities that extend far beyond traditional networking. Become part of a community where business meets purpose, relationships inspire growth, and every connection opens the door to new possibilities.",
        "Gennem kuraterede netværksarrangementer, forretningsmorgenmader, internationale forummer, uddannelsesprogrammer og kulturelle initiativer skaber vi muligheder, der rækker langt ud over traditionelt netværk. Bliv en del af et fællesskab, hvor forretning møder formål, relationer inspirerer til vækst, og hver forbindelse åbner døren til nye muligheder.",
        "Через кураторські нетворкінг-заходи, бізнес-сніданки, міжнародні форуми, освітні програми та культурні ініціативи ми створюємо можливості, що виходять далеко за межі традиційного нетворкінгу. Станьте частиною спільноти, де бізнес поєднується з метою, стосунки надихають на розвиток, а кожен контакт відкриває двері до нових можливостей.",
      ),
    },
  ],
  benefitsTitle: tri(
    "What You Gain as a Member",
    "Hvad du får som medlem",
    "Що ви отримуєте як учасниця",
  ),
  benefits: [
    triBullet(
      "b0",
      "Event Access — Free or discounted participation in WECODA events.",
      "Adgang til events — Gratis eller rabatteret deltagelse i WECODA-arrangementer.",
      "Доступ до подій — Безкоштовна або пільгова участь у заходах WECODA.",
    ),
    triBullet(
      "b1",
      "Training and Learning — Access to training sessions, educational programmes, and masterclasses.",
      "Træning og læring — Adgang til træningssessioner, uddannelsesprogrammer og masterclasses.",
      "Навчання та розвиток — Доступ до тренінгів, освітніх програм і майстер-класів.",
    ),
    triBullet(
      "b2",
      "International Networking — International business networking and new partnerships.",
      "Internationalt netværk — Internationalt forretningsnetværk og nye partnerskaber.",
      "Міжнародний нетворкінг — Міжнародні бізнес-контакти та нові партнерства.",
    ),
    triBullet(
      "b3",
      "International Opportunities — Participation in international projects, forums, and business missions.",
      "Internationale muligheder — Deltagelse i internationale projekter, forummer og forretningsmissioner.",
      "Міжнародні можливості — Участь у міжнародних проєктах, форумах і бізнес-місіях.",
    ),
    triBullet(
      "b4",
      "Funding Information — Information about grants, accelerator programmes, and funding opportunities.",
      "Finansieringsinformation — Information om tilskud, acceleratorprogrammer og finansieringsmuligheder.",
      "Інформація про фінансування — Інформація про гранти, акселераційні програми та можливості фінансування.",
    ),
    triBullet(
      "b5",
      "Mentoring and Expert Advice — Mentoring support and consultations with experts.",
      "Mentoring og ekspertrådgivning — Mentorstøtte og konsultationer med eksperter.",
      "Менторство та експертні консультації — Підтримка менторів і консультації з експертами.",
    ),
    triBullet(
      "b6",
      "Visibility for Your Work — Opportunities to present your business, projects, and professional experience.",
      "Synlighed for dit arbejde — Muligheder for at præsentere din virksomhed, projekter og professionelle erfaring.",
      "Видимість вашої роботи — Можливості представити ваш бізнес, проєкти та професійний досвід.",
    ),
    triBullet(
      "b7",
      "Diplomatic and Cultural Events — Participation in unique WECODA events focused on diplomatic gastronomy and cultural diplomacy.",
      "Diplomatiske og kulturelle arrangementer — Deltagelse i unikke WECODA-events med fokus på diplomatisk gastronomi og kulturdiplomati.",
      "Дипломатичні та культурні заходи — Участь в унікальних подіях WECODA, присвячених дипломатичній гастрономії та культурній дипломатії.",
    ),
    triBullet(
      "b8",
      "A Supportive Community — A community of active women who support one another, exchange experience, and create new opportunities.",
      "Et støttende fællesskab — Et fællesskab af aktive kvinder, der støtter hinanden, udveksler erfaringer og skaber nye muligheder.",
      "Спільнота підтримки — Спільнота активних жінок, які підтримують одна одну, обмінюються досвідом і створюють нові можливості.",
    ),
  ],
  applicationTitle: tri("Application Process", "Ansøgningsproces", "Процес подачі заявки"),
  applicationSteps: [
    titledText(
      "as0",
      ["Submit your application", "Indsend din ansøgning", "Подайте заявку"],
      [
        "Complete the WECODA membership application form.",
        "Udfyld WECODA's medlemsansøgningsformular.",
        "Заповніть форму заявки на членство WECODA.",
      ],
    ),
    titledText(
      "as1",
      [
        "Pay the annual membership fee",
        "Betal det årlige medlemsgebyr",
        "Сплатіть річний членський внесок",
      ],
      [
        "The annual membership fee is 250 DKK.",
        "Det årlige medlemsgebyr er 250 DKK.",
        "Річний членський внесок становить 250 DKK.",
      ],
    ),
    titledText(
      "as2",
      ["Board review", "Bestyrelsesgennemgang", "Розгляд правлінням"],
      [
        "The WECODA Board reviews your application and payment.",
        "WECODA's bestyrelse gennemgår din ansøgning og betaling.",
        "Правління WECODA розглядає вашу заявку та оплату.",
      ],
    ),
    titledText(
      "as3",
      [
        "Membership confirmation",
        "Bekræftelse af medlemskab",
        "Підтвердження членства",
      ],
      [
        "You will receive confirmation after your membership has been approved.",
        "Du modtager en bekræftelse, når dit medlemskab er godkendt.",
        "Ви отримаєте підтвердження після схвалення вашого членства.",
      ],
    ),
  ],
  applicationCta: cta(
    "Become a Member",
    "Bliv medlem",
    "Стати учасницею",
    "https://forms.gle/MpadaPTyL8YCHtAa9",
  ),
  seo: {
    title: tri("Community Membership", "Fællesskabsmedlemskab", "Членство у спільноті"),
    description: triText(
      "Join the RORUM community for events, collaboration and practical creative support in Copenhagen.",
      "Bliv en del af RORUM-fællesskabet for events, samarbejde og praktisk kreativ støtte i København.",
      "Приєднуйтесь до спільноти RORUM заради подій, співпраці та практичної творчої підтримки в Копенгагені.",
    ),
  },
  introSectionLabel: tri("WECODA community", "WECODA-fællesskab", "Спільнота WECODA"),
  introSectionTitle: tri(
    "Connecting Women Who Inspire, Build and Lead.",
    "Forbinder kvinder, der inspirerer, bygger og leder.",
    "Об'єднуємо жінок, які надихають, будують і ведуть за собою.",
  ),
  galleryLabel: tri("Gallery", "Galleri", "Галерея"),
  galleryTitle: tri(
    "WECODA Community Meetings",
    "WECODA-fællesskabsmøder",
    "Зустрічі спільноти WECODA",
  ),
  donation: {
    label: tri("Donation", "Donation", "Пожертва"),
    title: tri(
      "Support the WECODA Community",
      "Støt WECODA-fællesskabet",
      "Підтримайте спільноту WECODA",
    ),
    text: triText(
      "Your support helps WECODA organise educational programmes, community events, international collaborations, and new opportunities for women.",
      "Din støtte hjælper WECODA med at arrangere uddannelsesprogrammer, fællesskabsarrangementer, internationale samarbejder og nye muligheder for kvinder.",
      "Ваша підтримка допомагає WECODA організовувати освітні програми, спільнотні заходи, міжнародну співпрацю та нові можливості для жінок.",
    ),
    scanText: tri("Scan to donate", "Scan for at donere", "Скануйте, щоб зробити пожертву"),
    scanSubtext: tri("Fast, secure and easy.", "Hurtigt, sikkert og nemt.", "Швидко, безпечно та просто."),
    orText: tri("OR", "ELLER", "АБО"),
    bankTransferText: tri(
      "Prefer bank transfer? See our bank details on the right.",
      "Foretrækker du bankoverførsel? Se vores bankoplysninger til højre.",
      "Надаєте перевагу банківському переказу? Реквізити наведено праворуч.",
    ),
    bankDetailsTitle: tri("Bank Details", "Bankoplysninger", "Банківські реквізити"),
    supportText: triText(
      "RORUM proudly supports WECODA by providing a welcoming space for community events, learning, and collaboration.",
      "RORUM støtter med stolthed WECODA ved at stille et imødekommende lokale til rådighed for fællesskabsarrangementer, læring og samarbejde.",
      "RORUM з гордістю підтримує WECODA, надаючи гостинний простір для спільнотних заходів, навчання та співпраці.",
    ),
  },
};

// ---------------------------------------------------------------------------
// contactPage
// ---------------------------------------------------------------------------

const contactPageFields = {
  heroLabel: tri(...T.contact),
  introTitle: tri("We are here for you", "Vi er her for dig", "Ми тут для вас"),
  introText: triText(
    "For more information about events, hosting a gathering at RORUM, collaborations, catering, event decoration, or practical details, please feel free to get in touch with us.",
    "For mere information om events, at være vært for en sammenkomst hos RORUM, samarbejder, catering, eventdekoration eller praktiske detaljer, er du velkommen til at kontakte os.",
    "Щоб дізнатися більше про події, проведення заходів у RORUM, співпрацю, кейтеринг, декор подій чи практичні деталі — звертайтесь до нас.",
  ),
  followUsTitle: tri("Follow us", "Følg os", "Слідкуйте за нами"),
  formTitle: tri(
    "We want to hear from you",
    "Vi vil gerne høre fra dig",
    "Ми хочемо почути від вас",
  ),
  successMessage: triText(
    "Thank you. Your message is ready for the RORUM team.",
    "Tak. Din besked er klar til RORUM-teamet.",
    "Дякуємо. Ваше повідомлення готове для команди RORUM.",
  ),
  seo: {
    title: tri(...T.contact),
    description: triText(
      "Contact RORUM for event inquiries, space booking and collaborations in Copenhagen.",
      "Kontakt RORUM for eventforespørgsler, lokalebooking og samarbejder i København.",
      "Зв'яжіться з RORUM щодо запитів про події, бронювання простору та співпраці в Копенгагені.",
    ),
  },
  submitLabel: tri("Send message", "Send besked", "Надіслати повідомлення"),
};

// ---------------------------------------------------------------------------
// eventsPage
// ---------------------------------------------------------------------------

const eventsPageFields = {
  title: tri(
    "Upcoming events at RORUM",
    "Kommende events hos RORUM",
    "Найближчі події в RORUM",
  ),
  closingSection: {
    eyebrow: tri(...T.hostAtRorum),
    title: tri(
      "Would you like to host at RORUM?",
      "Vil du gerne være vært hos RORUM?",
      "Бажаєте провести подію в RORUM?",
    ),
    text: triText(
      "Explore our space for workshops, meetings, and community gatherings of up to 12 guests.",
      "Udforsk vores lokale til workshops, møder og fællesskabsarrangementer for op til 12 gæster.",
      "Ознайомтесь із нашим простором для воркшопів, зустрічей і спільнотних заходів до 12 гостей.",
    ),
    cta: cta(...T.hostAtRorum, "/host-at-rorum"),
    faqQuestion: tri(...T.haveQuestions),
    faqLabel: tri(...T.readFaqs),
  },
  seo: {
    title: tri("Events", "Events", "Події"),
    description: triText(
      "Discover upcoming RORUM events, workshops and intimate community gatherings.",
      "Oplev kommende RORUM-events, workshops og intime fællesskabsarrangementer.",
      "Дізнайтеся про найближчі події RORUM, воркшопи та камерні спільнотні зустрічі.",
    ),
  },
  filters: {
    dateLabel: tri("Date", "Dato", "Дата"),
    languageLabel: tri(...T.language),
    priceLabel: tri("Price", "Pris", "Ціна"),
    availabilityLabel: tri("Availability", "Tilgængelighed", "Наявність"),
    soonestLabel: tri("Soonest first", "Snarest først", "Спочатку найближчі"),
    weekLabel: tri("This week", "Denne uge", "Цього тижня"),
    monthLabel: tri("This month", "Denne måned", "Цього місяця"),
    priceAscLabel: tri("From low to high", "Fra lav til høj", "Від дешевих до дорогих"),
    priceDescLabel: tri("From high to low", "Fra høj til lav", "Від дорогих до дешевих"),
    availableLabel: tri("Available", "Ledig", "Доступно"),
    soldOutLabel: tri("Sold out", "Udsolgt", "Розпродано"),
    clearFiltersLabel: tri("Clear filters", "Ryd filtre", "Скинути фільтри"),
  },
};

// ---------------------------------------------------------------------------
// faqPage
// ---------------------------------------------------------------------------

const faqPageFields = {
  heroLabel: tri(...T.faq),
  heroTitle: tri(
    "Frequently asked questions",
    "Ofte stillede spørgsmål",
    "Поширені запитання",
  ),
  seo: {
    title: tri(...T.faq),
    description: triText(
      "Answers about RORUM events, hosting, booking, services and volunteering.",
      "Svar om RORUM-events, værtsskab, booking, services og frivilligt arbejde.",
      "Відповіді про події RORUM, організацію заходів, бронювання, послуги та волонтерство.",
    ),
  },
};

// ---------------------------------------------------------------------------
// volunteerPage
// ---------------------------------------------------------------------------

const volunteerPageFields = {
  heroLabel: tri(...T.volunteerWithUs),
  heroTitle: tri("Volunteer at RORUM", "Bliv frivillig hos RORUM", "Волонтерство в RORUM"),
  heroParagraphs: [
    triBulletParagraph(
      "hp0",
      "It often starts with something simple — a conversation, a shared idea, a moment that brings people together.",
      "Det starter ofte med noget enkelt — en samtale, en fælles idé, et øjeblik, der bringer mennesker sammen.",
      "Часто все починається з простого — розмови, спільної ідеї, моменту, що об'єднує людей.",
    ),
    triBulletParagraph(
      "hp1",
      "At RORUM, these moments turn into experiences. And experiences turn into community.",
      "Hos RORUM bliver disse øjeblikke til oplevelser. Og oplevelser bliver til fællesskab.",
      "У RORUM ці моменти перетворюються на досвід. А досвід — на спільноту.",
    ),
    triBulletParagraph(
      "hp2",
      "Volunteering here is more than helping at events. It's becoming part of a space where people create, connect, and grow side by side.",
      "At være frivillig her handler om mere end at hjælpe til events. Det handler om at blive en del af et rum, hvor mennesker skaber, forbinder og vokser side om side.",
      "Волонтерство тут — це більше, ніж допомога на подіях. Це стати частиною простору, де люди творять, спілкуються та розвиваються разом.",
    ),
    triBulletParagraph(
      "hp3",
      "You might be welcoming guests, supporting a workshop, or simply helping shape the atmosphere — but along the way, you become part of something real.",
      "Du kan byde gæster velkommen, støtte en workshop eller blot hjælpe med at forme stemningen — men undervejs bliver du en del af noget ægte.",
      "Ви можете зустрічати гостей, допомагати на воркшопі або просто формувати атмосферу — і в процесі станете частиною чогось справжнього.",
    ),
  ],
  highlights: [
    iconCard("Users", "A place where people know each other.", "Et sted, hvor folk kender hinanden.", "Місце, де люди знають одне одного."),
    iconCard("HandHeart", "Support each other.", "Støtter hinanden.", "Підтримують одне одного."),
    iconCard("Rocket", "Build something together.", "Bygger noget sammen.", "Створюють щось разом."),
  ],
  closingParagraphs: [
    triBulletParagraph(
      "cp0",
      "In return, you gain experience, meet inspiring people, and become part of an international creative community in the heart of Copenhagen.",
      "Til gengæld får du erfaring, møder inspirerende mennesker og bliver en del af et internationalt kreativt fællesskab i hjertet af København.",
      "Натомість ви здобудете досвід, познайомитеся з натхненними людьми та станете частиною міжнародної творчої спільноти в самому серці Копенгагена.",
    ),
    triBulletParagraph(
      "cp1",
      "If you feel a spark reading this — it probably means you belong here.",
      "Hvis du mærker en gnist ved at læse dette — betyder det sandsynligvis, at du hører til her.",
      "Якщо, читаючи це, ви відчуваєте іскру — це, ймовірно, означає, що ваше місце тут.",
    ),
    triBulletParagraph(
      "cp2",
      "Apply to volunteer and join RORUM.",
      "Ansøg om at blive frivillig og bliv en del af RORUM.",
      "Подайте заявку на волонтерство та приєднуйтесь до RORUM.",
    ),
  ],
  applyCta: cta("Apply to volunteer", "Ansøg om at blive frivillig", "Подати заявку на волонтерство", "#apply"),
  seo: {
    title: tri(...T.volunteerWithUs),
    description: triText(
      "Join the RORUM community as a volunteer for events and hospitality moments.",
      "Bliv en del af RORUM-fællesskabet som frivillig ved events og gæstfrihedsmomenter.",
      "Приєднуйтесь до спільноти RORUM як волонтер для подій та гостинних моментів.",
    ),
  },
};

// ---------------------------------------------------------------------------
// workWithUsPage
// ---------------------------------------------------------------------------

const workWithUsPageFields = {
  heroLabel: tri(...T.workWithUs),
  heroTitle: tri(...T.workWithUs),
  heroParagraphs: [
    triBulletParagraph(
      "hp0",
      "If our work resonates with you, we would be happy to get to know you.",
      "Hvis vores arbejde giver genklang hos dig, vil vi meget gerne lære dig at kende.",
      "Якщо наша робота відгукується вам, ми будемо раді познайомитися з вами.",
    ),
    triBulletParagraph(
      "hp1",
      "Please feel free to send us your CV, and if any opportunities arise within our projects or activities that match your experience and interests, we will be sure to get in touch.",
      "Send os endelig dit CV, og hvis der opstår muligheder inden for vores projekter eller aktiviteter, der matcher din erfaring og interesser, kontakter vi dig helt sikkert.",
      "Надішліть нам своє резюме, і якщо в наших проєктах чи активностях з'являться можливості, що відповідають вашому досвіду й інтересам, ми обов'язково з вами зв'яжемося.",
    ),
    triBulletParagraph(
      "hp2",
      "We believe that opportunities grow through people — and sometimes the right environment can open doors you didn't even know existed.",
      "Vi tror på, at muligheder vokser gennem mennesker — og nogle gange kan det rette miljø åbne døre, du ikke engang vidste fandtes.",
      "Ми віримо, що можливості зростають завдяки людям — і іноді правильне середовище відкриває двері, про існування яких ви навіть не здогадувались.",
    ),
    triBulletParagraph(
      "hp3",
      "Maybe it leads to a collaboration. Maybe to a role. Or maybe to a connection that brings something unexpected.",
      "Måske fører det til et samarbejde. Måske til en rolle. Eller måske til en forbindelse, der bringer noget uventet.",
      "Можливо, це приведе до співпраці. Можливо, до посади. А можливо — до знайомства, яке принесе щось несподіване.",
    ),
    triBulletParagraph(
      "hp4",
      "Either way — it starts here.",
      "Under alle omstændigheder — det starter her.",
      "У будь-якому разі — все починається тут.",
    ),
  ],
  cvUploadCta: tri("Send your CV", "Send dit CV", "Надішліть резюме"),
  seo: {
    title: tri("Work With Us", "Arbejd med os", "Працюйте з нами"),
    description: triText(
      "Collaborate with RORUM as a facilitator, chef, creative partner or event professional.",
      "Samarbejd med RORUM som facilitator, kok, kreativ partner eller eventprofessionel.",
      "Співпрацюйте з RORUM як фасилітатор, шеф-кухар, творчий партнер або подієвий фахівець.",
    ),
  },
};

// ---------------------------------------------------------------------------
// legal pages
// ---------------------------------------------------------------------------

const legalTermsTitle = tri(
  "Terms and conditions",
  "Vilkår og betingelser",
  "Умови та положення",
);
const legalTermsSubtitle = triText(
  "Terms for using the RORUM website, submitting inquiries and following external ticket links.",
  "Vilkår for brug af RORUM-hjemmesiden, indsendelse af forespørgsler og brug af eksterne billetlinks.",
  "Умови використання вебсайту RORUM, надсилання запитів і переходу за зовнішніми посиланнями на квитки.",
);

const legalPrivacyTitle = tri("Privacy policy", "Privatlivspolitik", "Політика конфіденційності");
const legalPrivacySubtitle = triText(
  "How RORUM handles personal information submitted through this website.",
  "Hvordan RORUM håndterer personlige oplysninger indsendt via denne hjemmeside.",
  "Як RORUM обробляє персональні дані, надіслані через цей вебсайт.",
);

const legalCookieTitle = tri("Cookie policy", "Cookiepolitik", "Політика використання файлів cookie");
const legalCookieSubtitle = triText(
  "How RORUM may use cookies and similar technologies.",
  "Hvordan RORUM kan bruge cookies og lignende teknologier.",
  "Як RORUM може використовувати файли cookie та подібні технології.",
);

const legalTermsBodyDa = [
  block("2. Brug af denne hjemmeside", "h2"),
  block(
    "Denne hjemmeside giver information om RORUM, events, værtsledede sammenkomster, catering, eventdekoration og relaterede fællesskabsoplevelser. Hjemmesiden er beregnet til generel information og forespørgsler.",
  ),
  block("3. Forespørgsler og formularer", "h2"),
  block(
    "Formularer på denne hjemmeside er kun via e-mail. At indsende en formular sender din forespørgsel til RORUM pr. e-mail. Formularindsendelser gemmes ikke i Sanity, og ingen forespørgselsdatabase anvendes i denne forenklede opsætning.",
  ),
  block("4. Bookinger og billetter", "h2"),
  block(
    "At indsende en forespørgsel skaber ikke en bekræftet booking. Detaljer som tilgængelighed, pris og endelige aftaler bekræftes separat. Køb af eventbilletter kan foregå via Billetto, som er en ekstern billetudbyder.",
  ),
  block("5. Eksterne links og tjenester", "h2"),
  block(
    "Denne hjemmeside kan linke til eksterne tjenester, herunder Billetto, Google Maps og sociale medieplatforme. RORUM er ikke ansvarlig for indhold, politikker eller teknisk adfærd på eksterne hjemmesider.",
  ),
  block("6. Hjemmesideindhold", "h2"),
  block(
    "Alt tekst, billeder, designelementer og hjemmesideindhold tilhører RORUM eller anvendes med tilladelse. Du må ikke kopiere, genbruge eller distribuere hjemmesideindhold uden tilladelse fra RORUM.",
  ),
  block("7. Hjemmesidens tilgængelighed", "h2"),
  block(
    "RORUM sigter mod at holde hjemmesiden tilgængelig og korrekt, men hjemmesiden kan til tider ændre sig, være utilgængelig eller indeholde fejl.",
  ),
  block("8. Kontakt", "h2"),
  block("For spørgsmål om disse vilkår, kontakt hello@rorum.dk."),
];

const legalTermsBodyUk = [
  block("2. Використання цього вебсайту", "h2"),
  block(
    "Цей вебсайт надає інформацію про RORUM, події, організовані зустрічі, кейтеринг, декор подій та пов'язані спільнотні заходи. Вебсайт призначений для загальної інформації та запитів.",
  ),
  block("3. Запити та форми", "h2"),
  block(
    "Форми на цьому вебсайті працюють лише через електронну пошту. Надсилання форми надсилає ваш запит до RORUM електронною поштою. Дані форм не зберігаються в Sanity, і в цьому спрощеному налаштуванні база даних запитів не використовується.",
  ),
  block("4. Бронювання та квитки", "h2"),
  block(
    "Надсилання запиту не створює підтвердженого бронювання. Такі деталі, як наявність місць, ціна та остаточні домовленості, підтверджуються окремо. Придбання квитків на події може здійснюватися через Billetto — зовнішнього постачальника квитків.",
  ),
  block("5. Зовнішні посилання та сервіси", "h2"),
  block(
    "Цей вебсайт може містити посилання на зовнішні сервіси, зокрема Billetto, Google Maps та соціальні мережі. RORUM не несе відповідальності за вміст, політики чи технічну поведінку зовнішніх сайтів.",
  ),
  block("6. Вміст вебсайту", "h2"),
  block(
    "Усі тексти, зображення, елементи дизайну та вміст вебсайту належать RORUM або використовуються з дозволу. Ви не можете копіювати, повторно використовувати чи поширювати вміст вебсайту без дозволу RORUM.",
  ),
  block("7. Доступність вебсайту", "h2"),
  block(
    "RORUM прагне підтримувати вебсайт доступним і точним, однак вебсайт може час від часу змінюватися, бути недоступним або містити помилки.",
  ),
  block("8. Контакти", "h2"),
  block("З питань щодо цих умов звертайтесь на hello@rorum.dk."),
];

const legalPrivacyBodyDa = [
  block("2. Oplysninger du indsender", "h2"),
  block(
    "Når du kontakter RORUM via en formular eller e-mail, kan du give oplysninger som dit navn, e-mailadresse, telefonnummer og beskeddetaljer.",
  ),
  block("3. Hvorfor vi bruger dine oplysninger", "h2"),
  block(
    "RORUM bruger de oplysninger, du indsender, til at besvare din forespørgsel, drøfte eventidéer, værtsledede sammenkomster, catering, eventdekoration, samarbejder eller generelle spørgsmål.",
  ),
  block("4. Retsgrundlag", "h2"),
  block(
    "RORUM behandler personoplysninger for at besvare forespørgsler, håndtere anmodninger, drøfte events, værtsledede sammenkomster, catering, eventdekoration, samarbejder og fællesskabsrelateret kommunikation. Afhængigt af anmodningen kan retsgrundlaget være:",
  ),
  bulletBlock("skridt før indgåelse af en aftale"),
  bulletBlock("RORUM's legitime interesse i at besvare forespørgsler og håndtere kommunikation"),
  bulletBlock("samtykke, hvor du har givet samtykke til et specifikt formål"),
  block("5. CV og samarbejdsforespørgsler", "h2"),
  block(
    "Hvis du indsender dit CV, portfolio eller andre oplysninger via siden Arbejd med os, bruger RORUM disse oplysninger til at vurdere mulige samarbejder, roller eller fremtidige muligheder.",
  ),
  block(
    "CV'er og relaterede beskeder kan opbevares i op til 12 måneder, medmindre du beder RORUM om at slette dem tidligere, eller medmindre en længere periode aftales.",
  ),
  block("6. Eksterne udbydere", "h2"),
  block(
    "Billetto anvendes som ekstern billetudbyder til udvalgte eventbilletlinks. Hvis du bruger Billetto, gælder deres egen privatlivspolitik og vilkår.",
  ),
  block("Kontaktsiden kan inkludere en Google Maps iframe. Google kan behandle data, når kortet indlæses."),
  block("7. Analyse og sporing", "h2"),
  block(
    "Google Analytics og Meta Pixel anvendes ikke bevidst som standard på denne forenklede hjemmeside. RORUM anvender ikke bevidst markedsføringssporing som standard.",
  ),
  block("8. Hvor længe oplysninger opbevares", "h2"),
  block(
    "E-mailforespørgsler kan opbevares, så længe det er nødvendigt for at besvare din anmodning og håndtere samtalen. Du kan bede RORUM om at slette din forespørgsels-e-mail, hvor det er muligt.",
  ),
  block("9. Dine rettigheder", "h2"),
  block(
    "Du kan kontakte RORUM for at anmode om adgang til dine personoplysninger, berigtigelse, sletning, begrænsning af behandling eller for at gøre indsigelse mod behandling, hvor det er relevant.",
  ),
  block("Hvis behandlingen er baseret på samtykke, kan du til enhver tid trække dit samtykke tilbage."),
  block("10. Kontakt", "h2"),
  block("For spørgsmål om privatliv, kontakt hello@rorum.dk."),
];

const legalPrivacyBodyUk = [
  block("2. Інформація, яку ви надаєте", "h2"),
  block(
    "Коли ви зв'язуєтесь із RORUM через форму або електронну пошту, ви можете надати таку інформацію, як ім'я, електронна адреса, номер телефону та деталі повідомлення.",
  ),
  block("3. Навіщо ми використовуємо вашу інформацію", "h2"),
  block(
    "RORUM використовує надану вами інформацію, щоб відповісти на ваш запит, обговорити ідеї подій, організовані зустрічі, кейтеринг, декор подій, співпрацю чи загальні питання.",
  ),
  block("4. Правові підстави", "h2"),
  block(
    "RORUM обробляє персональні дані для відповіді на запити, управління зверненнями, обговорення подій, організованих зустрічей, кейтерингу, декору подій, співпраці та спільнотної комунікації. Залежно від запиту правовою підставою може бути:",
  ),
  bulletBlock("вжиття заходів до укладення договору"),
  bulletBlock("законний інтерес RORUM у відповіді на запити та управлінні комунікацією"),
  bulletBlock("згода, якщо ви надали згоду для конкретної мети"),
  block("5. Резюме та запити щодо співпраці", "h2"),
  block(
    "Якщо ви надсилаєте своє резюме, портфоліо чи іншу інформацію через сторінку «Працюйте з нами», RORUM використовує цю інформацію для розгляду можливої співпраці, посад чи майбутніх можливостей.",
  ),
  block(
    "Резюме та пов'язані повідомлення можуть зберігатися до 12 місяців, якщо ви не попросите RORUM видалити їх раніше або не буде погоджено довший термін.",
  ),
  block("6. Зовнішні постачальники", "h2"),
  block(
    "Billetto використовується як зовнішній постачальник квитків для обраних посилань на квитки подій. Якщо ви використовуєте Billetto, застосовуються їхні власні політика конфіденційності та умови.",
  ),
  block("Сторінка контактів може містити iframe Google Maps. Google може обробляти дані під час завантаження карти."),
  block("7. Аналітика та відстеження", "h2"),
  block(
    "Google Analytics і Meta Pixel за замовчуванням свідомо не використовуються на цьому спрощеному вебсайті. RORUM свідомо не використовує маркетингове відстеження за замовчуванням.",
  ),
  block("8. Термін зберігання інформації", "h2"),
  block(
    "Запити електронною поштою можуть зберігатися стільки, скільки потрібно для відповіді на ваш запит і ведення переписки. Ви можете попросити RORUM видалити лист із вашим запитом, де це можливо.",
  ),
  block("9. Ваші права", "h2"),
  block(
    "Ви можете звернутися до RORUM із запитом на доступ до ваших персональних даних, їх виправлення, видалення, обмеження обробки або заперечення проти обробки, де це застосовно.",
  ),
  block("Якщо обробка ґрунтується на згоді, ви можете відкликати свою згоду в будь-який час."),
  block("10. Контакти", "h2"),
  block("З питань конфіденційності звертайтесь на hello@rorum.dk."),
];

const legalCookieBodyDa = [
  block("2. Hvad cookies er", "h2"),
  block(
    "Cookies er små filer gemt af din browser. Lignende teknologier kan også bruges til at indlæse hjemmesidefunktioner eller eksterne tjenester.",
  ),
  block("3. Nødvendige hjemmesidecookies", "h2"),
  block(
    "RORUM-hjemmesiden kan bruge nødvendige cookies eller lignende teknologier, der kræves til grundlæggende hjemmesidefunktionalitet, sikkerhed eller sideadfærd.",
  ),
  block("4. Formularer", "h2"),
  block(
    "Formularer på denne hjemmeside er kun via e-mail. Formularindsendelser gemmes ikke i Sanity, og ingen forespørgselsdatabase anvendes i denne forenklede opsætning.",
  ),
  block("5. Analyse og markedsføringssporing", "h2"),
  block(
    "Google Analytics, Meta Pixel og markedsføringssporingscookies anvendes ikke bevidst som standard på denne forenklede hjemmeside.",
  ),
  block("6. Google Maps", "h2"),
  block(
    "Kontaktsiden kan inkludere en Google Maps iframe. Google Maps kan sætte cookies eller behandle data, når kortet indlæses.",
  ),
  block("7. Billetto", "h2"),
  block(
    "Eventbilletlinks kan føre til Billetto, som er en ekstern billetudbyder. Billetto kan bruge sine egne cookies eller lignende teknologier.",
  ),
  block("8. Sociale medielinks", "h2"),
  block(
    "Links til sociale medier på denne hjemmeside er kun eksterne links. Sociale platforme kan bruge deres egne cookies eller sporing, når du besøger dem.",
  ),
  block("9. Kontakt", "h2"),
  block("For spørgsmål om cookies, kontakt hello@rorum.dk."),
];

// English blocks mirrored exactly from scripts/import-pages.ts, so triBody()
// can merge all three languages into one field value.
const legalTermsBodyEn = [
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
];

const legalPrivacyBodyEn = [
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
  block("The Contact page may include a Google Maps iframe. Google may process data when the map is loaded."),
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
    "You may contact RORUM to request access to your personal data, correction, deletion, restriction of processing, or to object to processing where applicable.",
  ),
  block("If processing is based on consent, you may withdraw your consent at any time."),
  block("10. Contact", "h2"),
  block("For privacy questions, contact hello@rorum.dk."),
];

const legalCookieBodyEn = [
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
];

const legalCookieBodyUk = [
  block("2. Що таке файли cookie", "h2"),
  block(
    "Файли cookie — це невеликі файли, що зберігаються вашим браузером. Подібні технології також можуть використовуватися для завантаження функцій вебсайту чи зовнішніх сервісів.",
  ),
  block("3. Необхідні файли cookie вебсайту", "h2"),
  block(
    "Вебсайт RORUM може використовувати необхідні файли cookie або подібні технології, потрібні для базової роботи вебсайту, безпеки чи поведінки сторінки.",
  ),
  block("4. Форми", "h2"),
  block(
    "Форми на цьому вебсайті працюють лише через електронну пошту. Дані форм не зберігаються в Sanity, і в цьому спрощеному налаштуванні база даних запитів не використовується.",
  ),
  block("5. Аналітика та маркетингове відстеження", "h2"),
  block(
    "Google Analytics, Meta Pixel та маркетингові файли cookie для відстеження за замовчуванням свідомо не використовуються на цьому спрощеному вебсайті.",
  ),
  block("6. Google Maps", "h2"),
  block(
    "Сторінка контактів може містити iframe Google Maps. Google Maps може встановлювати файли cookie або обробляти дані під час завантаження карти.",
  ),
  block("7. Billetto", "h2"),
  block(
    "Посилання на квитки подій можуть вести до Billetto — зовнішнього постачальника квитків. Billetto може використовувати власні файли cookie або подібні технології.",
  ),
  block("8. Посилання на соціальні мережі", "h2"),
  block(
    "Посилання на соціальні мережі на цьому вебсайті є лише зовнішніми посиланнями. Соціальні платформи можуть використовувати власні файли cookie чи відстеження під час їх відвідування.",
  ),
  block("9. Контакти", "h2"),
  block("З питань щодо файлів cookie звертайтесь на hello@rorum.dk."),
];

// ---------------------------------------------------------------------------
// navigation / footer / formMessages
// ---------------------------------------------------------------------------

const navigationFields = {
  items: [
    { _key: "n0", href: "/events", label: tri(...T.attendEvents) },
    { _key: "n1", href: "/host-at-rorum", label: tri(...T.hostAtRorum) },
    {
      _key: "n2",
      label: tri(...T.services),
      children: [
        { _key: "c0", href: "/catering", label: tri(...T.catering) },
        { _key: "c1", href: "/event-decoration", label: tri("Decoration", "Dekoration", "Декор") },
      ],
    },
    {
      _key: "n3",
      label: tri(...T.community),
      children: [
        { _key: "c0", href: "/community-membership", label: tri(...T.wecodaMembership) },
        { _key: "c1", href: "/volunteer", label: tri(...T.volunteerWithUs) },
        { _key: "c2", href: "/work-with-us", label: tri(...T.workWithUs) },
      ],
    },
    { _key: "n4", href: "/about", label: tri(...T.about) },
    { _key: "n5", href: "/contact", label: tri(...T.contact) },
  ],
  languageSwitcherLabel: tri("Language", "Sprog", "Мова"),
  contactCtaLabel: tri("Let's Talk", "Lad os tale sammen", "Поговорімо"),
};

function footerColumn(key: string, title: Tri, links: [string, Tri][]) {
  return {
    _key: key,
    title: tri(...title),
    links: links.map(([href, label], i) => ({ _key: `l${i}`, href, label: tri(...label) })),
  };
}

const footerFields = {
  columns: [
    footerColumn("visit", ["Visit & host", "Besøg & vær vært", "Відвідати та проводити"], [
      ["/events", T.attendEvents],
      ["/host-at-rorum", T.hostAtRorum],
    ]),
    footerColumn("services", T.services, [
      ["/catering", T.catering],
      ["/event-decoration", ["Decoration", "Dekoration", "Декор"]],
    ]),
    footerColumn("community", T.community, [
      ["/community-membership", T.wecodaMembership],
      ["/volunteer", T.volunteerWithUs],
      ["/work-with-us", T.workWithUs],
    ]),
    footerColumn("company", ["Company", "Virksomhed", "Компанія"], [
      ["/about", T.about],
      ["/contact", T.contact],
      ["/faq", T.faq],
    ]),
  ],
  legalLinks: [
    { _key: "l0", href: "/terms", label: tri("Terms and conditions", "Vilkår og betingelser", "Умови та положення") },
    { _key: "l1", href: "/privacy-policy", label: tri("Privacy policy", "Privatlivspolitik", "Політика конфіденційності") },
    { _key: "l2", href: "/cookie-policy", label: tri("Cookie policy", "Cookiepolitik", "Політика cookie") },
  ],
  copyrightText: tri(
    "© 2026 RORUM. All rights reserved.",
    "© 2026 RORUM. Alle rettigheder forbeholdes.",
    "© 2026 RORUM. Усі права захищено.",
  ),
  contactDetailsLabel: tri("Contact details", "Kontaktoplysninger", "Контактна інформація"),
};

const formMessagesFields = {
  requiredFieldTemplate: tri("{field} is required.", "{field} er påkrævet.", "{field} є обов'язковим полем."),
  invalidEmailMessage: tri(
    "Please enter a valid email address.",
    "Indtast venligst en gyldig e-mailadresse.",
    "Будь ласка, введіть дійсну електронну адресу.",
  ),
  privacyConsentRequiredMessage: tri(
    "Please agree to the Privacy policy before submitting.",
    "Accepter venligst privatlivspolitikken, før du sender.",
    "Будь ласка, погодьтеся з політикою конфіденційності перед надсиланням.",
  ),
  privacyConsentPrefixText: tri(
    "I have read and agree to the",
    "Jeg har læst og accepterer",
    "Я прочитав(ла) і погоджуюсь із",
  ),
  faqQuestion: tri("Questions?", "Spørgsmål?", "Питання?"),
  faqLabel: tri(...T.readFaqs),
  fullNameLabel: tri("Full Name", "Fulde navn", "Повне ім'я"),
  phoneLabel: tri("Phone number", "Telefonnummer", "Номер телефону"),
  emailLabel: tri("Email", "E-mail", "Електронна пошта"),
  messageLabel: tri("Message", "Besked", "Повідомлення"),
  eventDateLabel: tri("Event date", "Eventdato", "Дата події"),
  agreeButtonLabel: tri("I Have Read and Agree", "Jeg har læst og accepterer", "Я прочитав(ла) і погоджуюсь"),
  closeLabel: tri("Close", "Luk", "Закрити"),
  copyLabel: tri("Copy", "Kopier", "Копіювати"),
  copiedLabel: tri("Copied", "Kopieret", "Скопійовано"),
  packageLabel: tri("Package", "Pakke", "Пакет"),
  selectPackagePlaceholder: tri("Select package", "Vælg pakke", "Оберіть пакет"),
  eventTimeLabel: tri("Event time", "Eventtidspunkt", "Час події"),
  numberOfPeopleLabel: tri("Number of people", "Antal personer", "Кількість осіб"),
  guestsPlaceholder: tri("Approx. number", "Ca. antal", "Приблизна кількість"),
  additionalServicesLabel: tri("Additional services", "Yderligere services", "Додаткові послуги"),
  commentLabel: tri("Comment", "Kommentar", "Коментар"),
  guestsRangeMessage: tri(
    "Please enter a whole number between 1 and 30.",
    "Indtast venligst et helt tal mellem 1 og 30.",
    "Будь ласка, введіть ціле число від 1 до 30.",
  ),
};

// ---------------------------------------------------------------------------
// Event templated content (shared by the 29 "expanded" events) +
// per-event title translations
// ---------------------------------------------------------------------------

const eventTitleTranslations: Record<string, [string, string]> = {
  "Copenhagen makers dinner": ["Copenhagen makers-middag", "Вечеря копенгагенських майстрів"],
  "Botanical table styling workshop": ["Botanisk bordstyling-workshop", "Воркшоп із ботанічного сервірування столу"],
  "Freelance morning salon": ["Freelance morgensalon", "Ранковий салон для фрилансерів"],
  "Soft launch breakfast": ["Soft launch-morgenmad", "Сніданок м'якого запуску"],
  "Candlelit listening room": ["Lysbelyst lytterum", "Кімната для прослуховування при свічках"],
  "Summer table lab": ["Sommer bordlaboratorium", "Літня лабораторія сервірування"],
  "Creative hosts circle": ["Kreativ værtscirkel", "Коло творчих господарів"],
  "Nordic brunch club": ["Nordisk brunch-klub", "Клуб нордичного бранчу"],
  "Tiny talks evening": ["Tiny talks-aften", "Вечір коротких розмов"],
  "Floral mood workshop": ["Blomsterstemning-workshop", "Воркшоп квіткового настрою"],
  "Independent work morning": ["Selvstændig arbejdsmorgen", "Ранок незалежної роботи"],
  "Seasonal supper preview": ["Sæsonmiddag preview", "Прев'ю сезонної вечері"],
  "Community reset night": ["Fællesskabets resetaften", "Вечір перезавантаження спільноти"],
  "Business breakfast Copenhagen": ["Erhvervsmorgenmad København", "Бізнес-сніданок у Копенгагені"],
  "Networking for international founders": [
    "Netværk for internationale iværksættere",
    "Нетворкінг для міжнародних засновників",
  ],
  "Danish for Ukrainians: Everyday basics": [
    "Dansk for ukrainere: Hverdagsgrundlag",
    "Данська для українців: базові фрази",
  ],
  "Yoga after work reset": ["Yoga efter arbejde reset", "Йога для перезавантаження після роботи"],
  "Present yourself with confidence": [
    "Præsenter dig selv med selvtillid",
    "Впевнена самопрезентація",
  ],
  "Slow art evening": ["Slow art-aften", "Вечір повільного мистецтва"],
  "Danish conversation cafe": ["Dansk samtalecafé", "Кафе данської розмовної практики"],
  "Creative business roundtable": ["Kreativt erhvervsrundbord", "Круглий стіл творчого бізнесу"],
  "Mindful morning yoga": ["Mindful morgenyoga", "Усвідомлена ранкова йога"],
  "LinkedIn profile lab": ["LinkedIn-profillaboratorium", "Лабораторія профілю LinkedIn"],
  "Ukrainian-Danish community night": [
    "Ukrainsk-dansk fællesskabsaften",
    "Українсько-данський вечір спільноти",
  ],
  "Watercolor & wine": ["Akvarel & vin", "Акварель і вино"],
  "Danish work culture breakfast": ["Dansk arbejdskultur-morgenmad", "Сніданок про данську культуру праці"],
  "Calm networking for newcomers": ["Rolig netværk for nytilkomne", "Спокійний нетворкінг для новоприбулих"],
  "Breathwork & tea": ["Åndedrætsøvelser & te", "Дихальні практики та чай"],
  "Pitch practice evening": ["Pitch-øvelsesaften", "Вечір відпрацювання пітчів"],
  "Clay & calm hands": ["Ler & rolige hænder", "Глина та спокійні руки"],
  "Danish for Ukrainians: Workplace words": [
    "Dansk for ukrainere: Ord på arbejdspladsen",
    "Данська для українців: слова на робочому місці",
  ],
  "International supper salon": ["Internationalt middagssalon", "Міжнародний вечірній салон"],
};

function expandedEventDescriptions(titleEn: string, titleDa: string, titleUk: string) {
  return {
    shortDescription: triText(
      `${titleEn} is an intimate RORUM gathering shaped for a warm Copenhagen room.`,
      `${titleDa} er en intim RORUM-sammenkomst formet til et varmt lokale i København.`,
      `${titleUk} — це камерна зустріч RORUM, створена для теплої атмосфери в Копенгагені.`,
    ),
    longDescription: triText(
      `${titleEn} brings people together around a simple hosted format with thoughtful pacing, a calm room setup and space for useful conversation.`,
      `${titleDa} samler mennesker om et enkelt værtsformat med gennemtænkt tempo, en rolig rumindretning og plads til nyttig samtale.`,
      `${titleUk} об'єднує людей у простому організованому форматі з продуманим темпом, спокійним облаштуванням простору та місцем для змістовних розмов.`,
    ),
  };
}

const expandedIncluded = [
  triBullet("i0", "Hosted arrival", "Værtsledet ankomst", "Організоване прибуття"),
  triBullet("i1", "Coffee, tea or seasonal drink", "Kaffe, te eller sæsondrik", "Кава, чай або сезонний напій"),
  triBullet("i2", "Small-group format", "Format for mindre grupper", "Формат невеликої групи"),
  triBullet("i3", "Room setup by RORUM", "Rumindretning af RORUM", "Облаштування простору від RORUM"),
];

// One entry per language, same 5 bullets in order — joined with "\n" at each
// call site to match `whatToExpect`'s new one-multiline-field-per-language
// shape (sanity/schemaTypes/documents/event.ts).
const expandedWhatToExpectEn = ["Small group format", "Guided experience", "Warm RORUM atmosphere", "Tea & refreshments", "Time for conversation"];
const expandedWhatToExpectDa = ["Format for mindre grupper", "Guidet oplevelse", "Varm RORUM-atmosfære", "Te & forfriskninger", "Tid til samtale"];
const expandedWhatToExpectUk = ["Формат невеликої групи", "Керований досвід", "Тепла атмосфера RORUM", "Чай і закуски", "Час для розмови"];

// Featured (bespoke) events — full custom translations
const featuredEventTranslations: Record<
  string,
  { short: [string, string]; long: [string, string]; included: [string, string][]; whatToExpect: [string, string][] }
> = {
  "copenhagen-makers-dinner": {
    short: [
      "En rolig aften med sæsonmad, lokale historier og nye kreative forbindelser omkring ét langt bord.",
      "Спокійний вечір із сезонною їжею, місцевими історіями та новими творчими знайомствами за одним довгим столом.",
    ],
    long: [
      "En intim middag for Københavns skabere, værter og selvstændige kreative, der ønsker at mødes i rammer, der føles rolige, nyttige og gavmilde. Forvent et sæsonbaseret fællesbord, blide samtaleimpulser og plads til rigtig samtale.",
      "Камерна вечеря для копенгагенських майстрів, ведучих і незалежних творчих людей, які хочуть зустрітися в спокійній, корисній і щедрій атмосфері. Очікуйте сезонний спільний стіл, м'які теми для розмов і простір для справжнього спілкування.",
    ],
    included: [
      ["Sæsonbaseret fællesmiddag", "Сезонна спільна вечеря"],
      ["Velkomstdrink", "Вітальний напій"],
      ["Faciliterede introduktioner", "Фасилітовані знайомства"],
      ["Siddeplads ved fællesbordet", "Місця за спільним столом"],
    ],
    whatToExpect: [
      ["Format for mindre grupper", "Формат невеликої групи"],
      ["Sæsonbaseret fællesmiddag", "Сезонна спільна вечеря"],
      ["Varm RORUM-atmosfære", "Тепла атмосфера RORUM"],
      ["Faciliterede introduktioner", "Фасилітовані знайомства"],
      ["Tid til samtale", "Час для розмови"],
    ],
  },
  "botanical-table-styling-workshop": {
    short: [
      "Lær tilgængelige blomstergreb, lysplacering og rolig bordkomposition til intim værtsskab.",
      "Опануйте прості флористичні прийоми, розміщення свічок і спокійну композицію столу для камерного прийому гостей.",
    ],
    long: [
      "En hands-on workshop for værter, facilitatorer og visuelle tænkere, der ønsker at skabe indbydende borde uden at overkomplicere rummet. Vi arbejder med sæsonmaterialer, skala, gentagelse og praktiske opsætningsvalg.",
      "Практичний воркшоп для ведучих, фасилітаторів і візуальних мислителів, які хочуть створювати гостинні столи без зайвого ускладнення простору. Ми працюємо з сезонними матеріалами, масштабом, повторенням та практичними рішеннями оформлення.",
    ],
    included: [
      ["Materialer til bordstylingøvelser", "Матеріали для вправ із сервірування столу"],
      ["Kaffe, te og en sød pause", "Кава, чай та солодка перерва"],
      ["Praktisk opsætningstjekliste", "Практичний чек-лист облаштування"],
      ["Vejledning i mindre grupper", "Керівництво в невеликих групах"],
    ],
    whatToExpect: [
      ["Praktisk vejledning", "Практичне керівництво"],
      ["Sæsonmaterialer", "Сезонні матеріали"],
      ["Kaffe, te og en sød pause", "Кава, чай та солодка перерва"],
      ["Format for mindre grupper", "Формат невеликої групи"],
      ["Praktiske opsætningsidéer", "Практичні ідеї облаштування"],
    ],
  },
  "freelance-morning-salon": {
    short: [
      "Kaffe, impulser og god ansvarlighed for selvstændige kreative, der bygger deres virke i København.",
      "Кава, теми для роздумів і м'яка підтримка відповідальності для незалежних творчих людей, які розвивають свою справу в Копенгагені.",
    ],
    long: [
      "En fokuseret morgen for freelancere og små kreative virksomheder, der ønsker en roligere måde at starte dagen på. Tag et aktuelt spørgsmål, en praktisk opgave eller et projekt, der har brug for stille fremdrift, med.",
      "Зосереджений ранок для фрилансерів і невеликих творчих компаній, які хочуть спокійніше почати день. Візьміть із собою актуальне питання, практичне завдання чи проєкт, що потребує тихого поштовху.",
    ],
    included: [
      ["Kaffe og te", "Кава і чай"],
      ["Guidet check-in", "Керований чек-ін"],
      ["Fokuserede arbejdsimpulser", "Зосереджені робочі імпульси"],
      ["Refleksion i mindre grupper", "Рефлексія в невеликих групах"],
    ],
    whatToExpect: [
      ["Kaffe og te", "Кава і чай"],
      ["Guidet check-in", "Керований чек-ін"],
      ["Fokuserede arbejdsimpulser", "Зосереджені робочі імпульси"],
      ["Refleksion i mindre grupper", "Рефлексія в невеликих групах"],
      ["Rolig morgenrytme", "Спокійний ранковий ритм"],
    ],
  },
};

// ---------------------------------------------------------------------------
// FAQ groups
// ---------------------------------------------------------------------------

const faqGroupTitleTranslations: Record<string, [string, string]> = {
  Events: ["Events", "Події"],
  "Host at RORUM": ["Vær vært hos RORUM", "Проведення подій у RORUM"],
  Services: ["Services", "Послуги"],
  Volunteering: ["Frivilligt arbejde", "Волонтерство"],
};

// Full Q/A translations, structured per group
const faqQA: Record<string, { q: [string, string, string]; a: [string, string, string] }[]> = {
  Events: [
    {
      q: ["How do I book a ticket?", "Hvordan booker jeg en billet?", "Як забронювати квиток?"],
      a: [
        "Open the event you are interested in and follow the booking details listed there.",
        "Åbn det event, du er interesseret i, og følg bookingdetaljerne der.",
        "Відкрийте подію, яка вас цікавить, і дотримуйтесь вказаних там деталей бронювання.",
      ],
    },
    {
      q: ["Are events in English?", "Er events på engelsk?", "Чи проходять події англійською?"],
      a: [
        "The MVP event list includes language on every card. Most community events can be hosted in English.",
        "MVP-eventlisten viser sprog på hvert kort. De fleste fællesskabsevents kan afholdes på engelsk.",
        "У списку подій MVP на кожній картці вказано мову. Більшість спільнотних подій можуть проводитись англійською.",
      ],
    },
  ],
  "Host at RORUM": [
    {
      q: [
        "Can I host my own event at RORUM?",
        "Kan jeg være vært for mit eget event hos RORUM?",
        "Чи можу я провести власну подію в RORUM?",
      ],
      a: [
        "Yes. Send the Host at RORUM inquiry form with your format, audience and preferred dates.",
        "Ja. Send Vær vært hos RORUM-forespørgselsformularen med dit format, målgruppe og foretrukne datoer.",
        "Так. Надішліть форму запиту «Провести подію в RORUM» із зазначенням формату, аудиторії та бажаних дат.",
      ],
    },
    {
      q: [
        "Do you help promote hosted events?",
        "Hjælper I med at promovere værtsledede events?",
        "Чи допомагаєте ви просувати організовані події?",
      ],
      a: [
        "For selected collaborations, RORUM can support with listing, visuals and community channels.",
        "For udvalgte samarbejder kan RORUM hjælpe med opslag, visuals og fællesskabskanaler.",
        "Для окремих партнерств RORUM може допомогти з розміщенням, візуальними матеріалами та каналами спільноти.",
      ],
    },
    {
      q: [
        "What is the cancellation policy?",
        "Hvad er afbestillingspolitikken?",
        "Яка політика скасування?",
      ],
      a: [
        "MVP policy copy is indicative. Final booking terms should be confirmed before launch.",
        "MVP-politikteksten er vejledende. Endelige bookingvilkår bør bekræftes inden lancering.",
        "Текст політики MVP є орієнтовним. Остаточні умови бронювання слід підтвердити перед запуском.",
      ],
    },
  ],
  Services: [
    {
      q: [
        "Can catering be added to any booking?",
        "Kan catering tilføjes til enhver booking?",
        "Чи можна додати кейтеринг до будь-якого бронювання?",
      ],
      a: [
        "Most bookings can include coffee, light breakfast, lunch boards or evening bites depending on date and group size.",
        "De fleste bookinger kan inkludere kaffe, let morgenmad, frokostbrætter eller aftensnacks afhængigt af dato og gruppestørrelse.",
        "Більшість бронювань можуть включати каву, легкий сніданок, обідні дошки або вечірні закуски залежно від дати й розміру групи.",
      ],
    },
    {
      q: [
        "Do you style events outside RORUM?",
        "Styler I events uden for RORUM?",
        "Чи оформлюєте ви події поза RORUM?",
      ],
      a: [
        "For the MVP, styling inquiries are focused on RORUM events, but collaboration requests can be submitted.",
        "For MVP'en er stylingforespørgsler fokuseret på RORUM-events, men samarbejdsanmodninger kan indsendes.",
        "У межах MVP запити на стилізацію стосуються подій RORUM, але можна подати запит на співпрацю.",
      ],
    },
  ],
  Volunteering: [
    {
      q: [
        "What do volunteers do?",
        "Hvad laver frivillige?",
        "Чим займаються волонтери?",
      ],
      a: [
        "Volunteers may help with guest welcome, room reset, light hosting and event support.",
        "Frivillige kan hjælpe med at byde gæster velkommen, klargøre rummet, let værtsskab og eventsupport.",
        "Волонтери можуть допомагати із зустріччю гостей, підготовкою приміщення, легким веденням заходу та подієвою підтримкою.",
      ],
    },
    {
      q: ["Is volunteering paid?", "Er frivilligt arbejde betalt?", "Чи оплачується волонтерство?"],
      a: [
        "Volunteer roles are community-based. Paid work and collaborations should use the Work With Us form.",
        "Frivillige roller er fællesskabsbaserede. Betalt arbejde og samarbejder bør bruge Arbejd med os-formularen.",
        "Волонтерські ролі базуються на спільноті. Для оплачуваної роботи та співпраці використовуйте форму «Працюйте з нами».",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Catering menu — category + item translations
// ---------------------------------------------------------------------------

const cateringCategoryTranslations: Record<
  string,
  { title: [string, string]; navLabel: [string, string]; description: [string, string] }
> = {
  ukrainian: {
    title: ["Traditionelt ukrainsk køkken", "Традиційна українська кухня"],
    navLabel: ["Ukrainsk køkken", "Українська кухня"],
    description: [
      "Autentiske hjemmelavede retter, der bringer varme, gavmildhed og en ægte ukrainsk bordoplevelse til dit event.",
      "Автентичні домашні страви, що привносять тепло, щедрість і справжню атмосферу українського столу на вашу подію.",
    ],
  },
  danish: {
    title: ["Dansk køkken", "Данська кухня"],
    navLabel: ["Dansk køkken", "Данська кухня"],
    description: [
      "Velkendte danske retter og sæsonklassikere til afslappede, elegante og lokalt inspirerede sammenkomster.",
      "Знайомі данські страви та сезонна класика для невимушених, елегантних і локально натхненних зустрічей.",
    ],
  },
  vegetarian: {
    title: ["Vegetarmenu", "Вегетаріанське меню"],
    navLabel: ["Vegetarmenu", "Вегетаріанське меню"],
    description: [
      "Sæsonbaserede vegetarretter med varme smage, friske råvarer og gennemtænkt anretning.",
      "Сезонні вегетаріанські страви з теплими смаками, свіжими інгредієнтами та продуманою подачею.",
    ],
  },
  "finger-food": {
    title: ["Fingermad", "Закуски"],
    navLabel: ["Fingermad", "Закуски"],
    description: [
      "Elegante små snacks til mingling, netværk, receptioner og uformelle private sammenkomster.",
      "Елегантні невеликі закуски для спілкування, нетворкінгу, прийомів та неформальних приватних зустрічей.",
    ],
  },
  grill: {
    title: ["Grillmenu", "Гриль-меню"],
    navLabel: ["Grillmenu", "Гриль-меню"],
    description: [
      "Et gavmildt grillvalg til afslappede fejringer, sommerarrangementer og varme uformelle sammenkomster.",
      "Щедрий вибір страв на грилі для невимушених свят, літніх заходів і теплих неформальних зустрічей.",
    ],
  },
  desserts: {
    title: ["Desserter og sødt bord", "Десерти та солодкий стіл"],
    navLabel: ["Desserter og sødt bord", "Десерти та солодкий стіл"],
    description: [
      "Et festligt dessertudvalg til fejringer, receptioner, familiearrangementer og særlige lejligheder.",
      "Святковий вибір десертів для урочистостей, прийомів, сімейних заходів та особливих подій.",
    ],
  },
};

const cateringItemTranslations: Record<string, { name: [string, string]; description: [string, string] }> = {
  Borscht: {
    name: ["Borsjtj", "Борщ"],
    description: [
      "Traditionel ukrainsk rødbedesuppe med grøntsager, krydderurter og creme fraiche, serveret med mørkt brød.",
      "Традиційний український борщ з овочами, зеленню та сметаною, подається з чорним хлібом.",
    ],
  },
  Holubtsi: {
    name: ["Holubtsi", "Голубці"],
    description: [
      "Møre kålruller fyldt med krydret ris og kød og bagt i sauce.",
      "Ніжні капустяні голубці з начинкою з рису та м'яса, запечені в соусі.",
    ],
  },
  Varenyky: {
    name: ["Varenyky", "Вареники"],
    description: [
      "Traditionelle ukrainske dumplings med krydret fyld, serveret med creme fraiche, dild og karamelliserede løg.",
      "Традиційні українські вареники з пікантною начинкою, подаються зі сметаною, кропом та карамелізованою цибулею.",
    ],
  },
  "Country-style potatoes": {
    name: ["Landkartofler", "Картопля по-селянськи"],
    description: [
      "Gyldne bagte kartoffelbåde med krydderurter, dild og dipsaucer. Et enkelt, trøstende ukrainsk-stil tilbehør til fælles borde.",
      "Золотисті запечені часточки картоплі з зеленню, кропом та соусами. Простий, затишний гарнір у українському стилі для спільного столу.",
    ],
  },
  "Pork neck baked with garlic and herbs": {
    name: ["Svinehals bagt med hvidløg og krydderurter", "Свиняча шия, запечена з часником і травами"],
    description: [
      "Mør ovnbagt svinehals krydret med hvidløg, rosmarin og krydderurter, serveret i skiver som en varm, gavmild hovedret.",
      "Ніжна запечена свиняча шия, приправлена часником, розмарином і травами, подається скибочками як щедра гаряча основна страва.",
    ],
  },
  Vereshchaka: {
    name: ["Vereshchaka", "Верещака"],
    description: [
      "En traditionel ukrainsk svinekødsret, der tilberedes langsomt i en rig, syrlig sauce og ofte serveres med cremede kartofler.",
      "Традиційна українська страва зі свинини, тушкована в насиченому кисло-солодкому соусі, часто подається з вершковою картоплею.",
    ],
  },
  "Chicken Kyiv": {
    name: ["Kyiv-kylling", "Котлета по-київськи"],
    description: [
      "En klassisk ukrainsk kyllingekotelet fyldt med hvidløgs-urtesmør, paneret sprødt og serveret gylden udenpå med et smeltende indre.",
      "Класична українська котлета з курки, начинена часниково-трав'яним маслом, обсмажена до хрумкої скоринки із соковитою серединою.",
    ],
  },
  "Green borscht": {
    name: ["Grøn borsjtj", "Зелений борщ"],
    description: [
      "En frisk syrekål-baseret suppe med kartofler, krydderurter, æg og creme fraiche.",
      "Свіжий щавлевий суп з картоплею, зеленню, яйцем та сметаною.",
    ],
  },
  "Homemade sausage": {
    name: ["Hjemmelavet pølse", "Домашня ковбаса"],
    description: [
      "Traditionel krydret pølse tilberedt til et gavmildt fællesbord.",
      "Традиційна приправлена ковбаса, приготована для щедрого спільного столу.",
    ],
  },
  Deruny: {
    name: ["Deruny", "Деруни"],
    description: [
      "Sprøde ukrainske kartoffelpandekager serveret varme med et cremet tilbehør.",
      "Хрусткі українські дерунки, подаються теплими з вершковим доповненням.",
    ],
  },
  Pickles: {
    name: ["Syltede grøntsager", "Соління"],
    description: [
      "Et lyst udvalg af hjemmestils syltede grøntsager til fællesbordet.",
      "Яскравий вибір домашніх солінь для спільного столу.",
    ],
  },
  "Traditional salads": {
    name: ["Traditionelle salater", "Традиційні салати"],
    description: [
      "Et skiftende udvalg af velkendte ukrainske salater lavet til at dele.",
      "Змінний вибір знайомих українських салатів, приготованих для спільного частування.",
    ],
  },
  "Appetizers with salo": {
    name: ["Forretter med salo", "Закуски із салом"],
    description: [
      "Traditionel salo serveret med brød, syltede grøntsager, sennep og velsmagende tilbehør.",
      "Традиційне сало, подається з хлібом, соліннями, гірчицею та смачними доповненнями.",
    ],
  },
  Smørrebrød: {
    name: ["Smørrebrød", "Смеребрьод (данські бутерброди)"],
    description: [
      "Traditionelle danske smørrebrød med sæsonbaseret pålæg.",
      "Традиційні данські відкриті бутерброди із сезонними начинками.",
    ],
  },
  Frikadeller: {
    name: ["Frikadeller", "Фрикадельки"],
    description: [
      "Klassiske danske frikadeller, serveret varme med traditionelt tilbehør.",
      "Класичні данські фрикадельки, подаються теплими з традиційним гарніром.",
    ],
  },
  "Marinated herring": {
    name: ["Marineret sild", "Маринований оселедець"],
    description: [
      "En dansk favorit, ofte serveret med brød, løg og krydderurter.",
      "Улюблена данська страва, часто подається з хлібом, цибулею та зеленню.",
    ],
  },
  Flæskesteg: {
    name: ["Flæskesteg", "Флескестег (данська печеня)"],
    description: [
      "Flæskesteg med sprød svær, serveret med klassisk dansk tilbehør.",
      "Печена свинина з хрусткою скоринкою, подається з класичним данським гарніром.",
    ],
  },
  Kalveculotte: {
    name: ["Kalveculotte", "Телятина культот"],
    description: [
      "Mør ovnstegt kalv serveret i skiver med sæsonbaseret tilbehør.",
      "Ніжна запечена телятина, подається скибочками із сезонним гарніром.",
    ],
  },
  "Danish baked potatoes": {
    name: ["Danske bagte kartofler", "Данська запечена картопля"],
    description: [
      "Gyldne bagte kartofler krydret enkelt og serveret som varmt tilbehør.",
      "Золотиста запечена картопля з простими спеціями, подається як теплий гарнір.",
    ],
  },
  Flødekartofler: {
    name: ["Flødekartofler", "Флеєкартофлер (картопля у вершках)"],
    description: [
      "Klassiske danske kartofler bagt i fløde, indtil de er møre og gyldne.",
      "Класична данська картопля, запечена у вершках до м'якості й золотистого кольору.",
    ],
  },
  "Danish seasonal appetizers": {
    name: ["Danske sæsonforretter", "Данські сезонні закуски"],
    description: [
      "Små sæsonforretter udvalgt til lejligheden og årstiden.",
      "Невеликі сезонні закуски, підібрані відповідно до події та пори року.",
    ],
  },
  "Traditional Danish dishes": {
    name: ["Traditionelle danske retter", "Традиційні данські страви"],
    description: [
      "Et skiftende udvalg af velkendte danske klassikere til et fællesbord.",
      "Змінний вибір знайомої данської класики для спільного столу.",
    ],
  },
  "Baked pumpkin with feta and honey": {
    name: ["Bagt græskar med feta og honning", "Запечений гарбуз із фетою та медом"],
    description: [
      "En varm sæsonret med søde, salte og cremede nuancer.",
      "Тепла сезонна страва із солодкими, солоними та кремовими нотками.",
    ],
  },
  "Deruny with mushroom sauce": {
    name: ["Deruny med svampesauce", "Деруни з грибним соусом"],
    description: [
      "Sprøde kartoffelpandekager serveret med en rig svampesauce.",
      "Хрусткі картопляні деруни, подаються з насиченим грибним соусом.",
    ],
  },
  "Varenyky with potatoes and caramelized onions": {
    name: ["Varenyky med kartofler og karamelliserede løg", "Вареники з картоплею та карамелізованою цибулею"],
    description: [
      "Traditionelle dumplings med et trøstende vegetarisk fyld.",
      "Традиційні вареники з ситною вегетаріанською начинкою.",
    ],
  },
  "Arugula salad with beetroot, feta and nuts": {
    name: ["Rucolasalat med rødbeder, feta og nødder", "Салат з рукколою, буряком, фетою та горіхами"],
    description: [
      "Frisk, farverig og afbalanceret med jordagtige og cremede smage.",
      "Свіжий, барвистий та збалансований смак із землистими й кремовими нотками.",
    ],
  },
  "Hummus with seasonal vegetables": {
    name: ["Hummus med sæsongrøntsager", "Хумус із сезонними овочами"],
    description: ["Cremet hummus serveret med sprøde sæsongrøntsager.", "Кремовий хумус подається з хрусткими сезонними овочами."],
  },
  "Bruschetta with tomatoes and basil": {
    name: ["Bruschetta med tomater og basilikum", "Брускета з томатами та базиліком"],
    description: [
      "Ristet brød toppet med modne tomater, basilikum og let krydring.",
      "Підсмажений хліб зі стиглими томатами, базиліком та легкими спеціями.",
    ],
  },
  "Vegetable tartlets": {
    name: ["Grøntsagstærtelet", "Овочеві тарталетки"],
    description: [
      "Små pikante tærteletter fyldt med farverige sæsongrøntsager.",
      "Невеликі пікантні тарталетки з барвистими сезонними овочами.",
    ],
  },
  "Mini appetizers with salmon and cream cheese": {
    name: ["Mini forretter med laks og flødeost", "Міні-закуски з лососем і вершковим сиром"],
    description: [
      "Lette, elegante bidder velegnet til receptioner og velkomstdrinks.",
      "Легкі, елегантні закуски, ідеальні для прийомів та вітальних напоїв.",
    ],
  },
  "Mini appetizers with avocado and shrimp": {
    name: ["Mini forretter med avocado og rejer", "Міні-закуски з авокадо та креветками"],
    description: [
      "Frisk og delikat fingermad til et moderne eventbord.",
      "Свіжі й вишукані закуски для сучасного святкового столу.",
    ],
  },
  "Cheese platter": {
    name: ["Ostefad", "Сирна тарілка"],
    description: [
      "Assorterede oste serveret med nødder, honning og sæsontilbehør.",
      "Асорті сирів із горіхами, медом та сезонними доповненнями.",
    ],
  },
  "Vegetable platter": {
    name: ["Grøntsagsfad", "Овочева тарілка"],
    description: ["Friske grøntsager, syltede grøntsager og lette sæsonsnacks.", "Свіжі овочі, соління та легкі сезонні закуски."],
  },
  Canapés: {
    name: ["Kanapéer", "Канапе"],
    description: [
      "Elegante bidstore kanapéer med varieret sæsontilbehør.",
      "Елегантні канапе на один укус із різноманітними сезонними начинками.",
    ],
  },
  Bruschetta: {
    name: ["Bruschetta", "Брускета"],
    description: [
      "Sprødt ristet brød med friske, velsmagende toppings til nem deling.",
      "Хрумкий підсмажений хліб зі свіжими начинками для зручного частування.",
    ],
  },
  "Mini burgers": {
    name: ["Mini burgere", "Міні-бургери"],
    description: [
      "Små, tilfredsstillende burgere designet til receptioner og uformelle sammenkomster.",
      "Невеликі, ситні бургери, створені для прийомів і неформальних зустрічей.",
    ],
  },
  "Seasonal snacks": {
    name: ["Sæsonsnacks", "Сезонні закуски"],
    description: [
      "Et fleksibelt udvalg af små pikante bidder udvalgt til sæsonen.",
      "Гнучкий вибір невеликих пікантних закусок, підібраних під сезон.",
    ],
  },
  Shashlyk: {
    name: ["Shashlyk", "Шашлик"],
    description: ["Grillet marineret kød, serveret varmt med tilbehør og saucer.", "Смажене на грилі маринове м'ясо, подається гарячим із гарніром та соусами."],
  },
  "Grilled salmon": {
    name: ["Grillet laks", "Лосось на грилі"],
    description: [
      "Mør laks tilberedt på grillen med sæsontilbehør.",
      "Ніжний лосось, приготований на грилі із сезонними доповненнями.",
    ],
  },
  "Grilled vegetables": {
    name: ["Grillede grøntsager", "Овочі на грилі"],
    description: ["Farverige sæsongrøntsager med røget grillsmag.", "Барвисті сезонні овочі з димним смаком гриля."],
  },
  "Homemade sauces": {
    name: ["Hjemmelavede saucer", "Домашні соуси"],
    description: ["Saucer tilberedt in-house til at supplere grillmenuen.", "Соуси, приготовані власноруч на доповнення до гриль-меню."],
  },
  Steaks: {
    name: ["Steaks", "Стейки"],
    description: [
      "Grillede kødstykker tilberedt til et smagfuldt centerpunkt for menuen.",
      "Шматки м'яса на грилі, приготовані як яскравий центральний елемент меню.",
    ],
  },
  "Grilled sausages": {
    name: ["Grillede pølser", "Ковбаски на грилі"],
    description: [
      "Krydrede pølser grillet til de er gyldne og serveret varme fra grillen.",
      "Приправлені ковбаски, обсмажені на грилі до золотистого кольору та подані гарячими.",
    ],
  },
  "Seasonal sides": {
    name: ["Sæsontilbehør", "Сезонні гарніри"],
    description: [
      "Friske sæsongrøntsager og varmt tilbehør til grillmenuen.",
      "Свіжі сезонні овочі та теплі доповнення до гриль-меню.",
    ],
  },
  "Fruit sets": {
    name: ["Frugtfade", "Фруктові набори"],
    description: [
      "Friske sæsonfrugtfade til receptioner, brunches og fællesborde.",
      "Свіжі сезонні фруктові тарелі для прийомів, бранчів та спільних столів.",
    ],
  },
  "Napoleon cake": {
    name: ["Napoleonkage", "Торт «Наполеон»"],
    description: ["Lagdelt tærtekage med cremet fyld.", "Шаруватий торт із вершковою начинкою."],
  },
  "Chocolate fountain": {
    name: ["Chokoladefontæne", "Шоколадний фонтан"],
    description: [
      "En festlig chokoladefontæne serveret med frugt og søde dippesnacks.",
      "Святковий шоколадний фонтан подається з фруктами та солодкими закусками для вмочування.",
    ],
  },
  "Ice cream with toppings": {
    name: ["Is med toppings", "Морозиво з топінгами"],
    description: ["Is serveret med bær, chokolade og toppings.", "Морозиво з ягодами, шоколадом та топінгами."],
  },
  Medivnyk: {
    name: ["Medivnyk", "Медівник"],
    description: [
      "Traditionel honningkage med bløde lag og delikat creme.",
      "Традиційний медовий торт із ніжними коржами та делікатним кремом.",
    ],
  },
  "Traditional Ukrainian Pliatsky": {
    name: ["Traditionel ukrainsk Pliatsky", "Традиційний український пляцок"],
    description: [
      "Rige, lagdelte kager lavet med delikat butterdej, cremede fyld, frugt og nødder.",
      "Багаті шаруваті торти з делікатним тістом, кремовою начинкою, фруктами та горіхами.",
    ],
  },
  "Festive sweets": {
    name: ["Festlige sødter", "Святкові солодощі"],
    description: [
      "Et assorteret udvalg af små sødter til fejringer og dessertborde.",
      "Асортований вибір невеликих солодощів для свят та десертних столів.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

const socialLinkLabelTranslations: Record<string, [string, string]> = {
  instagram: ["Instagram", "Instagram"],
  facebook: ["Facebook", "Facebook"],
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  const patches: { id: string; fields: Record<string, unknown> }[] = [];

  // Page singletons
  patches.push({ id: "homePage", fields: homePageFields });
  patches.push({ id: "aboutPage", fields: aboutPageFields });
  patches.push({ id: "cateringPage", fields: cateringPageFields });
  patches.push({ id: "eventDecorationPage", fields: eventDecorationPageFields });
  patches.push({
    id: "hostAtRorumPage",
    fields: { ...hostAtRorumPageFields, packages: hostAtRorumPackages },
  });
  patches.push({ id: "communityMembershipPage", fields: communityMembershipPageFields });
  patches.push({ id: "contactPage", fields: contactPageFields });
  patches.push({ id: "eventsPage", fields: eventsPageFields });
  patches.push({ id: "faqPage", fields: faqPageFields });
  patches.push({ id: "volunteerPage", fields: volunteerPageFields });
  patches.push({ id: "workWithUsPage", fields: workWithUsPageFields });
  patches.push({
    id: "legalPage-terms",
    fields: {
      title: legalTermsTitle,
      subtitle: legalTermsSubtitle,
      body: triBody(legalTermsBodyEn, legalTermsBodyDa, legalTermsBodyUk),
    },
  });
  patches.push({
    id: "legalPage-privacy-policy",
    fields: {
      title: legalPrivacyTitle,
      subtitle: legalPrivacySubtitle,
      body: triBody(legalPrivacyBodyEn, legalPrivacyBodyDa, legalPrivacyBodyUk),
    },
  });
  patches.push({
    id: "legalPage-cookie-policy",
    fields: {
      title: legalCookieTitle,
      subtitle: legalCookieSubtitle,
      body: triBody(legalCookieBodyEn, legalCookieBodyDa, legalCookieBodyUk),
    },
  });
  patches.push({ id: "navigation", fields: navigationFields });
  patches.push({ id: "footer", fields: footerFields });
  patches.push({ id: "formMessages", fields: formMessagesFields });

  // Events
  for (const event of events) {
    const titleTr = eventTitleTranslations[event.title];
    if (!titleTr) {
      console.warn(`No translation for event "${event.title}" — skipping.`);
      continue;
    }
    const [titleDa, titleUk] = titleTr;
    const featured = featuredEventTranslations[event.slug];

    if (featured) {
      patches.push({
        id: deterministicId("event", event.slug),
        fields: {
          title: tri(event.title, titleDa, titleUk),
          longDescription: triText(event.longDescription, featured.long[0], featured.long[1]),
          included: event.included.map((text, i) =>
            triBullet(`i${i}`, text, featured.included[i]![0], featured.included[i]![1]),
          ),
          // `whatToExpect` is now one multiline internationalizedArrayText
          // field per language (sanity/schemaTypes/documents/event.ts), not
          // an array of per-bullet objects — join each language's 5 bullet
          // translations with newlines so the stored shape matches.
          whatToExpect: triText(
            event.whatToExpect.join("\n"),
            featured.whatToExpect.map(([da]) => da).join("\n"),
            featured.whatToExpect.map(([, uk]) => uk).join("\n"),
          ),
        },
      });
    } else {
      const { longDescription } = expandedEventDescriptions(event.title, titleDa, titleUk);
      patches.push({
        id: deterministicId("event", event.slug),
        fields: {
          title: tri(event.title, titleDa, titleUk),
          longDescription,
          included: expandedIncluded,
          whatToExpect: triText(
            expandedWhatToExpectEn.join("\n"),
            expandedWhatToExpectDa.join("\n"),
            expandedWhatToExpectUk.join("\n"),
          ),
        },
      });
    }
  }

  // FAQ groups
  for (const [groupTitle, entries] of Object.entries(faqs)) {
    const titleTr = faqGroupTitleTranslations[groupTitle];
    const qa = faqQA[groupTitle];
    if (!titleTr || !qa) {
      console.warn(`No translation for FAQ group "${groupTitle}" — skipping.`);
      continue;
    }
    patches.push({
      id: deterministicId("faqGroup", groupTitle),
      fields: {
        title: tri(groupTitle, titleTr[0], titleTr[1]),
        items: entries.map(([question, answer], i) => {
          const entry = qa[i]!;
          return {
            _key: `q${i}`,
            _type: "faqItem",
            question: tri(question, entry.q[1], entry.q[2]),
            answer: triText(answer, entry.a[1], entry.a[2]),
          };
        }),
      },
    });
  }

  // Catering menu categories + items
  for (const category of menuCategories) {
    const catTr = cateringCategoryTranslations[category.id];
    if (!catTr) {
      console.warn(`No translation for catering category "${category.id}" — skipping.`);
      continue;
    }
    patches.push({
      id: deterministicId("cateringMenuCategory", category.id),
      fields: {
        title: tri(category.title, catTr.title[0], catTr.title[1]),
        navLabel: tri(category.navLabel, catTr.navLabel[0], catTr.navLabel[1]),
        description: triText(category.description, catTr.description[0], catTr.description[1]),
        featuredItems: category.featuredItems.map((item, i) => {
          const itemTr = cateringItemTranslations[item.name];
          if (!itemTr) {
            console.warn(`No translation for catering item "${item.name}" — leaving en-only.`);
            return {
              _key: `f${i}`,
              _type: "cateringMenuItem",
              name: tri(item.name, item.name, item.name),
              description: triText(item.description, item.description, item.description),
            };
          }
          return {
            _key: `f${i}`,
            _type: "cateringMenuItem",
            name: tri(item.name, itemTr.name[0], itemTr.name[1]),
            description: triText(item.description, itemTr.description[0], itemTr.description[1]),
          };
        }),
      },
    });
  }

  // Social links
  patches.push({
    id: "socialLinks",
    fields: {
      links: socialLinksData.map((link) => {
        const labelTr = socialLinkLabelTranslations[link.icon] ?? [link.label, link.label];
        return {
          _key: slugify(link.icon),
          icon: link.icon,
          href: link.href,
          label: tri(link.label, labelTr[0], labelTr[1]),
          brandColor: link.brandColor,
        };
      }),
    },
  });

  console.log(`Import summary (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log(`  ${patches.length} documents to patch with da/uk translations.`);
  for (const p of patches) console.log(`    ${p.id}`);

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

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

  let patched = 0;
  for (const p of patches) {
    await client.patch(p.id).set(p.fields).commit({ autoGenerateArrayKeys: false });
    patched++;
  }
  console.log(`\nPatched ${patched} documents with da/uk translations.`);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Translation import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
