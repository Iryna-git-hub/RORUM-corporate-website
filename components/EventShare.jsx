"use client";

import { useMemo, useState } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/SocialIcon";

export function EventShare({ title, text, url }) {
    const [copied, setCopied] = useState(false);
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

    async function copyLink() {
        const currentUrl = getShareUrl();
        if (!currentUrl) return;
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
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
        </div>
        <span className={copied ? "event-share-feedback is-visible" : "event-share-feedback"} aria-live="polite">
          Link copied
        </span>
      </div>
    );
}
