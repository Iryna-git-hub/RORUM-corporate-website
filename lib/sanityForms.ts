import { pickLabel, pickLocalized, pickLocalizedOr, type I18nEntry } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import type { FormMessages } from "@/sanity.types";

export interface ResolvedFormMessages {
  requiredFieldTemplate: string;
  invalidEmailMessage: string;
  privacyConsentRequiredMessage: string;
  privacyConsentPrefixText: string;
  faqQuestion: string;
  faqLabel: string;
  fullNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  messageLabel: string;
  eventDateLabel: string;
  agreeButtonLabel: string;
  closeLabel: string;
  copyLabel: string;
  copiedLabel: string;
  packageLabel: string;
  selectPackagePlaceholder: string;
  eventTimeLabel: string;
  numberOfPeopleLabel: string;
  guestsPlaceholder: string;
  additionalServicesLabel: string;
  commentLabel: string;
  guestsRangeMessage: string;
  invalidPhoneMessage: string;
  fileRequiredMessage: string;
  fileTypeMessage: string;
  fileSizeMessage: string;
  uploadCvLabel: string;
  removeFileLabel: string;
  shortMessageLabel: string;
  sendingLabel: string;
  applicationSentLabel: string;
  sendApplicationLabel: string;
  submitCvLabel: string;
  formNotConfiguredMessage: string;
  contactFormMessagePlaceholder: string;
  contactFallbackNote: string;
}

// English literals matching the site's original hardcoded copy. Used as the
// context default (no SiteLayout provider, e.g. isolated component tests)
// and as the per-field fallback whenever a string hasn't been imported/
// translated into Sanity yet.
export const defaultFormMessages: ResolvedFormMessages = {
  requiredFieldTemplate: "{field} is required.",
  invalidEmailMessage: "Please enter a valid email address.",
  privacyConsentRequiredMessage: "Please agree to the Privacy policy before submitting.",
  privacyConsentPrefixText: "I have read and agree to the",
  faqQuestion: "Questions?",
  faqLabel: "Read our FAQs",
  fullNameLabel: "Full Name",
  phoneLabel: "Phone number",
  emailLabel: "Email",
  messageLabel: "Message",
  eventDateLabel: "Event date",
  agreeButtonLabel: "I Have Read and Agree",
  closeLabel: "Close",
  copyLabel: "Copy",
  copiedLabel: "Copied",
  packageLabel: "Package",
  selectPackagePlaceholder: "Select package",
  eventTimeLabel: "Event time",
  numberOfPeopleLabel: "Number of people",
  guestsPlaceholder: "Approx. number",
  additionalServicesLabel: "Additional services",
  commentLabel: "Comment",
  guestsRangeMessage: "Please enter a whole number between 1 and 30.",
  invalidPhoneMessage: "Please enter a valid phone number.",
  fileRequiredMessage: "Please upload your CV.",
  fileTypeMessage: "Please upload a PDF, DOC, or DOCX file.",
  fileSizeMessage: "Please keep your file under 10 MB.",
  uploadCvLabel: "Upload your CV",
  removeFileLabel: "Remove file",
  shortMessageLabel: "Short message",
  sendingLabel: "Sending...",
  applicationSentLabel: "Application Sent",
  sendApplicationLabel: "Send Application",
  submitCvLabel: "Submit CV",
  formNotConfiguredMessage: "This form isn't fully set up yet — please contact us directly.",
  contactFormMessagePlaceholder: "Tell us a little about your request, timing and preferences.",
  contactFallbackNote: "Contact us directly at",
};

export function resolveFormMessages(doc: FormMessages | null | undefined, locale: Locale): ResolvedFormMessages {
  return {
    requiredFieldTemplate: pickLocalizedOr(doc?.requiredFieldTemplate, locale, defaultFormMessages.requiredFieldTemplate),
    invalidEmailMessage: pickLocalizedOr(doc?.invalidEmailMessage, locale, defaultFormMessages.invalidEmailMessage),
    privacyConsentRequiredMessage: pickLocalizedOr(
      doc?.privacyConsentRequiredMessage,
      locale,
      defaultFormMessages.privacyConsentRequiredMessage,
    ),
    privacyConsentPrefixText: pickLocalizedOr(
      doc?.privacyConsentPrefixText,
      locale,
      defaultFormMessages.privacyConsentPrefixText,
    ),
    faqQuestion: pickLocalizedOr(doc?.faqQuestion, locale, defaultFormMessages.faqQuestion),
    faqLabel: pickLocalizedOr(doc?.faqLabel, locale, defaultFormMessages.faqLabel),
    fullNameLabel: pickLocalizedOr(doc?.fullNameLabel, locale, defaultFormMessages.fullNameLabel),
    phoneLabel: pickLocalizedOr(doc?.phoneLabel, locale, defaultFormMessages.phoneLabel),
    emailLabel: pickLocalizedOr(doc?.emailLabel, locale, defaultFormMessages.emailLabel),
    messageLabel: pickLocalizedOr(doc?.messageLabel, locale, defaultFormMessages.messageLabel),
    eventDateLabel: pickLocalizedOr(doc?.eventDateLabel, locale, defaultFormMessages.eventDateLabel),
    agreeButtonLabel: pickLocalizedOr(doc?.agreeButtonLabel, locale, defaultFormMessages.agreeButtonLabel),
    closeLabel: pickLocalizedOr(doc?.closeLabel, locale, defaultFormMessages.closeLabel),
    copyLabel: pickLocalizedOr(doc?.copyLabel, locale, defaultFormMessages.copyLabel),
    copiedLabel: pickLocalizedOr(doc?.copiedLabel, locale, defaultFormMessages.copiedLabel),
    packageLabel: pickLocalizedOr(doc?.packageLabel, locale, defaultFormMessages.packageLabel),
    selectPackagePlaceholder: pickLocalizedOr(
      doc?.selectPackagePlaceholder,
      locale,
      defaultFormMessages.selectPackagePlaceholder,
    ),
    eventTimeLabel: pickLocalizedOr(doc?.eventTimeLabel, locale, defaultFormMessages.eventTimeLabel),
    numberOfPeopleLabel: pickLocalizedOr(doc?.numberOfPeopleLabel, locale, defaultFormMessages.numberOfPeopleLabel),
    guestsPlaceholder: pickLocalizedOr(doc?.guestsPlaceholder, locale, defaultFormMessages.guestsPlaceholder),
    additionalServicesLabel: pickLocalizedOr(
      doc?.additionalServicesLabel,
      locale,
      defaultFormMessages.additionalServicesLabel,
    ),
    commentLabel: pickLocalizedOr(doc?.commentLabel, locale, defaultFormMessages.commentLabel),
    guestsRangeMessage: pickLocalizedOr(doc?.guestsRangeMessage, locale, defaultFormMessages.guestsRangeMessage),
    invalidPhoneMessage: pickLabel(doc?.extraLabels, "invalidPhoneMessage", locale, defaultFormMessages.invalidPhoneMessage),
    fileRequiredMessage: pickLabel(doc?.extraLabels, "fileRequiredMessage", locale, defaultFormMessages.fileRequiredMessage),
    fileTypeMessage: pickLabel(doc?.extraLabels, "fileTypeMessage", locale, defaultFormMessages.fileTypeMessage),
    fileSizeMessage: pickLabel(doc?.extraLabels, "fileSizeMessage", locale, defaultFormMessages.fileSizeMessage),
    uploadCvLabel: pickLabel(doc?.extraLabels, "uploadCvLabel", locale, defaultFormMessages.uploadCvLabel),
    removeFileLabel: pickLabel(doc?.extraLabels, "removeFileLabel", locale, defaultFormMessages.removeFileLabel),
    shortMessageLabel: pickLabel(doc?.extraLabels, "shortMessageLabel", locale, defaultFormMessages.shortMessageLabel),
    sendingLabel: pickLabel(doc?.extraLabels, "sendingLabel", locale, defaultFormMessages.sendingLabel),
    applicationSentLabel: pickLabel(doc?.extraLabels, "applicationSentLabel", locale, defaultFormMessages.applicationSentLabel),
    sendApplicationLabel: pickLabel(doc?.extraLabels, "sendApplicationLabel", locale, defaultFormMessages.sendApplicationLabel),
    submitCvLabel: pickLabel(doc?.extraLabels, "submitCvLabel", locale, defaultFormMessages.submitCvLabel),
    formNotConfiguredMessage: pickLabel(
      doc?.extraLabels,
      "formNotConfiguredMessage",
      locale,
      defaultFormMessages.formNotConfiguredMessage,
    ),
    contactFormMessagePlaceholder: pickLabel(
      doc?.extraLabels,
      "contactFormMessagePlaceholder",
      locale,
      defaultFormMessages.contactFormMessagePlaceholder,
    ),
    contactFallbackNote: pickLabel(doc?.extraLabels, "contactFallbackNote", locale, defaultFormMessages.contactFallbackNote),
  };
}

export interface ResolvedPrivacyPolicy {
  title: string;
  subtitle: string;
  lastUpdated: string | null;
  body: unknown | null;
}

// Loosely typed on purpose (not the generated `LegalPage`) — same reasoning
// as `lib/sanityNav.ts`'s `SanityFooterDoc`: TypeGen's `StegaString` branded
// type on `pageKey` (unused here) doesn't need to leak into this signature.
interface SanityLegalPageDoc {
  title?: I18nEntry<string>[] | null;
  subtitle?: I18nEntry<string>[] | null;
  lastUpdated?: string | null;
  body?: I18nEntry<unknown>[] | null;
}

const defaultPrivacyPolicy = {
  title: "Privacy Policy",
  subtitle: "How RORUM handles personal information submitted through this website.",
};

export function resolvePrivacyPolicy(doc: SanityLegalPageDoc | null | undefined, locale: Locale): ResolvedPrivacyPolicy {
  return {
    title: pickLocalizedOr(doc?.title, locale, defaultPrivacyPolicy.title),
    subtitle: pickLocalizedOr(doc?.subtitle, locale, defaultPrivacyPolicy.subtitle),
    lastUpdated: doc?.lastUpdated ?? null,
    body: pickLocalized(doc?.body, locale) ?? null,
  };
}
