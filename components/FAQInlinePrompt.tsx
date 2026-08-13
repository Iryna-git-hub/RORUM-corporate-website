"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { ArrowRight } from "lucide-react";
import { useFormContent } from "@/components/FormContentProvider";

// Split out of ui.tsx (a Server-Component-friendly file with no "use client")
// because this one component needs `useFormContent()` for its default
// question/label text when a page renders it without explicit props (most
// callers - catering/host-at-rorum/event-decoration - do exactly that).
// Re-exported from ui.tsx so every existing `import { FAQInlinePrompt } from
// "@/components/ui"` keeps working unchanged.
export function FAQInlinePrompt({
  href = "/faq",
  question,
  label,
  questionClassName = "",
  className = "",
  linkClassName = "",
}: {
  href?: string;
  question?: string;
  label?: string;
  questionClassName?: string;
  className?: string;
  linkClassName?: string;
}) {
  const { messages } = useFormContent();

  return (
    // `faq-inline-prompt`/`faq-inline-prompt-link` are kept (deferred, like
    // `section-head`): several other, not-yet-converted pages
    // (catering, community-membership, forms) reach into them with their
    // own `.some-wrapper .faq-inline-prompt(-link)` color overrides. The
    // base declarations themselves are gone (fully replaced by the
    // Tailwind utilities below); only the class names still need to exist
    // for those external selectors to keep matching.
    // The `p.faq-inline-prompt` tag+class rule (more specific than the
    // class-only base rule) set font-size to 0.95rem, not the base rule's
    // 0.8125rem - that's the actual effective value reflected below.
    <p
      className={`faq-inline-prompt flex flex-wrap items-center gap-x-2 gap-y-1 m-0 text-[0.95rem] font-medium leading-[1.4] text-[rgba(var(--rgb-dark-brown),0.62)] max-sm:justify-center max-sm:text-center ${className}`.trim()}
    >
      <span className={questionClassName}>{question || messages.faqQuestion}</span>
      <Link
        className={`faq-inline-prompt-link group inline-flex items-center gap-1 text-red font-semibold no-underline transition-opacity duration-[160ms] ease-[ease] hover:opacity-75 ${linkClassName}`.trim()}
        href={href}
      >
        <span>{label || messages.faqLabel}</span>
        <ArrowRight
          className="w-[13px] h-[13px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1"
          aria-hidden="true"
          strokeWidth={1.9}
        />
      </Link>
    </p>
  );
}
