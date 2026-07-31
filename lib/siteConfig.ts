export interface CompanyDetails {
  name: string;
  cvr: string;
  website: string;
  siteUrl: string;
}

export const companyDetails: CompanyDetails = {
  name: "RORUM",
  cvr: "46033213",
  website: "ro-rum.dk",
  siteUrl: "https://rorum.dk",
};

export interface ContactDetails {
  email: string;
  phone: string;
  phoneHref: string;
  address: string;
  shortAddress: string;
  mapHref: string;
  mapQueryAddress: string;
}

export const contactDetails: ContactDetails = {
  email: "rorum2025@gmail.com",
  phone: "+45 91 87 71 52",
  phoneHref: "tel:+4591877152",
  address: "Buermistersgade 26, 1 th, 1429 Copenhagen, Denmark",
  shortAddress: "Buermistersgade 26, 1 th, Copenhagen",
  mapHref: "/contact#contact-map",
  mapQueryAddress: "Buermistersgade 26, 1 th, 1429 Copenhagen, Denmark",
};

// Matches every icon key SocialIcon.jsx knows how to render, not just the
// two currently listed below.
export type SocialIconName = "instagram" | "facebook" | "linkedin" | "whatsapp";

export interface SocialLink {
  href: string;
  label: string;
  icon: SocialIconName;
  brandColor: string;
}

export const socialLinks: SocialLink[] = [
  {
    href: "https://www.instagram.com/rorum_dk",
    label: "Instagram",
    icon: "instagram",
    brandColor: "#E4405F",
  },
  {
    href: "https://www.facebook.com/rorum2025",
    label: "Facebook",
    icon: "facebook",
    brandColor: "#1877F2",
  },
];
