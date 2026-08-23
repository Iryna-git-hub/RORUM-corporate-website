"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FAQInlinePrompt } from "@/components/FAQInlinePrompt";
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
  menuCategories as fallbackMenuCategories,
  type CateringMenuCategory,
  type CateringMenuItem,
} from "@/lib/cateringMenu";
import { useFormContent } from "@/components/FormContentProvider";
import { getIconCardIcon } from "@/lib/iconCardIcons";

type MenuCategoryWithIcon = Omit<CateringMenuCategory, "icon"> & { icon: LucideIcon };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ukrainian: Soup,
  danish: Sandwich,
  vegetarian: Leaf,
  "finger-food": HandPlatter,
  grill: Flame,
  desserts: Dessert,
};

// Categories arrive already in display order (Studio's own section drag
// order, or — when Sanity is unreachable — `fallbackMenuCategories`' own
// array order), so no per-id reordering is needed here. Icon resolution
// prefers the category's own Sanity-editable `icon` (a manager-picked
// Lucide name); when that's unset — every hardcoded fallback category, and
// any live category that hasn't had an icon chosen yet — falls back to the
// original fixed id-keyed map, then finally to a neutral default. This
// keeps every existing category's on-screen icon exactly what it already
// was the moment this field was introduced, while making it manager-
// editable going forward.
function withIcons(categories: CateringMenuCategory[]): MenuCategoryWithIcon[] {
  return categories.map((category) => ({
    ...category,
    icon: category.icon ? getIconCardIcon(category.icon) : (CATEGORY_ICONS[category.id] ?? Soup),
  }));
}

export interface CateringMenuOverlayText {
  title: string;
  intro: string[];
  requestCta: string;
  featuredDishesLabel: string;
  disclaimerNote: string;
  customMenuTitle: string;
  customMenuText: string;
  backToCateringCta: string;
  /**
   * Shown instead of the category nav + list when `categories` is
   * genuinely empty — i.e. the manager has intentionally removed every
   * category, as distinct from Sanity being unreachable (which uses the
   * hardcoded `fallbackMenuCategories` instead and never reaches this
   * branch at all). Manager-editable, not a hidden technical string — see
   * contentItem.ts's "Catering Menu Examples empty-state message" role.
   */
  emptyStateMessage: string;
}

const defaultOverlayText: CateringMenuOverlayText = {
  title: "Catering menu",
  intro: [
    "Traditional Ukrainian hospitality, Danish classics, and European-style service for hosted meetings, celebrations, and special gatherings.",
    "Each menu is created individually based on your event format, number of guests, season, and dietary preferences.",
  ],
  requestCta: "Request custom menu",
  featuredDishesLabel: "Featured Dishes",
  disclaimerNote:
    "The dishes shown are examples of what we can offer. We'll be happy to create a menu tailored to your event, preferences, and guests.",
  customMenuTitle: "Create your custom menu",
  customMenuText:
    "Tell us about your event, number of guests, preferred cuisine, and dietary needs. We will help create a menu that fits your occasion and makes your guests feel welcome.",
  backToCateringCta: "Back to Catering",
  emptyStateMessage:
    "No menu examples are available right now — please get in touch and we'll help create a menu for your event.",
};

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
    <article className="min-w-0 overflow-hidden rounded-none border border-[rgba(var(--rgb-brown),0.08)] bg-white shadow-[0_16px_30px_rgba(var(--rgb-brown),0.055)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-beige">
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="grid gap-[5px] p-[10px] max-sm:gap-1 max-sm:p-2">
        <h3 className="m-0 font-body text-[13px] font-extrabold leading-[1.25] text-text-primary max-sm:text-[12.5px] max-sm:leading-[1.2]">
          {item.name}
        </h3>
        <p className="m-0 text-[12px] leading-[1.38] text-text-primary max-sm:text-[11.5px] max-sm:leading-[1.32]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

const DEFAULT_BANNER_IMAGE_URL = "/images/catering/catering-gallery-added-16.png";
const DEFAULT_BANNER_IMAGE_ALT = "Catering menu example from RORUM catering gallery";

function CateringMenuOverlay({
  open,
  onClose,
  onRequestMenu,
  categories = fallbackMenuCategories,
  text = defaultOverlayText,
  bannerImageUrl = DEFAULT_BANNER_IMAGE_URL,
  bannerImageAlt = DEFAULT_BANNER_IMAGE_ALT,
}: {
  open: boolean;
  onClose: () => void;
  onRequestMenu: () => void;
  categories?: CateringMenuCategory[];
  text?: CateringMenuOverlayText;
  bannerImageUrl?: string;
  bannerImageAlt?: string;
}) {
  const { messages } = useFormContent();
  const orderedMenuCategories = withIcons(categories);
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
  const [activeCategory, setActiveCategory] = useState(orderedMenuCategories[0]?.id ?? "");

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
      className="fixed inset-0 z-120 flex items-center justify-center overflow-hidden overscroll-contain p-2.5 bg-[rgba(var(--rgb-dark-brown),0.46)] text-text-primary backdrop-blur-[10px] [-webkit-overflow-scrolling:touch] max-lg:block max-lg:overflow-y-auto max-lg:bg-white max-lg:backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catering-menu-title"
    >
      <div
        className="relative w-[min(1240px,100%)] max-h-[calc(100dvh-20px)] overflow-y-auto bg-white shadow-[0_28px_80px_rgba(var(--rgb-dark-brown),0.28)] [-webkit-overflow-scrolling:touch] max-lg:w-full max-lg:min-h-[calc(100dvh-20px)] max-lg:max-h-none max-lg:overflow-visible max-lg:shadow-none"
        ref={shellRef}
      >
        <header className="sticky top-7 z-6 h-0 min-h-0 flex items-center justify-end gap-0 mb-0 pr-4.5 bg-transparent border-0 pointer-events-none max-sm:top-6 max-sm:pr-3.5">
          <p className="hidden">RORUM / Catering Menu</p>
          <button
            ref={closeButtonRef}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(var(--rgb-brown),0.16)] bg-white text-dark-brown shadow-[0_10px_22px_rgba(var(--rgb-brown),0.08)] transition-[transform,border-color,color] duration-180 ease-out hover:-translate-y-px hover:border-red hover:text-red hover:outline-none focus-visible:-translate-y-px focus-visible:border-red focus-visible:text-red focus-visible:outline-none max-sm:h-10 max-sm:w-10"
            type="button"
            aria-label={`${messages.closeLabel} ${text.title}`}
            onClick={onClose}
          >
            <X aria-hidden="true" strokeWidth={1.8} className="h-5 w-5" />
            <span aria-hidden="true" className="absolute h-px w-px overflow-hidden">
              ×
            </span>
          </button>
        </header>

        <div
          className="h-42.5 bg-position-[center_54%] bg-cover bg-no-repeat max-sm:h-[clamp(112px,30vw,150px)] max-sm:bg-position-[center_52%]"
          style={{ backgroundImage: `linear-gradient(90deg,rgba(var(--rgb-white),0.14),rgba(var(--rgb-white),0)), url('${bannerImageUrl}')` }}
          role="img"
          aria-label={bannerImageAlt}
        />

        <main className="mx-auto w-full pt-10 px-[clamp(24px,4.5vw,60px)] max-lg:w-[min(calc(100%-32px),820px)] max-lg:pt-7 max-sm:w-[min(calc(100%-24px),100%)] max-sm:pt-4.5 max-sm:px-0">
          <section className="min-h-auto grid items-center pt-[clamp(12px,1.8vw,22px)] pb-[clamp(20px,3vw,34px)] max-lg:pt-6 max-lg:pb-8.5 max-sm:pt-3.5 max-sm:pb-6">
            <div className="grid grid-cols-1 items-start gap-[clamp(18px,3vw,40px)] max-lg:gap-4 max-sm:gap-3.5 lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)]">
              {/* `!important` on leading/tracking: `heading` is still-
                  deferred unlayered CSS whose own line-height/letter-
                  spacing would otherwise beat these overrides. */}
              <h2
                id="catering-menu-title"
                className="heading m-0 max-w-[12ch] text-[clamp(2.2rem,4vw,3rem)] leading-[0.98]! font-medium tracking-normal! max-sm:max-w-[10ch] max-sm:text-[clamp(2.6rem,14vw,4rem)] lg:col-start-1 lg:row-start-1"
              >
                {text.title}
              </h2>
              <div className="grid gap-2.5 min-w-0 max-w-[680px] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-end">
                {text.intro.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="m-0 max-w-[640px] text-text-primary text-[clamp(14px,1vw,16px)] leading-[1.55] max-sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <button
                className="btn group justify-self-end mt-0 gap-2 whitespace-nowrap lg:col-start-1 lg:row-start-2 lg:justify-self-start lg:justify-start lg:mt-[clamp(6px,1vw,12px)] max-sm:w-full"
                type="button"
                onClick={handleRequestMenu}
              >
                {text.requestCta}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
            </div>
          </section>

          {orderedMenuCategories.length === 0 ? (
            // The manager has intentionally left every category empty
            // (distinct from Sanity being unreachable, which never reaches
            // this component with an empty list at all — see
            // app/[locale]/(site)/catering/page.tsx's getData()). No old
            // hardcoded categories are ever substituted here.
            <div
              className="grid justify-items-center gap-3 py-[clamp(40px,7vw,72px)] px-4 text-center"
              data-testid="catering-menu-empty-state"
            >
              <p className="m-0 max-w-140 text-text-primary text-[15px] leading-[1.6]">{text.emptyStateMessage}</p>
            </div>
          ) : (
            <>
              <nav
                className="sticky top-0 z-4 w-full ml-0 p-0 bg-[rgba(var(--rgb-white),0.96)] border-y-0 backdrop-blur-[18px] overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:px-3 catering-menu-nav"
                aria-label="Catering categories"
              >
                <div className="flex flex-nowrap gap-[clamp(16px,2.4vw,30px)] min-w-0 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:gap-4.5 max-sm:py-2.5">
                  {orderedMenuCategories.map((category) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.id;
                    return (
                      <a
                        key={category.id}
                        href={`#catering-menu-${category.id}`}
                        className={`inline-flex items-center justify-center gap-1.75 min-h-9 p-0 border-0 border-b-2 rounded-none bg-transparent text-[15px] font-[850] tracking-normal normal-case text-center whitespace-nowrap leading-[1.2] transition-[border-color,color] duration-180 ease-[ease] hover:text-[rgba(var(--rgb-red),0.72)] focus-visible:text-[rgba(var(--rgb-red),0.72)] focus-visible:outline-none max-sm:min-h-8.5 max-sm:px-0 ${
                          isActive
                            ? "border-b-red text-red hover:border-b-[rgba(var(--rgb-red),0.72)] focus-visible:border-b-[rgba(var(--rgb-red),0.72)]"
                            : "border-b-transparent text-text-primary"
                        }`}
                        onClick={(event) => scrollToCategory(event, category.id)}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="w-4.25 h-4.25 flex-none text-red"
                        />
                        <span>{category.navLabel}</span>
                      </a>
                    );
                  })}
                </div>
              </nav>

              <div className="grid gap-0 pt-[clamp(22px,3vw,34px)] px-0 pb-0 max-sm:pt-[22px] max-sm:pb-[42px]">
                {orderedMenuCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <section
                  className={`catering-menu-section grid scroll-mt-15 border-t border-t-[rgba(var(--rgb-brown),0.12)] bg-[rgba(var(--rgb-white),0.96)] last:border-b last:border-b-[rgba(var(--rgb-brown),0.12)] max-sm:scroll-mt-13.5 ${isExpanded ? "is-expanded" : ""}`.trim()}
                  id={`catering-menu-${category.id}`}
                  key={category.id}
                >
                  <button
                    className="grid w-full min-h-[clamp(84px,8vw,112px)] grid-cols-[minmax(0,1fr)_42px] items-center gap-5 py-[clamp(18px,2.6vw,30px)] border-0 bg-transparent text-left text-text-primary cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[rgba(var(--rgb-red),0.45)] max-sm:min-h-[78px] max-sm:grid-cols-[minmax(0,1fr)_38px] max-sm:py-[18px]"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`catering-menu-panel-${category.id}`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className="grid gap-2 min-w-0">
                      <span className="text-[12px] font-[850] uppercase tracking-[0.08em] text-red">
                        {category.navLabel}
                      </span>
                      <span className="heading text-[2.5rem] max-sm:text-[clamp(1.55rem,7vw,2.2rem)]">
                        {category.title}
                      </span>
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
                    <div className="grid gap-[clamp(18px,2.4vw,28px)] pb-[clamp(26px,4vw,44px)]">
                      <div className="grid gap-0 max-w-180">
                        <p className="z-10 m-0 text-[clamp(14px,1vw,16px)] leading-[1.55] text-text-primary max-sm:text-base">
                          {category.description}
                        </p>
                      </div>

                      {category.featuredItems?.length ? (
                        <div className="grid gap-4">
                          <h3 className="m-0 font-body text-[13px] font-black leading-[1.2] tracking-widest uppercase text-red">
                            {text.featuredDishesLabel}
                          </h3>
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(156px,210px))] justify-start gap-3.5 max-lg:grid-cols-[repeat(auto-fit,minmax(126px,168px))] max-sm:grid-cols-2 max-sm:gap-2">
                            {category.featuredItems.map((item) => (
                              <FeaturedCard item={item} key={item.name} />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <p className="m-0 text-red text-[0.9rem] leading-[1.55] z-10 max-w-180 py-3.5 px-4 border-l-[3px] border-l-red italic">
                        {text.disclaimerNote}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
              </div>
            </>
          )}

          {/* `catering-menu-final` is kept: its `::before` renders a
              positioned watermark-logo background layer, a decorative
              pseudo-element left as hand-authored CSS per this project's
              policy for such constructs. Everything else here is Tailwind. */}
          <section className="catering-menu-final relative overflow-hidden grid grid-cols-1 gap-4 items-start w-[calc(100%+clamp(48px,9vw,120px))] mt-[clamp(44px,6vw,72px)] mx-[calc(clamp(24px,4.5vw,60px)*-1)] mb-0 py-[clamp(34px,5vw,58px)] px-[clamp(24px,4.5vw,60px)] rounded-none bg-cream shadow-none max-sm:w-[calc(100%+24px)] max-sm:mt-8.5 max-sm:mx-[-12px] max-sm:mb-0 max-sm:py-7 max-sm:px-4.5 lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)]">
            {/* `!important` on leading/tracking: see the catering-menu-hero
                h2 above - same still-deferred `heading` conflict. */}
            <h2 className="heading relative z-1 max-w-[760px] m-0 pb-0 text-[clamp(1.65rem,3vw,2.45rem)] leading-[1.02]! font-medium tracking-normal! max-sm:pb-3.5 max-sm:text-[clamp(1.8rem,9vw,2.6rem)] lg:col-start-1 lg:row-start-1">
              {text.customMenuTitle}
            </h2>
            <p className="relative z-10 max-w-[760px] m-0 text-text-primary text-[clamp(14px,1vw,16px)] leading-[1.55] max-sm:text-base lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-end">
              {text.customMenuText}
            </p>
            <div className="relative z-1 flex flex-wrap justify-end gap-3 max-lg:justify-start max-sm:grid max-sm:w-full lg:col-start-1 lg:row-start-2 lg:justify-self-start lg:justify-start lg:mt-[clamp(6px,1vw,12px)]">
              <button
                className="btn gap-2 max-sm:w-full"
                type="button"
                onClick={handleRequestMenu}
              >
                {text.requestCta}
              </button>
              <button
                className="btn secondary group gap-2 max-sm:w-full"
                type="button"
                onClick={onClose}
              >
                {text.backToCateringCta}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </button>
            </div>
            <FAQInlinePrompt
              className="relative z-1 mt-2.5 text-[rgba(var(--rgb-dark-brown),0.62)]! lg:col-span-2 lg:row-start-3"
            />
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
  className: extraClassName = "",
  categories,
  overlayText,
  bannerImageUrl,
  bannerImageAlt,
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary";
  requestTargetId?: string;
  className?: string;
  categories?: CateringMenuCategory[];
  overlayText?: CateringMenuOverlayText;
  bannerImageUrl?: string;
  bannerImageAlt?: string;
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
        className={`btn group ${variant === "primary" ? "" : variant} gap-2 ${extraClassName}`.trim()}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {children}
        <ArrowRight
          className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
          aria-hidden="true"
          strokeWidth={1.9}
        />
      </button>
      <CateringMenuOverlay
        open={open}
        onClose={closeOverlay}
        onRequestMenu={requestMenu}
        categories={categories}
        text={overlayText}
        bannerImageUrl={bannerImageUrl}
        bannerImageAlt={bannerImageAlt}
      />
    </>
  );
}
