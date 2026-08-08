import { defineQuery } from "next-sanity";

export const siteSettingsQuery = defineQuery(`*[_type == "siteSettings"][0]`);
export const contactInfoQuery = defineQuery(`*[_type == "contactInfo"][0]`);
export const socialLinksQuery = defineQuery(`*[_type == "socialLinks"][0]`);
export const navigationQuery = defineQuery(`*[_type == "navigation"][0]`);
export const footerQuery = defineQuery(`*[_type == "footer"][0]`);
export const formMessagesQuery = defineQuery(`*[_type == "formMessages"][0]`);
