import { Link2, Mail, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/SocialIcon";

// Centralized icon-per-action-type lookup for Sanity Studio document
// previews (event.ts's `shareSettings`/`shareAction` and socialLink.ts) —
// reuses the exact same icon components the public site renders
// (components/SocialIcon.tsx for brand icons, the same lucide-react icons
// components/EventShare.tsx uses for Share/Copy link/Email) instead of
// duplicating SVG markup here. Each value is a small zero-prop component so
// it can be passed directly as a schema `preview.media`.
export const ACTION_ICONS: Record<string, () => React.ReactElement> = {
  share: () => <Share2 size={20} strokeWidth={1.8} />,
  copyLink: () => <Link2 size={20} strokeWidth={1.8} />,
  email: () => <Mail size={20} strokeWidth={1.8} />,
  whatsapp: () => <SocialIcon icon="whatsapp" className="w-5 h-5" />,
  linkedin: () => <SocialIcon icon="linkedin" className="w-5 h-5" />,
  facebook: () => <SocialIcon icon="facebook" className="w-5 h-5" />,
  instagram: () => <SocialIcon icon="instagram" className="w-5 h-5" />,
};

/** Same icons, reused by socialLink.ts (Instagram/Facebook/LinkedIn/WhatsApp only). */
export const SOCIAL_LINK_ICONS = ACTION_ICONS;
