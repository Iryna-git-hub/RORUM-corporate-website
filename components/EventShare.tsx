"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/SocialIcon";
import type { ShareAction } from "@/lib/data";
import { buildEventShareLinks, buildNativeSharePayload, type EventShareLinks } from "@/lib/eventSharing";

const DEFAULT_LINK_COPIED_MESSAGE = "Link copied";
const DEFAULT_INSTAGRAM_COPY_MESSAGE =
  "Event link copied! You can now paste it into Instagram Stories, DMs, or your bio.";

// Brand-color custom property consumed by .event-share-brand-link in
// globals.css; React's CSSProperties doesn't know about arbitrary custom
// properties by default, so this narrow augmentation documents the one we use.
type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

const BRAND_COLORS: Record<"whatsapp" | "linkedin" | "facebook" | "instagram", string> = {
  whatsapp: "#25D366",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  instagram: "#E1306C",
};

// One button/link per configurable action type (Share, Copy link, WhatsApp,
// Email, LinkedIn, Facebook, Instagram) — the exact markup, CSS classes and
// click behavior each already had before this became Sanity-configurable,
// just keyed off `action.type` now instead of being unconditionally inlined
// (or, for "share", unconditionally rendered ahead of the list).
function ShareActionButton({
  action,
  links,
  onShare,
  onCopyLink,
  onShareInstagram,
}: {
  action: ShareAction;
  links: EventShareLinks;
  onShare: () => void;
  onCopyLink: () => void;
  onShareInstagram: () => void;
}) {
  switch (action.type) {
    case "share":
      return (
        <button className="event-share-utility-link" type="button" aria-label={action.label} onClick={onShare}>
          <Share2 aria-hidden="true" strokeWidth={1.8} />
        </button>
      );
    case "copyLink":
      return (
        <button className="event-share-utility-link" type="button" aria-label={action.label} onClick={onCopyLink}>
          <Link2 aria-hidden="true" strokeWidth={1.8} />
        </button>
      );
    case "whatsapp":
      return (
        <a
          className="event-share-brand-link"
          aria-label={action.label}
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": BRAND_COLORS.whatsapp } as BrandColorStyle}
        >
          <SocialIcon icon="whatsapp" />
        </a>
      );
    case "email":
      return (
        <a className="event-share-email-link" aria-label={action.label} href={links.email}>
          <Mail aria-hidden="true" strokeWidth={1.8} />
        </a>
      );
    case "linkedin":
      return (
        <a
          className="event-share-brand-link"
          aria-label={action.label}
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": BRAND_COLORS.linkedin } as BrandColorStyle}
        >
          <SocialIcon icon="linkedin" />
        </a>
      );
    case "facebook":
      return (
        <a
          className="event-share-brand-link"
          aria-label={action.label}
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--social-brand-color": BRAND_COLORS.facebook } as BrandColorStyle}
        >
          <SocialIcon icon="facebook" />
        </a>
      );
    case "instagram":
      return (
        <button
          className="event-share-brand-link"
          type="button"
          aria-label={action.label}
          onClick={onShareInstagram}
          style={{ "--social-brand-color": BRAND_COLORS.instagram } as BrandColorStyle}
        >
          <SocialIcon icon="instagram" />
        </button>
      );
    default:
      return null;
  }
}

export function EventShare({
  title,
  text,
  url,
  actions,
  heading,
  linkCopiedMessage = DEFAULT_LINK_COPIED_MESSAGE,
  instagramCopyMessage = DEFAULT_INSTAGRAM_COPY_MESSAGE,
}: {
  title: string;
  text?: string;
  url: string;
  /** Already resolved to the current locale, in the order configured in Sanity — this component renders only the `enabled` ones. */
  actions: ShareAction[];
  /** Localized "Share with Friends" heading — resolved by the caller (see lib/uiText.ts). */
  heading: string;
  linkCopiedMessage?: string;
  instagramCopyMessage?: string;
}) {
  const [feedback, setFeedback] = useState("");
  const shareText = text || "Join this event at RORUM";

  const links = useMemo(() => buildEventShareLinks({ title, text: shareText, url }), [shareText, title, url]);

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
      try {
        textarea.focus();
        textarea.select();
        return document.execCommand("copy");
      } finally {
        textarea.remove();
      }
    } catch {
      return false;
    }
  }

  async function copyLink() {
    const didCopy = await copyToClipboard(url).catch(() => false);
    if (didCopy) showFeedback(linkCopiedMessage);
  }

  async function shareEvent() {
    if (navigator.share) {
      try {
        await navigator.share(buildNativeSharePayload({ title, text: shareText, url }));
      } catch {
        return;
      }
      return;
    }

    await copyLink();
  }

  async function shareInstagram() {
    // Instagram exposes no reliable web endpoint for a prefilled post or
    // link card. Copy the canonical link and describe that result honestly.
    const didCopy = await copyToClipboard(url).catch(() => false);
    if (didCopy) showFeedback(instagramCopyMessage);
  }

  const enabledActions = actions.filter((action) => action.enabled);

  return (
    <div className="grid gap-2 w-fit max-w-full mt-1 pt-2 border-0 bg-transparent">
      <p className="m-0 text-dark-green text-xs font-extrabold tracking-[0.08em] leading-[1.2] uppercase">
        {heading}
      </p>
      {/*
        Kept as the legacy `.event-share-actions` class: globals.css scopes
        the button/link shape, per-platform backgrounds, hover/focus states,
        and the icon size (`.event-share-actions svg`, 17px) entirely through
        descendant selectors anchored on this class. Those rules are
        unlayered CSS, so they win over any Tailwind utility regardless of
        what we add here. Keeping this class (and the child classNames below)
        unchanged is the only way to preserve the original rendered result
        without touching those other files.
      */}
      <div className="event-share-actions">
        {enabledActions.map((action) => (
          <ShareActionButton
            key={action.type}
            action={action}
            links={links}
            onShare={shareEvent}
            onCopyLink={copyLink}
            onShareInstagram={shareInstagram}
          />
        ))}
      </div>
      <span
        className={`min-h-2 text-light-green text-xs font-extrabold transition-opacity duration-180 ease-[ease] ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {feedback || linkCopiedMessage}
      </span>
    </div>
  );
}
