"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/SocialIcon";

const INSTAGRAM_COPY_MESSAGE =
  "Event link copied! You can now paste it into Instagram Stories, DMs, or your bio.";

// Brand-color custom property consumed by .event-share-brand-link in
// globals.css; React's CSSProperties doesn't know about arbitrary custom
// properties by default, so this narrow augmentation documents the one we use.
type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

export function EventShare({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url: string;
}) {
  const [feedback, setFeedback] = useState("");
  const shareText = text || "Join this event at RORUM";

  function getShareUrl(): string {
    return typeof window === "undefined" ? url : window.location.href;
  }

  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`I thought you might like this event at RORUM: ${url}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };
  }, [title, url]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2600);
  }

  async function copyToClipboard(currentUrl: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(currentUrl);
      return true;
    }
    // Older browsers (and some in-app webviews) lack the Clipboard API
    try {
      const textarea = document.createElement("textarea");
      textarea.value = currentUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }

  async function copyLink() {
    const currentUrl = getShareUrl();
    if (!currentUrl) return;
    const didCopy = await copyToClipboard(currentUrl).catch(() => false);
    if (didCopy) showFeedback("Link copied");
  }

  async function shareEvent() {
    const currentUrl = getShareUrl();
    if (!currentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: currentUrl });
      } catch {
        return;
      }
      return;
    }

    await copyLink();
  }

  function isMobileDevice(): boolean {
    return (
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent)
    );
  }

  async function shareInstagram() {
    const currentUrl = getShareUrl();
    if (!currentUrl) return;

    async function copyForInstagram() {
      const didCopy = await copyToClipboard(currentUrl).catch(() => false);
      if (didCopy) showFeedback(INSTAGRAM_COPY_MESSAGE);
    }

    if (!isMobileDevice()) {
      await copyForInstagram();
      return;
    }

    // Instagram has no web share URL, so try handing off to the app first
    // and fall back to copying the link if the app never takes focus.
    let appOpened = false;
    const onVisibilityChange = () => {
      if (document.hidden) appOpened = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.setTimeout(async () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!appOpened) await copyForInstagram();
    }, 1200);
    window.location.href = "instagram://app";
  }

  return (
    <div className="grid gap-2 w-fit max-w-full mt-1 pt-2 border-0 bg-transparent">
      <p className="m-0 text-dark-green text-xs font-[850] tracking-[0.08em] leading-[1.2] uppercase">
        Share with friends
      </p>
      {/*
        Kept as the legacy `.event-share-actions` class: globals.css scopes the
        button/link shape, per-platform backgrounds, hover/focus states, and
        (crucially) a `.event-share-actions .social-icon` 18px size override
        entirely through descendant selectors anchored on this class. Those
        rules are unlayered CSS, so they win over any Tailwind utility
        regardless of what we add here — and SocialIcon.tsx (out of scope)
        always renders its own hardcoded `.social-icon` class, which falls
        back to a 20px base size if this ancestor class is removed. Keeping
        this class (and the child classNames below) unchanged is the only way
        to preserve the original rendered result without touching those other
        files.
      */}
      <div className="event-share-actions">
        <button
          className="event-share-utility-link"
          type="button"
          aria-label="Share this event"
          onClick={shareEvent}
        >
          <Share2 aria-hidden="true" strokeWidth={1.8} />
        </button>
        <button
          className="event-share-utility-link"
          type="button"
          aria-label="Copy event link"
          onClick={copyLink}
        >
          <Link2 aria-hidden="true" strokeWidth={1.8} />
        </button>
        <a
          className="event-share-brand-link"
          aria-label="Share on WhatsApp"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": "#25D366" } as BrandColorStyle}
        >
          <SocialIcon icon="whatsapp" />
        </a>
        <a
          className="event-share-email-link"
          aria-label="Share by email"
          href={links.email}
        >
          <Mail aria-hidden="true" strokeWidth={1.8} />
        </a>
        <a
          className="event-share-brand-link"
          aria-label="Share on LinkedIn"
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": "#0A66C2" } as BrandColorStyle}
        >
          <SocialIcon icon="linkedin" />
        </a>
        <a
          className="event-share-brand-link"
          aria-label="Share on Facebook"
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": "#1877F2" } as BrandColorStyle}
        >
          <SocialIcon icon="facebook" />
        </a>
        <button
          className="event-share-brand-link"
          type="button"
          aria-label="Share on Instagram"
          onClick={shareInstagram}
          style={{ "--social-brand-color": "#E1306C" } as BrandColorStyle}
        >
          <SocialIcon icon="instagram" />
        </button>
      </div>
      <span
        className={`min-h-2 text-light-green text-xs font-extrabold transition-opacity duration-180 ease-[ease] ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {feedback || "Link copied"}
      </span>
    </div>
  );
}
