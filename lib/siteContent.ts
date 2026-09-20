import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { contactInfoQuery, siteSettingsQuery } from "@/sanity/queries/globals";
import { companyDetails, contactDetails } from "@/lib/siteConfig";

export interface CompanyContactFacts {
  companyName: string;
  cvr: string;
  website: string;
  email: string;
  shortAddress: string;
}

/**
 * Company/contact facts shown on legal pages (company details block) —
 * deliberately NOT localized (same regardless of language), so this reads
 * straight from Sanity's `siteSettings`/`contactInfo` singletons with no
 * `pickLocalized` involved, falling back to the static `lib/siteConfig.ts`
 * values only if Sanity isn't configured or the fields aren't set yet.
 */
export async function getCompanyContactFacts(): Promise<CompanyContactFacts> {
  if (!isSanityConfigured) {
    return {
      companyName: companyDetails.name,
      cvr: companyDetails.cvr,
      website: companyDetails.website,
      email: contactDetails.email,
      shortAddress: contactDetails.shortAddress,
    };
  }

  const [{ data: siteSettings }, { data: contactInfo }] = await Promise.all([
    sanityFetch({ query: siteSettingsQuery }),
    sanityFetch({ query: contactInfoQuery }),
  ]);

  return {
    companyName: siteSettings?.companyName ?? companyDetails.name,
    cvr: siteSettings?.cvr ?? companyDetails.cvr,
    website: siteSettings?.website ?? companyDetails.website,
    email: contactInfo?.email ?? contactDetails.email,
    shortAddress: contactInfo?.shortAddress ?? contactDetails.shortAddress,
  };
}
