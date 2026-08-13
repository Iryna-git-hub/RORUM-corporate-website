"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultFormMessages, type ResolvedFormMessages, type ResolvedPrivacyPolicy } from "@/lib/sanityForms";

// Every form on the site (Contact, Catering inquiry, booking/decoration
// inquiry, the privacy-consent checkbox + modal, the FAQ inline prompt) is
// rendered by a small "use client" component several layers below the
// Server Component page that can call sanityFetch. Threading formMessages/
// the privacy-policy doc through every intermediate component's props would
// mean touching ~8 page files and ~6 shared components just to pass the same
// bundle down. Fetching it once in app/[locale]/(site)/layout.tsx (same
// Server Component that already resolves navigation/footer) and exposing it
// via context is the same "resolve once, read anywhere" shape as useLocale(),
// just for content instead of routing state.
const defaultPrivacyPolicy: ResolvedPrivacyPolicy = {
  title: "Privacy Policy",
  subtitle: "How RORUM handles personal information submitted through this website.",
  lastUpdated: null,
  body: null,
};

interface FormContentValue {
  messages: ResolvedFormMessages;
  privacyPolicy: ResolvedPrivacyPolicy;
}

const FormContentContext = createContext<FormContentValue>({
  messages: defaultFormMessages,
  privacyPolicy: defaultPrivacyPolicy,
});

export function FormContentProvider({
  value,
  children,
}: {
  value: FormContentValue;
  children: ReactNode;
}) {
  return <FormContentContext.Provider value={value}>{children}</FormContentContext.Provider>;
}

export function useFormContent(): FormContentValue {
  return useContext(FormContentContext);
}
