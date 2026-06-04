"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Dessert,
  Flame,
  HandPlatter,
  Leaf,
  Minus,
  Plus,
  Sandwich,
  Soup,
  Utensils,
  X,
} from "lucide-react";

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
        name: "Country-style potatoes",
        description:
          "Golden roasted potato wedges with herbs, dill, and dipping sauces. A simple, comforting Ukrainian-style side for shared tables.",
        image: "/images/catering/ukrainian-country-potatoes.png",
        alt: "Country-style roasted potatoes with dill and sauces",
      },
      {
        name: "Pork neck baked with garlic and herbs",
        description:
          "Tender roasted pork neck seasoned with garlic, rosemary, and herbs, served sliced as a warm, generous main dish.",
        image: "/images/catering/ukrainian-pork-neck.png",
        alt: "Baked pork neck sliced with garlic and herbs",
      },
      {
        name: "Vereshchaka",
        description:
          "A traditional Ukrainian pork dish slowly cooked in a rich, tangy sauce and often served with creamy potatoes.",
        image: "/images/catering/ukrainian-vereshchaka.png",
        alt: "Traditional Ukrainian vereshchaka with sauce and potatoes",
      },
      {
        name: "Chicken Kyiv",
        description:
          "A classic Ukrainian chicken cutlet filled with garlic-herb butter, breaded until crisp, and served golden on the outside with a melting center.",
        image: "/images/catering/ukrainian-chicken-kyiv.png",
        alt: "Chicken Kyiv cutlet with garlic herb butter filling",
      },
      {
        name: "Dolmas",
        description:
          "Tender stuffed rolls filled with seasoned rice and meat, slowly cooked in tomato sauce and served with sour cream.",
        image: "/images/catering/ukrainian-dolmas.png",
        alt: "Dolmas served in tomato sauce with sour cream",
      },
      {
        name: "Borscht",
        description:
          "Traditional Ukrainian beetroot soup with vegetables, herbs, and sour cream, served with dark bread.",
        image: "/images/catering/ukrainian-borscht-traditional.png",
        alt: "A bowl of traditional Ukrainian borscht with herbs",
      },
      {
        name: "Varenyky",
        description:
          "Traditional Ukrainian dumplings with savory filling, served with sour cream, dill, and caramelized onions.",
        image: "/images/catering/ukrainian-varenyky.png",
        alt: "Ukrainian varenyky dumplings served on a plate",
      },
    ],
    alsoAvailable: [
      "Green borscht",
      "Homemade sausage",
      "Holubtsi",
      "Deruny",
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
        image: "/images/catering/danish-smorrebrod.png",
        alt: "Traditional Danish smorrebrod open-faced sandwiches",
      },
      {
        name: "Frikadeller",
        description:
          "Classic Danish meatballs, served warm with traditional sides.",
        image: "/images/catering/danish-frikadeller.png",
        alt: "Danish frikadeller served with potatoes, sauce, and pickles",
      },
      {
        name: "Marinated herring",
        description:
          "A Danish favorite, often served with bread, onions, and herbs.",
        image: "/images/catering/danish-marinated-herring.png",
        alt: "Marinated herring with onion, dill, capers, and rye bread",
      },
      {
        name: "Flæskesteg",
        description:
          "Roast pork with crispy crackling, served with classic Danish sides.",
        image: "/images/catering/danish-flaeskesteg.png",
        alt: "Flaeskesteg roast pork with crispy crackling and Danish sides",
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
        image: "/images/catering/european-private-dinner-menu.png",
        alt: "Private dinner table with modern European dishes and wine",
      },
      {
        name: "Reception-style menu",
        description: "Elegant light dishes, small bites, and shareable plates.",
        image: "/images/catering/european-reception-style-menu.png",
        alt: "Reception-style buffet with small bites and shared plates",
      },
      {
        name: "Business meeting menu",
        description:
          "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
        image: "/images/catering/european-business-meeting-menu.png",
        alt: "Business meeting catering buffet with wraps, salad, fruit, water and coffee",
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
        image: "/images/catering/vegetarian-baked-pumpkin-feta-honey.png",
        alt: "Baked pumpkin with feta, honey and herbs",
      },
      {
        name: "Deruny with mushroom sauce",
        description:
          "Crispy potato pancakes served with a rich mushroom sauce.",
        image: "/images/catering/vegetarian-deruny-mushroom-sauce.png",
        alt: "Ukrainian deruny with creamy mushroom sauce",
      },
      {
        name: "Varenyky with potatoes and caramelized onions",
        description:
          "Traditional dumplings with a comforting vegetarian filling.",
        image: "/images/catering/vegetarian-varenyky-potatoes-onion.png",
        alt: "Varenyky with potatoes and caramelized onion",
      },
      {
        name: "Arugula salad with beetroot, feta and nuts",
        description:
          "Fresh, colorful, and balanced with earthy and creamy flavors.",
        image: "/images/catering/vegetarian-arugula-beetroot-feta-walnuts.png",
        alt: "Arugula salad with beetroot, feta and walnuts",
      },
      {
        name: "Hummus with seasonal vegetables",
        description:
          "Creamy hummus served with crisp seasonal vegetables.",
        image: "/images/catering/vegetarian-hummus-seasonal-vegetables.png",
        alt: "Hummus with seasonal vegetables",
      },
    ],
    alsoAvailable: [
      "Bruschetta with tomatoes and basil",
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
        image: "/images/catering/finger-food-salmon-cream-cheese.png",
        alt: "Mini appetizers with salmon and cream cheese",
      },
      {
        name: "Mini appetizers with avocado and shrimp",
        description:
          "Fresh and delicate finger food for a modern event table.",
        image: "/images/catering/finger-food-avocado-shrimp.png",
        alt: "Mini appetizers with avocado and shrimps",
      },
      {
        name: "Cheese platter",
        description:
          "Assorted cheeses served with nuts, honey, and seasonal additions.",
        image: "/images/catering/finger-food-cheese-platter.png",
        alt: "Cheese platter with assorted cheeses, nuts and honey",
      },
      {
        name: "Vegetable platter",
        description: "Fresh vegetables, pickles, and light seasonal snacks.",
        image: "/images/catering/finger-food-vegetable-platter.png",
        alt: "Vegetable platter with fresh vegetables and pickles",
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
        image: "/images/catering/grill-shashlyk.png",
        alt: "Shashlik with flatbread and pickled vegetables",
      },
      {
        name: "Grilled salmon",
        description:
          "Tender salmon prepared on the grill with seasonal accompaniments.",
        image: "/images/catering/grill-grilled-salmon.png",
        alt: "Grilled salmon with lemon and herbs",
      },
      {
        name: "Grilled vegetables",
        description: "Colorful seasonal vegetables with smoky grill flavor.",
        image: "/images/catering/grill-grilled-vegetables.png",
        alt: "Grilled vegetables with herbs",
      },
      {
        name: "Homemade sauces",
        description:
          "Sauces prepared in-house to complement the grill menu.",
        image: "/images/catering/grill-homemade-sauces.png",
        alt: "Homemade sauces in ceramic bowls",
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
        name: "Fruit sets",
        description:
          "Fresh seasonal fruit platters for receptions, brunches, and shared tables.",
        image: "/images/catering/desserts-fruit-sets.png",
        alt: "Fresh fruit sets with seasonal fruit",
      },
      {
        name: "Napoleon cake",
        description: "Layered pastry cake with creamy filling.",
        image: "/images/catering/desserts-napoleon-cake.png",
        alt: "Napoleon cake with layered pastry and cream",
      },
      {
        name: "Profiteroles",
        description: "Small choux pastry desserts with cream filling.",
        image: "/images/catering/desserts-profiteroles.png",
        alt: "Profiteroles with cream and chocolate",
      },
      {
        name: "Mini desserts",
        description: "Small elegant desserts for receptions and sweet tables.",
        image: "/images/catering/desserts-mini-desserts.png",
        alt: "Assorted mini desserts on a sweet table",
      },
      {
        name: "Chocolate fountain",
        description:
          "A festive chocolate fountain served with fruit and sweet dipping snacks.",
        image: "/images/catering/desserts-chocolate-fountain.png",
        alt: "Chocolate fountain with fruit and sweets",
      },
      {
        name: "Ice cream with toppings",
        description: "Ice cream served with berries, chocolate, and toppings.",
        image: "/images/catering/desserts-ice-cream-toppings.png",
        alt: "Ice cream with berries, chocolate and toppings",
      },
      {
        name: "Medivnyk",
        description:
          "Traditional honey cake with soft layers and delicate cream.",
        image: "/images/catering/desserts-medivnyk.png",
        alt: "Medivnyk Ukrainian honey cake",
      },
    ],
    alsoAvailable: [
      "Pani Walewska",
      "Festive sweets",
    ],
  },
];

const orderedMenuCategories = [
  { ...menuCategories.find((category) => category.id === "ukrainian"), icon: Soup },
  { ...menuCategories.find((category) => category.id === "european"), navLabel: "European", icon: Utensils },
  { ...menuCategories.find((category) => category.id === "danish"), icon: Sandwich },
  { ...menuCategories.find((category) => category.id === "vegetarian"), navLabel: "Vegetarian", icon: Leaf },
  { ...menuCategories.find((category) => category.id === "finger-food"), icon: HandPlatter },
  { ...menuCategories.find((category) => category.id === "grill"), icon: Flame },
  { ...menuCategories.find((category) => category.id === "desserts"), navLabel: "Desserts", icon: Dessert },
].filter(Boolean);

// Shared scroll-offset constants used by both scrollToCategory and
// updateActiveCategory. OVERLAY_ACTIVE_THRESHOLD must be >= OVERLAY_SCROLL_GAP
// so that after a tab click the scrolled-to section is immediately detected
// as active.
const OVERLAY_SCROLL_GAP = 8;
const OVERLAY_ACTIVE_THRESHOLD = 10;

// Polls with requestAnimationFrame until getMeasurement() returns the same
// integer-rounded value for 2 consecutive frames (layout has settled), or
// until maxWaitMs has elapsed. Calls onStable() in either case.
// Returns a cancel function — call it to prevent onStable() from firing.
function waitForStableLayout(getMeasurement, onStable, maxWaitMs) {
  let cancelled = false;
  const start = performance.now();
  let lastRounded = null;
  let stableFrames = 0;

  const tick = () => {
    if (cancelled) return;
    const raw = getMeasurement();
    if (raw !== null) {
      const rounded = Math.round(raw);
      if (rounded === lastRounded) {
        stableFrames += 1;
        if (stableFrames >= 2) {
          onStable();
          return;
        }
      } else {
        stableFrames = 0;
        lastRounded = rounded;
      }
    }
    if (performance.now() - start >= maxWaitMs) {
      onStable();
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return () => { cancelled = true; };
}

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
  const shellRef = useRef(null);
  const closeButtonRef = useRef(null);
  const pageScrollRef = useRef(0);
  const restorePageScrollRef = useRef(true);
  // Ref used to suppress scroll-spy while a programmatic tab scroll is running.
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef(null);
  // Cancels any in-flight waitForStableLayout poll when a new tab click arrives
  // or the overlay closes.
  const cancelStableLayoutRef = useRef(null);
  // Stable ref so the scroll-spy handler stays registered for the full overlay
  // lifetime without being torn down every time activeCategory changes.
  const updateActiveCategoryRef = useRef(null);
  const [expandedCategories, setExpandedCategories] = useState(["ukrainian"]);
  const [activeCategory, setActiveCategory] = useState("ukrainian");

  // ---------------------------------------------------------------------------
  // Helper: return the actual scroll container for the overlay.
  // On desktop the shell element is overflow-y: auto (it scrolls).
  // On small screens CSS sets the shell to overflow: visible and the overlay
  // itself becomes the scroll container. We detect this at runtime.
  // ---------------------------------------------------------------------------
  const getScrollContainer = () => {
    const shell = shellRef.current;
    if (!shell) return null;
    const style = window.getComputedStyle(shell);
    if (style.overflowY === "auto" || style.overflowY === "scroll") {
      return shell;
    }
    return overlayRef.current;
  };

  // ---------------------------------------------------------------------------
  // Shared scroll-target calculation helper (used both for the initial scroll
  // and for the correction pass).
  // ---------------------------------------------------------------------------
  const calcTargetScrollTop = (container, target) => {
    const containerRect = container.getBoundingClientRect();
    // Nav may be inside the shell or inside the overlay depending on layout;
    // always search from the shell so we find the sticky nav reliably.
    const shell = shellRef.current ?? container;
    const nav = shell.querySelector(".catering-menu-nav");
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    return (
      container.scrollTop +
      target.getBoundingClientRect().top -
      containerRect.top -
      navHeight -
      OVERLAY_SCROLL_GAP
    );
  };

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

    // Clear any in-flight programmatic scroll or layout poll from a previous
    // overlay session.
    clearTimeout(programmaticScrollTimerRef.current);
    if (cancelStableLayoutRef.current) {
      cancelStableLayoutRef.current();
      cancelStableLayoutRef.current = null;
    }
    isProgrammaticScrollRef.current = false;

    pageScrollRef.current = window.scrollY;
    restorePageScrollRef.current = true;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      shellRef.current?.scrollTo({ top: 0, left: 0 });
      closeButtonRef.current?.focus();
    });

    return () => {
      clearTimeout(programmaticScrollTimerRef.current);
      if (cancelStableLayoutRef.current) {
        cancelStableLayoutRef.current();
        cancelStableLayoutRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
      if (restorePageScrollRef.current) {
        window.scrollTo(0, pageScrollRef.current);
      }
    };
  }, [open]);

  // ---------------------------------------------------------------------------
  // Scroll-spy: registered ONCE per overlay open, never re-registered on
  // activeCategory changes. updateActiveCategory is kept fresh via a ref so
  // the handler always uses the latest state without being a new closure.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return undefined;

    const container = getScrollContainer();
    if (!container) return undefined;

    const handler = () => {
      // While a programmatic tab scroll is in progress, don't let the spy
      // override the category we just set.
      if (isProgrammaticScrollRef.current) return;
      updateActiveCategoryRef.current?.();
    };

    container.addEventListener("scroll", handler, { passive: true });
    // Run once immediately to set initial state.
    handler();

    return () => container.removeEventListener("scroll", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the ref pointing at the latest version of updateActiveCategory.
  // This is assigned below (after the function definition) before any render.

  if (!open) return null;

  // ---------------------------------------------------------------------------
  // updateActiveCategory — defined here so it can close over current state.
  // updateActiveCategoryRef is updated synchronously every render so the
  // scroll-spy handler always calls the freshest version.
  // ---------------------------------------------------------------------------
  const updateActiveCategory = () => {
    const container = getScrollContainer();
    if (!container) return;
    const shell = shellRef.current ?? container;
    const nav = shell.querySelector(".catering-menu-nav");
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const containerRect = container.getBoundingClientRect();
    const activationLine = containerRect.top + navHeight + OVERLAY_ACTIVE_THRESHOLD;
    let currentId = orderedMenuCategories[0]?.id ?? activeCategory;

    orderedMenuCategories.forEach((category) => {
      const section = shell.querySelector(`#catering-menu-${category.id}`);
      if (!section) return;
      const sectionRect = section.getBoundingClientRect();
      // Last section whose top is at or above the activation line.
      if (sectionRect.top <= activationLine) {
        currentId = category.id;
      }
    });

    setActiveCategory((current) => (current === currentId ? current : currentId));
  };

  // Sync the ref every render so the stable scroll listener always calls the
  // freshest closure (with current expandedCategories, etc.).
  updateActiveCategoryRef.current = updateActiveCategory;

  const handleRequestMenu = () => {
    restorePageScrollRef.current = false;
    onRequestMenu();
  };

  const scrollToCategory = (event, id) => {
    event.preventDefault();

    // 1. Immediate visual feedback — active tab updates at click time.
    setActiveCategory(id);

    // 2. Expand the target category if needed.
    //    This does not change the target section's own top position.
    setExpandedCategories((current) =>
      current.includes(id) ? current : [...current, id],
    );

    // 3. Suppress scroll-spy and cancel any previous in-flight layout poll.
    clearTimeout(programmaticScrollTimerRef.current);
    if (cancelStableLayoutRef.current) {
      cancelStableLayoutRef.current();
      cancelStableLayoutRef.current = null;
    }
    isProgrammaticScrollRef.current = true;

    const container = getScrollContainer();
    const shell = shellRef.current;
    if (!container || !shell) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    // 4. Wait until the target section's viewport position has stopped changing
    //    for 2 consecutive animation frames before measuring and scrolling.
    //    If sections above the target are mid-transition (accordion: 0.62s),
    //    the poll waits up to 700ms for them to settle. In the common case
    //    (no active transition above the target) this resolves in ~33ms.
    //    This ensures the single scrollTo always uses the final, stable target
    //    position — no visible second scroll is needed afterwards.
    cancelStableLayoutRef.current = waitForStableLayout(
      () => {
        const el = shell.querySelector(`#catering-menu-${id}`);
        return el ? el.getBoundingClientRect().top : null;
      },
      () => {
        cancelStableLayoutRef.current = null;
        const targetEl = shell.querySelector(`#catering-menu-${id}`);
        if (!targetEl || !container) {
          isProgrammaticScrollRef.current = false;
          return;
        }

        // 5. Single smooth scroll to the now-stable target position.
        const targetY = calcTargetScrollTop(container, targetEl);
        container.scrollTo({ top: targetY, behavior: "smooth" });

        // 6. After the smooth scroll settles, clear the flag and apply a
        //    tiny instant snap if there is residual drift. No second smooth
        //    scroll — the correction is invisible or skipped entirely.
        programmaticScrollTimerRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          const el = shell.querySelector(`#catering-menu-${id}`);
          if (el && container) {
            const finalY = calcTargetScrollTop(container, el);
            const drift = Math.abs(container.scrollTop - finalY);
            // Instant snap only for small residual drift. Large drift means a
            // subsequent user interaction occurred; scroll-spy handles it.
            if (drift > 2 && drift <= 40) {
              container.scrollTo({ top: finalY, behavior: "auto" });
            }
          }
          updateActiveCategoryRef.current?.();
        }, 700);
      },
      700,
    );
  };

  const toggleCategory = (id) => {
    setActiveCategory(id);
    setExpandedCategories((current) =>
      current.includes(id)
        ? current.filter((categoryId) => categoryId !== id)
        : [...current, id],
    );
  };

  return (
    <div
      ref={overlayRef}
      className="catering-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catering-menu-title"
    >
      <div className="catering-menu-overlay-shell" ref={shellRef}>
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

        <div
          className="catering-menu-photo-strip"
          role="img"
          aria-label="Catering menu example from RORUM catering gallery"
        />

        <main className="catering-menu-overlay-main">
          <section className="catering-menu-hero">
            <div className="catering-menu-hero-copy">
              <div className="catering-menu-hero-text">
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
              </div>
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
              {orderedMenuCategories.map((category) => {
                const Icon = category.icon;
                return (
                <a
                  key={category.id}
                  href={`#catering-menu-${category.id}`}
                  className={activeCategory === category.id ? "is-active" : ""}
                  onClick={(event) => scrollToCategory(event, category.id)}
                >
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <span>{category.navLabel}</span>
                </a>
              );
              })}
            </div>
          </nav>

          <div className="catering-menu-sections">
            {orderedMenuCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <section
                  className={`catering-menu-section ${isExpanded ? "is-expanded" : ""}`}
                  id={`catering-menu-${category.id}`}
                  key={category.id}
                >
                  <button
                    className="catering-menu-section-toggle"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`catering-menu-panel-${category.id}`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className="catering-menu-section-title">
                      <span className="catering-menu-section-kicker">
                        {category.navLabel}
                      </span>
                      <span className="heading">{category.title}</span>
                    </span>
                    <span className="catering-menu-plus" aria-hidden="true">
                      {isExpanded ? (
                        <Minus strokeWidth={1.6} />
                      ) : (
                        <Plus strokeWidth={1.6} />
                      )}
                    </span>
                  </button>

                  <div
                    className="catering-menu-section-panel"
                    id={`catering-menu-panel-${category.id}`}
                    aria-hidden={!isExpanded}
                  >
                    <div className="catering-menu-section-panel-inner">
                      <div className="catering-menu-section-head">
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
                    </div>
                  </div>
                </section>
              );
            })}
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
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={onClose}
              >
                Back to Catering
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
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
      const target = document.getElementById(requestTargetId);
      if (!target) return;
      const headerHeight =
        document.querySelector(".header")?.getBoundingClientRect().height ?? 0;
      const gap = 16;
      const targetY =
        window.scrollY +
        target.getBoundingClientRect().top -
        headerHeight -
        gap;
      window.scrollTo({ top: targetY, behavior: "smooth" });
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
