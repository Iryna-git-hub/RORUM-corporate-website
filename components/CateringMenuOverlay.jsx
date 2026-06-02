"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const menuCategories = [
  {
    id: "ukrainian",
    title: "Traditional Ukrainian cuisine",
    navLabel: "Ukrainian cuisine",
    description:
      "Authentic homemade dishes that bring warmth, generosity, and a true Ukrainian table experience to your event.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Borscht",
        description:
          "Traditional beetroot soup served with sour cream and herbs.",
        image: "/images/catering/catering-borsch.png",
        alt: "A bowl of traditional Ukrainian borscht with herbs",
      },
      {
        name: "Varenyky",
        description:
          "Ukrainian dumplings with savory fillings, served with sour cream or fried onions.",
        image: "/images/catering/catering-dumplings.png",
        alt: "Ukrainian varenyky dumplings served on a plate",
      },
      {
        name: "Holubtsi",
        description:
          "Cabbage rolls filled with rice and meat, slowly cooked in a rich sauce.",
        image: "/images/catering/catering-2.png",
        alt: "A generous Ukrainian table with homemade dishes",
      },
      {
        name: "Deruny",
        description:
          "Crispy potato pancakes, traditionally served with sour cream or mushroom sauce.",
        image: "/images/catering/catering-gallery-added-01.png",
        alt: "Crispy savory pancakes served as part of a catering table",
      },
      {
        name: "Chicken Kyiv",
        description:
          "A classic chicken dish with a buttery herb filling and golden crispy coating.",
        image: "/images/catering/catering-modern-plates.png",
        alt: "Elegant plated warm dish prepared for a private event",
      },
    ],
    alsoAvailable: [
      "Green borscht",
      "Homemade sausage",
      "Pork neck baked with garlic and herbs",
      "Vereshchaka",
      "Country-style potatoes",
      "Pickles",
      "Traditional salads",
      "Appetizers with salo",
    ],
  },
  {
    id: "danish",
    title: "Danish cuisine",
    navLabel: "Danish cuisine",
    description:
      "Familiar Danish dishes and seasonal classics for relaxed, elegant, and locally inspired gatherings.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Smørrebrød",
        description:
          "Traditional Danish open-faced sandwiches with seasonal toppings.",
        image: "/images/catering/catering-board.png",
        alt: "A composed catering board with seasonal toppings",
      },
      {
        name: "Frikadeller",
        description:
          "Classic Danish meatballs, served warm with traditional sides.",
        image: "/images/catering/catering-gallery-added-02.png",
        alt: "Warm savory bites arranged for a Danish-inspired gathering",
      },
      {
        name: "Marinated herring",
        description:
          "A Danish favorite, often served with bread, onions, and herbs.",
        image: "/images/catering/catering-charcuterie.png",
        alt: "Nordic-style savory platter with bread and garnishes",
      },
      {
        name: "Flæskesteg",
        description:
          "Roast pork with crispy crackling, served with classic Danish sides.",
        image: "/images/catering/catering-gallery-added-03.png",
        alt: "Warm Danish-style catering dish served for an event",
      },
    ],
    alsoAvailable: [
      "Kalveculotte",
      "Danish baked potatoes",
      "Flødekartofler",
      "Danish seasonal appetizers",
      "Traditional Danish dishes",
    ],
  },
  {
    id: "european",
    title: "Modern European cuisine",
    navLabel: "Modern European cuisine",
    description:
      "A flexible menu created individually according to the style, timing, and atmosphere of your event.",
    featuredLabel: "Menu formats",
    featuredItems: [
      {
        name: "Private dinner menu",
        description:
          "A seated dinner with seasonal starters, main courses, sides, and desserts.",
        image: "/images/catering/catering-long-buffet.png",
        alt: "A long elegant table set for a private dinner",
      },
      {
        name: "Reception-style menu",
        description: "Elegant light dishes, small bites, and shareable plates.",
        image: "/images/catering/catering-welcome-drinks.png",
        alt: "Welcome drinks and light reception dishes",
      },
      {
        name: "Business meeting menu",
        description:
          "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
        image: "/images/catering/catering-service-team.png",
        alt: "Catering service arranged for a professional meeting",
      },
    ],
    additionalText:
      "The final menu is created together with you based on the event format and guest preferences.",
  },
  {
    id: "vegetarian",
    title: "Vegetarian menu",
    navLabel: "Vegetarian menu",
    description:
      "Seasonal vegetarian dishes with warm flavors, fresh ingredients, and thoughtful presentation.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Baked pumpkin with feta and honey",
        description:
          "A warm seasonal dish with sweet, salty, and creamy notes.",
        image: "/images/catering/catering-gallery-added-04.png",
        alt: "Seasonal vegetarian dish with warm colors",
      },
      {
        name: "Deruny with mushroom sauce",
        description:
          "Crispy potato pancakes served with a rich mushroom sauce.",
        image: "/images/catering/catering-gallery-added-05.png",
        alt: "Vegetarian savory dish prepared for catering",
      },
      {
        name: "Varenyky with potatoes and caramelized onions",
        description:
          "Traditional dumplings with a comforting vegetarian filling.",
        image: "/images/catering/catering-dumplings.png",
        alt: "Varenyky dumplings with vegetarian filling",
      },
      {
        name: "Arugula salad with beetroot, feta and nuts",
        description:
          "Fresh, colorful, and balanced with earthy and creamy flavors.",
        image: "/images/catering/catering-gallery-added-06.png",
        alt: "Fresh vegetarian salad on an event table",
      },
    ],
    alsoAvailable: [
      "Bruschetta with tomatoes and basil",
      "Hummus with seasonal vegetables",
      "Vegetable tartlets",
    ],
  },
  {
    id: "finger-food",
    title: "Finger food",
    navLabel: "Finger food",
    description:
      "Elegant small bites for mingling, networking, receptions, and informal private gatherings.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Mini appetizers with salmon and cream cheese",
        description:
          "Light, elegant bites suitable for receptions and welcome drinks.",
        image: "/images/catering/catering-gallery-added-07.png",
        alt: "Small salmon appetizers arranged for a reception",
      },
      {
        name: "Mini appetizers with avocado and shrimp",
        description:
          "Fresh and delicate finger food for a modern event table.",
        image: "/images/catering/catering-gallery-added-08.png",
        alt: "Fresh mini appetizers served on a catering table",
      },
      {
        name: "Cheese platter",
        description:
          "Assorted cheeses served with nuts, honey, and seasonal additions.",
        image: "/images/catering/catering-charcuterie.png",
        alt: "Cheese and charcuterie platter with seasonal additions",
      },
      {
        name: "Vegetable platter",
        description: "Fresh vegetables, pickles, and light seasonal snacks.",
        image: "/images/catering/catering-board.png",
        alt: "Fresh platter with light vegetables and snacks",
      },
    ],
    alsoAvailable: ["Canapés", "Bruschetta", "Mini burgers", "Seasonal snacks"],
  },
  {
    id: "grill",
    title: "Grill menu",
    navLabel: "Grill menu",
    description:
      "A generous grill selection for relaxed celebrations, summer events, and warm informal gatherings.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Shashlyk",
        description: "Grilled marinated meat, served hot with sides and sauces.",
        image: "/images/catering/catering-gallery-added-09.png",
        alt: "Grilled marinated meat served with sides",
      },
      {
        name: "Grilled salmon",
        description:
          "Tender salmon prepared on the grill with seasonal accompaniments.",
        image: "/images/catering/catering-gallery-added-10.png",
        alt: "Grilled salmon prepared for a private event",
      },
      {
        name: "Grilled vegetables",
        description: "Colorful seasonal vegetables with smoky grill flavor.",
        image: "/images/catering/catering-gallery-added-11.png",
        alt: "Colorful grilled vegetables with seasonal sides",
      },
      {
        name: "Homemade sauces",
        description:
          "Sauces prepared in-house to complement the grill menu.",
        image: "/images/catering/catering-gallery-added-12.png",
        alt: "Homemade sauces served with a grill menu",
      },
    ],
    alsoAvailable: ["Steaks", "Grilled sausages", "Seasonal sides"],
  },
  {
    id: "desserts",
    title: "Desserts and sweet table",
    navLabel: "Desserts and sweet table",
    description:
      "A festive dessert selection for celebrations, receptions, family events, and special occasions.",
    featuredLabel: "Featured dishes",
    featuredItems: [
      {
        name: "Medivnyk",
        description:
          "Traditional honey cake with soft layers and delicate cream.",
        image: "/images/catering/catering-cake.png",
        alt: "Layered honey cake served on a dessert table",
      },
      {
        name: "Napoleon cake",
        description: "Layered pastry cake with creamy filling.",
        image: "/images/catering/catering-dessert-flowers.png",
        alt: "Layered cake with cream and floral dessert styling",
      },
      {
        name: "Pani Walewska",
        description:
          "A festive layered cake with meringue, cream, and jam.",
        image: "/images/catering/catering-dessert-table.png",
        alt: "Festive dessert table with layered cakes",
      },
      {
        name: "Mini desserts",
        description: "Small elegant desserts for receptions and sweet tables.",
        image: "/images/catering/catering-gallery-added-13.png",
        alt: "Small elegant desserts arranged for a reception",
      },
    ],
    alsoAvailable: [
      "Chocolate fountain",
      "Ice cream with toppings",
      "Profiteroles",
      "Fruit sets",
      "Festive sweets",
    ],
  },
];

const orderedMenuCategories = [
  menuCategories.find((category) => category.id === "ukrainian"),
  menuCategories.find((category) => category.id === "european"),
  menuCategories.find((category) => category.id === "danish"),
  menuCategories.find((category) => category.id === "vegetarian"),
  menuCategories.find((category) => category.id === "finger-food"),
  menuCategories.find((category) => category.id === "grill"),
  menuCategories.find((category) => category.id === "desserts"),
].filter(Boolean);

function FeaturedCard({ item }) {
  return (
    <article className="catering-menu-card">
      <div className="catering-menu-card-media">
        <img src={item.image} alt={item.alt} loading="lazy" />
      </div>
      <div className="catering-menu-card-copy">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

function CateringMenuOverlay({ open, onClose, onRequestMenu }) {
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const pageScrollRef = useRef(0);
  const restorePageScrollRef = useRef(true);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    pageScrollRef.current = window.scrollY;
    restorePageScrollRef.current = true;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      overlayRef.current?.scrollTo({ top: 0, left: 0 });
      closeButtonRef.current?.focus();
    });

    return () => {
      if (restorePageScrollRef.current) {
        window.scrollTo(0, pageScrollRef.current);
      }
    };
  }, [open]);

  if (!open) return null;

  const handleRequestMenu = () => {
    restorePageScrollRef.current = false;
    onRequestMenu();
  };

  const scrollToCategory = (event, id) => {
    event.preventDefault();
    document
      .getElementById(`catering-menu-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={overlayRef}
      className="catering-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catering-menu-title"
    >
      <div className="catering-menu-overlay-shell">
        <header className="catering-menu-overlay-header">
          <p>Rorum / Catering Menu</p>
          <button
            ref={closeButtonRef}
            className="catering-menu-close"
            type="button"
            aria-label="Close catering menu"
            onClick={onClose}
          >
            <X aria-hidden="true" strokeWidth={1.8} />
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <main className="catering-menu-overlay-main">
          <section className="catering-menu-hero">
            <div className="catering-menu-hero-copy">
              <h2 id="catering-menu-title" className="heading">
                Catering menu
              </h2>
              <p>
                Traditional Ukrainian hospitality, Danish classics, and
                European-style service for private meetings, celebrations, and
                special gatherings.
              </p>
              <p>
                Each menu is created individually based on your event format,
                number of guests, season, and dietary preferences.
              </p>
              <button
                className="btn catering-menu-request"
                type="button"
                onClick={handleRequestMenu}
              >
                Request custom menu
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
            </div>
          </section>

          <nav className="catering-menu-nav" aria-label="Catering categories">
            <div className="catering-menu-nav-inner">
              {orderedMenuCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#catering-menu-${category.id}`}
                  onClick={(event) => scrollToCategory(event, category.id)}
                >
                  {category.navLabel}
                </a>
              ))}
            </div>
          </nav>

          <div className="catering-menu-sections">
            {orderedMenuCategories.map((category) => (
              <section
                className="catering-menu-section"
                id={`catering-menu-${category.id}`}
                key={category.id}
              >
                <div className="catering-menu-section-head">
                  <h2 className="heading">{category.title}</h2>
                  <p>{category.description}</p>
                </div>

                {category.featuredItems?.length ? (
                  <div className="catering-menu-featured">
                    <h3>{category.featuredLabel}</h3>
                    <div className="catering-menu-card-grid">
                      {category.featuredItems.map((item) => (
                        <FeaturedCard item={item} key={item.name} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {category.additionalText ? (
                  <p className="catering-menu-additional">
                    {category.additionalText}
                  </p>
                ) : null}

                {category.alsoAvailable?.length ? (
                  <div className="catering-menu-also">
                    <h3>Also available</h3>
                    <ul>
                      {category.alsoAvailable.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          <section className="catering-menu-final">
            <div>
              <h2 className="heading">Create your custom menu</h2>
              <p>
                Tell us about your event, number of guests, preferred cuisine,
                and dietary needs. We will help create a menu that fits your
                occasion and makes your guests feel welcome.
              </p>
            </div>
            <div className="catering-menu-final-actions">
              <button className="btn" type="button" onClick={handleRequestMenu}>
                Request custom menu
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={onClose}
              >
                Back to Catering
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export function CateringMenuButton({
  children = "View Catering Menu Examples",
  variant = "primary",
  requestTargetId = "request-private-meeting",
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const closeOverlay = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const requestMenu = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      document
        .getElementById(requestTargetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [requestTargetId]);

  return (
    <>
      <button
        ref={triggerRef}
        className={`btn ${variant === "primary" ? "" : variant} catering-menu-trigger`.trim()}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {children}
        <ArrowRight
          className="button-arrow"
          aria-hidden="true"
          strokeWidth={1.9}
        />
      </button>
      <CateringMenuOverlay
        open={open}
        onClose={closeOverlay}
        onRequestMenu={requestMenu}
      />
    </>
  );
}
