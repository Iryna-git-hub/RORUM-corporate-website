"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Dessert,
  Flame,
  HandPlatter,
  Leaf,
  type LucideIcon,
  Minus,
  Plus,
  Sandwich,
  Soup,
  X,
} from "lucide-react";
import {
  menuCategories,
  type CateringMenuCategory,
  type CateringMenuItem,
} from "@/lib/cateringMenu";

type MenuCategoryWithIcon = CateringMenuCategory & { icon: LucideIcon };

function getCategory(id: string): CateringMenuCategory | undefined {
  return menuCategories.find((category) => category.id === id);
}

const orderedMenuCategories: MenuCategoryWithIcon[] = [
  { ...getCategory("ukrainian"), icon: Soup },
  { ...getCategory("danish"), icon: Sandwich },
  { ...getCategory("vegetarian"), navLabel: "Vegetarian", icon: Leaf },
  { ...getCategory("finger-food"), icon: HandPlatter },
  { ...getCategory("grill"), icon: Flame },
  { ...getCategory("desserts"), navLabel: "Desserts", icon: Dessert },
].filter((category): category is MenuCategoryWithIcon => Boolean(category.id));

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
function waitForStableLayout(
  getMeasurement: () => number | null,
  onStable: () => void,
  maxWaitMs: number,
): () => void {
  let cancelled = false;
  const start = performance.now();
  let lastRounded: number | null = null;
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
  return () => {
    cancelled = true;
  };
}

function FeaturedCard({ item }: { item: CateringMenuItem }) {
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

function CateringMenuOverlay({
  open,
  onClose,
  onRequestMenu,
}: {
  open: boolean;
  onClose: () => void;
  onRequestMenu: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pageScrollRef = useRef(0);
  const restorePageScrollRef = useRef(true);
  // Ref used to suppress scroll-spy while a programmatic tab scroll is running.
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cancels any in-flight waitForStableLayout poll when a new tab click arrives
  // or the overlay closes.
  const cancelStableLayoutRef = useRef<(() => void) | null>(null);
  // Stable ref so the scroll-spy handler stays registered for the full overlay
  // lifetime without being torn down every time activeCategory changes.
  const updateActiveCategoryRef = useRef<(() => void) | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("ukrainian");

  // ---------------------------------------------------------------------------
  // Helper: return the actual scroll container for the overlay.
  // On desktop the shell element is overflow-y: auto (it scrolls).
  // On small screens CSS sets the shell to overflow: visible and the overlay
  // itself becomes the scroll container. We detect this at runtime.
  // ---------------------------------------------------------------------------
  const getScrollContainer = (): HTMLElement | null => {
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
  const calcTargetScrollTop = (container: HTMLElement, target: HTMLElement): number => {
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

  // ---------------------------------------------------------------------------
  // updateActiveCategory — defined here (before any early return) so the
  // ref-sync effect below can be registered unconditionally, satisfying the
  // Rules of Hooks. It closes over current state (activeCategory) so a fresh
  // version is created every render.
  // ---------------------------------------------------------------------------
  const updateActiveCategory = () => {
    const container = getScrollContainer();
    if (!container) return;
    const shell = shellRef.current ?? container;
    const nav = shell.querySelector(".catering-menu-nav");
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const containerRect = container.getBoundingClientRect();
    const activationLine =
      containerRect.top + navHeight + OVERLAY_ACTIVE_THRESHOLD;
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

    setActiveCategory((current) =>
      current === currentId ? current : currentId,
    );
  };

  // Sync the ref after every render (not during it — see the ref-during-render
  // note this replaced) so the stable scroll listener always calls the
  // freshest closure (with current expandedCategories, etc.).
  useEffect(() => {
    updateActiveCategoryRef.current = updateActiveCategory;
  });

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
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
    if (!open) return undefined;

    // Clear any in-flight programmatic scroll or layout poll from a previous
    // overlay session.
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
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
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
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
  }, [open]);

  if (!open) return null;

  const handleRequestMenu = () => {
    restorePageScrollRef.current = false;
    onRequestMenu();
  };

  const scrollToCategory = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();

    // 1. Immediate visual feedback — active tab updates at click time.
    setActiveCategory(id);

    // 2. Expand the target category if needed.
    //    This does not change the target section's own top position.
    setExpandedCategories((current) =>
      current.includes(id) ? current : [...current, id],
    );

    // 3. Suppress scroll-spy and cancel any previous in-flight layout poll.
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
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
        const targetY = calcTargetScrollTop(container, targetEl as HTMLElement);
        container.scrollTo({ top: targetY, behavior: "smooth" });

        // 6. After the smooth scroll settles, clear the flag and apply a
        //    tiny instant snap if there is residual drift. No second smooth
        //    scroll — the correction is invisible or skipped entirely.
        programmaticScrollTimerRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          const el = shell.querySelector(`#catering-menu-${id}`);
          if (el && container) {
            const finalY = calcTargetScrollTop(container, el as HTMLElement);
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

  const toggleCategory = (id: string) => {
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
          <p>RORUM / Catering Menu</p>
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
              <h2 id="catering-menu-title" className="heading">
                Catering menu
              </h2>
              <div className="catering-menu-hero-text">
                <p>
                  Traditional Ukrainian hospitality, Danish classics, and
                  European-style service for hosted meetings, celebrations, and
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
                    className={
                      activeCategory === category.id ? "is-active" : ""
                    }
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
                          <h3>Featured Dishes</h3>
                          <div className="catering-menu-card-grid">
                            {category.featuredItems.map((item) => (
                              <FeaturedCard item={item} key={item.name} />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <p className="catering-menu-additional">
                        The dishes shown are <strong>examples</strong> of what we
                        can offer. We’ll be happy to create a menu tailored to
                        your event, preferences, and guests.
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <section className="catering-menu-final">
            <h2 className="heading">Create your custom menu</h2>
            <p className="catering-menu-final-text">
              Tell us about your event, number of guests, preferred cuisine,
              and dietary needs. We will help create a menu that fits your
              occasion and makes your guests feel welcome.
            </p>
            <div className="catering-menu-final-actions">
              <button className="btn" type="button" onClick={handleRequestMenu}>
                Request custom menu
              </button>
              <button className="btn secondary" type="button" onClick={onClose}>
                Back to Catering
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
            </div>
            <p className="catering-menu-faq-prompt">
              <span>Questions?</span>
              <a href="/faq" className="catering-menu-faq-link">
                <span>Read our FAQs</span>
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </a>
            </p>
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
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary";
  requestTargetId?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
