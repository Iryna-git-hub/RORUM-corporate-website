"use client";

import { useMemo, useState } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/SocialIcon";

const INSTAGRAM_COPY_MESSAGE = "Event link copied! You can now paste it into Instagram Stories, DMs, or your bio.";

export function EventShare({ title, text, url }) {
    const [feedback, setFeedback] = useState("");
    const shareText = text || "Join this event at RORUM";

    function getShareUrl() {
        return typeof window === "undefined" ? url : window.location.href;
    }

    const links = useMemo(() => {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        return {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`I thought you might like this event at RORUM: ${url}`)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        };
    }, [title, url]);

    function showFeedback(message) {
        setFeedback(message);
        window.setTimeout(() => setFeedback(""), 2600);
    }

    async function copyToClipboard(currentUrl) {
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

    function isMobileDevice() {
        return typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
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
      <div className="event-share">
        <p className="event-share-title">Share with friends</p>
        <div className="event-share-actions">
          <button className="event-share-utility-link" type="button" aria-label="Share this event" onClick={shareEvent}>
            <Share2 aria-hidden="true" strokeWidth={1.8}/>
          </button>
          <button className="event-share-utility-link" type="button" aria-label="Copy event link" onClick={copyLink}>
            <Link2 aria-hidden="true" strokeWidth={1.8}/>
          </button>
          <a className="event-share-brand-link" aria-label="Share on WhatsApp" href={links.whatsapp} target="_blank" rel="noopener noreferrer" style={{ "--social-brand-color": "#25D366" }}>
            <SocialIcon icon="whatsapp" />
          </a>
          <a className="event-share-email-link" aria-label="Share by email" href={links.email}>
            <Mail aria-hidden="true" strokeWidth={1.8}/>
          </a>
          <a className="event-share-brand-link" aria-label="Share on LinkedIn" href={links.linkedin} target="_blank" rel="noopener noreferrer" style={{ "--social-brand-color": "#0A66C2" }}>
            <SocialIcon icon="linkedin" />
          </a>
          <a className="event-share-brand-link" aria-label="Share on Facebook" href={links.facebook} target="_blank" rel="noopener noreferrer" style={{ "--social-brand-color": "#1877F2" }}>
            <SocialIcon icon="facebook" />
          </a>
          <button className="event-share-brand-link" type="button" aria-label="Share on Instagram" onClick={shareInstagram} style={{ "--social-brand-color": "#E1306C" }}>
            <SocialIcon icon="instagram" />
          </button>
        </div>
        <span className={feedback ? "event-share-feedback is-visible" : "event-share-feedback"} aria-live="polite">
          {feedback || "Link copied"}
        </span>
      </div>
    );
}
